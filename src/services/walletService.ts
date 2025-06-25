import Web3 from 'web3';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

export interface WalletConnection {
  address: string;
  balance: number;
  connected: boolean;
}

export class EVMWalletService {
  private web3: Web3 | null = null;
  private provider: any = null;

  async connectMetaMask(): Promise<WalletConnection> {
    try {
      if (typeof window.ethereum !== 'undefined') {
        this.provider = window.ethereum;
        this.web3 = new Web3(this.provider);

        // Request account access
        const accounts = await this.provider.request({
          method: 'eth_requestAccounts',
        });

        if (accounts.length > 0) {
          const address = accounts[0];
          const balance = await this.web3.eth.getBalance(address);
          const ethBalance = parseFloat(Web3.utils.fromWei(balance, 'ether'));

          return {
            address,
            balance: ethBalance,
            connected: true,
          };
        }
      }
      throw new Error('MetaMask not found');
    } catch (error) {
      console.error('Failed to connect MetaMask:', error);
      throw error;
    }
  }

  async switchChain(chainId: string): Promise<void> {
    if (!this.provider) throw new Error('No provider connected');

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        const chainConfigs: Record<string, any> = {
          '0x89': {
            chainId: '0x89',
            chainName: 'Polygon Mainnet',
            rpcUrls: ['https://polygon-rpc.com/'],
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18,
            },
            blockExplorerUrls: ['https://polygonscan.com/'],
          },
          '0xa4b1': {
            chainId: '0xa4b1',
            chainName: 'Arbitrum One',
            rpcUrls: ['https://arb1.arbitrum.io/rpc'],
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            blockExplorerUrls: ['https://arbiscan.io/'],
          },
        };

        if (chainConfigs[chainId]) {
          await this.provider.request({
            method: 'wallet_addEthereumChain',
            params: [chainConfigs[chainId]],
          });
        }
      }
    }
  }

  async estimateGas(transaction: any): Promise<string> {
    if (!this.web3) throw new Error('Web3 not initialized');
    
    try {
      const gasEstimate = await this.web3.eth.estimateGas(transaction);
      const gasPrice = await this.web3.eth.getGasPrice();
      const totalGas = BigInt(gasEstimate) * BigInt(gasPrice);
      
      return Web3.utils.fromWei(totalGas.toString(), 'ether');
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return '0.001'; // Default estimate
    }
  }

  async sendTransaction(transaction: any): Promise<string> {
    if (!this.web3 || !this.provider) throw new Error('Wallet not connected');

    try {
      const accounts = await this.provider.request({
        method: 'eth_accounts',
      });

      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          ...transaction,
        }],
      });

      return txHash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  disconnect(): void {
    this.web3 = null;
    this.provider = null;
  }
}

export class SVMWalletService {
  private connection: Connection;
  private wallet: any = null;

  constructor() {
    this.connection = new Connection('https://api.mainnet-beta.solana.com');
  }

  async connectPhantom(): Promise<WalletConnection> {
    try {
      if (typeof window.solana !== 'undefined' && window.solana.isPhantom) {
        const response = await window.solana.connect();
        this.wallet = window.solana;

        const publicKey = new PublicKey(response.publicKey.toString());
        const balance = await this.connection.getBalance(publicKey);
        const solBalance = balance / 1e9; // Convert lamports to SOL

        return {
          address: publicKey.toString(),
          balance: solBalance,
          connected: true,
        };
      }
      throw new Error('Phantom wallet not found');
    } catch (error) {
      console.error('Failed to connect Phantom:', error);
      throw error;
    }
  }

  async sendTransaction(transaction: Transaction): Promise<string> {
    if (!this.wallet) throw new Error('Wallet not connected');

    try {
      const { signature } = await this.wallet.signAndSendTransaction(transaction);
      return signature;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  async estimateFee(transaction: Transaction): Promise<number> {
    try {
      const recentBlockhash = await this.connection.getRecentBlockhash();
      transaction.recentBlockhash = recentBlockhash.blockhash;
      
      const fee = await this.connection.getFeeForMessage(
        transaction.compileMessage(),
        'confirmed'
      );
      
      return (fee.value || 5000) / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Failed to estimate fee:', error);
      return 0.000005; // Default estimate
    }
  }

  disconnect(): void {
    if (this.wallet) {
      this.wallet.disconnect();
      this.wallet = null;
    }
  }
}

// Global wallet service instances
export const evmWalletService = new EVMWalletService();
export const svmWalletService = new SVMWalletService();

// Utility functions
export const formatAddress = (address: string, length: number = 4): string => {
  if (!address) return '';
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
};

export const validateAddress = (address: string, chain: 'EVM' | 'SVM'): boolean => {
  if (chain === 'EVM') {
    return Web3.utils.isAddress(address);
  } else {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }
};

// Declare global types for wallet providers
declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
  }
}
