import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { evmWalletService, svmWalletService, formatAddress } from '@/services/walletService';
import { ContractServiceFactory, EVMContractService, SVMContractService } from '@/services/contractService';

type Chain = 'EVM' | 'SVM';
type WalletType = 'MetaMask' | 'Phantom' | null;
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface TokenBalance {
  symbol: string;
  balance: number;
  address: string;
}

interface WalletContextType {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  walletType: WalletType;
  chain: Chain;
  chainId: number | null;
  address: string | null;
  balances: TokenBalance[];
  nativeBalance: number;
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;
  switchChain: (chain: Chain, chainId?: number) => Promise<void>;
  getBalance: (token: string) => number;
  refreshBalances: () => Promise<void>;
  contractService: EVMContractService | SVMContractService | null;
  error: string | null;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [chain, setChain] = useState<Chain>('EVM');
  const [chainId, setChainId] = useState<number | null>(1); // Default to Ethereum mainnet
  const [address, setAddress] = useState<string | null>(null);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [nativeBalance, setNativeBalance] = useState(0);
  const [contractService, setContractService] = useState<EVMContractService | SVMContractService | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isConnected = connectionStatus === 'connected';

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateContractService = useCallback(() => {
    try {
      if (chain === 'EVM' && window.ethereum) {
        const service = ContractServiceFactory.createEVMService(window.ethereum, chainId || 1);
        setContractService(service);
      } else if (chain === 'SVM') {
        const service = ContractServiceFactory.createSVMService();
        setContractService(service);
      }
    } catch (error) {
      console.error('Failed to update contract service:', error);
    }
  }, [chain, chainId]);

  const refreshBalances = useCallback(async () => {
    if (!address || !contractService) return;

    try {
      const tokenAddresses = {
        EVM: {
          USDC: '0xA0b86a33E6B34c3e8b8B0c11f5f8e6A5A5A5A5A5',
          ZDLT: '0x456def789abc123456789def456abc789def456a'
        },
        SVM: {
          USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          ZDLT: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
        }
      };

      const addresses = tokenAddresses[chain];
      const newBalances: TokenBalance[] = [];

      for (const [symbol, tokenAddress] of Object.entries(addresses)) {
        try {
          const balance = await contractService.getTokenBalance(address, tokenAddress);
          newBalances.push({
            symbol,
            balance,
            address: tokenAddress
          });
        } catch (error) {
          console.error(`Failed to get ${symbol} balance:`, error);
          // Add mock balance for demo
          newBalances.push({
            symbol,
            balance: symbol === 'USDC' ? 10000 : 5000,
            address: tokenAddress
          });
        }
      }

      // Add mock PFRT/NFRT balances
      newBalances.push(
        { symbol: 'PFRT', balance: 0, address: 'mock-pfrt' },
        { symbol: 'NFRT', balance: 0, address: 'mock-nfrt' }
      );

      setBalances(newBalances);

      // Update native balance (ETH/SOL)
      if (chain === 'EVM') {
        setNativeBalance(2.5); // Mock ETH balance
      } else {
        setNativeBalance(150); // Mock SOL balance
      }
    } catch (error) {
      console.error('Failed to refresh balances:', error);
      setError('Failed to refresh wallet balances');
    }
  }, [address, contractService, chain]);

  const connect = async (selectedWalletType: WalletType) => {
    if (!selectedWalletType) return;

    setConnectionStatus('connecting');
    setError(null);

    try {
      if (selectedWalletType === 'MetaMask') {
        const connection = await evmWalletService.connectMetaMask();
        setWalletType('MetaMask');
        setChain('EVM');
        setAddress(connection.address);
        setNativeBalance(connection.balance);
        
        // Get chain ID
        if (window.ethereum) {
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
          setChainId(parseInt(chainIdHex, 16));
        }
      } else if (selectedWalletType === 'Phantom') {
        const connection = await svmWalletService.connectPhantom();
        setWalletType('Phantom');
        setChain('SVM');
        setAddress(connection.address);
        setNativeBalance(connection.balance);
        setChainId(null); // Solana doesn't use chain IDs like EVM
      }
      
      setConnectionStatus('connected');
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setError(error.message || 'Failed to connect wallet');
      setConnectionStatus('error');
      
      // Reset state on error
      setWalletType(null);
      setAddress(null);
      setNativeBalance(0);
      setBalances([]);
    }
  };

  const disconnect = useCallback(() => {
    // Disconnect from wallet services
    if (walletType === 'MetaMask') {
      evmWalletService.disconnect();
    } else if (walletType === 'Phantom') {
      svmWalletService.disconnect();
    }

    // Reset state
    setConnectionStatus('disconnected');
    setWalletType(null);
    setAddress(null);
    setChainId(null);
    setBalances([]);
    setNativeBalance(0);
    setContractService(null);
    setError(null);
  }, [walletType]);

  const switchChain = async (newChain: Chain, newChainId?: number) => {
    try {
      if (newChain === 'EVM') {
        if (walletType !== 'MetaMask') {
          await connect('MetaMask');
          return;
        }
        
        if (newChainId && window.ethereum) {
          await evmWalletService.switchChain(`0x${newChainId.toString(16)}`);
          setChainId(newChainId);
        }
      } else if (newChain === 'SVM') {
        if (walletType !== 'Phantom') {
          await connect('Phantom');
          return;
        }
      }
      
      setChain(newChain);
    } catch (error: any) {
      console.error('Failed to switch chain:', error);
      setError(error.message || 'Failed to switch chain');
    }
  };

  const getBalance = useCallback((token: string): number => {
    const tokenBalance = balances.find(b => b.symbol === token);
    if (tokenBalance) return tokenBalance.balance;
    
    // Return native balance for chain tokens
    if ((token === 'ETH' && chain === 'EVM') || (token === 'SOL' && chain === 'SVM')) {
      return nativeBalance;
    }
    
    return 0;
  }, [balances, nativeBalance, chain]);

  // Update contract service when chain or connection changes
  useEffect(() => {
    if (isConnected) {
      updateContractService();
    }
  }, [isConnected, updateContractService]);

  // Refresh balances when contract service is available
  useEffect(() => {
    if (isConnected && contractService && address) {
      refreshBalances();
    }
  }, [isConnected, contractService, address, refreshBalances]);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== address) {
          setAddress(accounts[0]);
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
      };

      const handleDisconnect = () => {
        disconnect();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      };
    }
  }, [address, disconnect]);

  const value: WalletContextType = {
    isConnected,
    connectionStatus,
    walletType,
    chain,
    chainId,
    address,
    balances,
    nativeBalance,
    connect,
    disconnect,
    switchChain,
    getBalance,
    refreshBalances,
    contractService,
    error,
    clearError
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
