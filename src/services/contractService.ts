import Web3 from 'web3';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface ContractAddresses {
  factory: string;
  zdltToken: string;
  usdcToken: string;
  oracleManager: string;
  ammFactory: string;
}

export interface TokenBalance {
  symbol: string;
  balance: number;
  decimals: number;
  address: string;
}

export interface Market {
  id: string;
  symbol: string;
  pfrtToken: string;
  nfrtToken: string;
  collateralToken: string;
  expirationTime: number;
  totalCollateral: number;
  isActive: boolean;
}

export interface TradeOrder {
  id: string;
  market: string;
  tokenType: 'PFRT' | 'NFRT';
  orderType: 'BUY' | 'SELL';
  amount: number;
  price: number;
  filled: number;
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: number;
}

// EVM Contract Service
export class EVMContractService {
  private web3: Web3;
  private contracts: ContractAddresses;

  constructor(provider: any, chainId: number) {
    this.web3 = new Web3(provider);
    this.contracts = this.getContractAddresses(chainId);
  }

  private getContractAddresses(chainId: number): ContractAddresses {
    const addressMap: Record<number, ContractAddresses> = {
      1: { // Ethereum Mainnet
        factory: '0x742d35Cc6584C0532A3175e0115d8DC09892Cdd3',
        zdltToken: '0x456def789abc123456789def456abc789def456a',
        usdcToken: '0xA0b86a33E6B34c3e8b8B0c11f5f8e6A5A5A5A5A5',
        oracleManager: '0x789abc123def789abc123def789abc123def789a',
        ammFactory: '0xabc123def456abc123def456abc123def456abc1'
      },
      137: { // Polygon
        factory: '0x742d35Cc6584C0532A3175e0115d8DC09892Cdd3',
        zdltToken: '0x456def789abc123456789def456abc789def456a',
        usdcToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        oracleManager: '0x789abc123def789abc123def789abc123def789a',
        ammFactory: '0xabc123def456abc123def456abc123def456abc1'
      },
      42161: { // Arbitrum
        factory: '0x742d35Cc6584C0532A3175e0115d8DC09892Cdd3',
        zdltToken: '0x456def789abc123456789def456abc789def456a',
        usdcToken: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        oracleManager: '0x789abc123def789abc123def789abc123def789a',
        ammFactory: '0xabc123def456abc123def456abc123def456abc1'
      }
    };

    return addressMap[chainId] || addressMap[1];
  }

  async getTokenBalance(userAddress: string, tokenAddress: string): Promise<number> {
    try {
      // Mock ERC20 ABI for balanceOf
      const minABI = [
        {
          constant: true,
          inputs: [{ name: '_owner', type: 'address' }],
          name: 'balanceOf',
          outputs: [{ name: 'balance', type: 'uint256' }],
          type: 'function'
        },
        {
          constant: true,
          inputs: [],
          name: 'decimals',
          outputs: [{ name: '', type: 'uint8' }],
          type: 'function'
        }
      ];

      const contract = new this.web3.eth.Contract(minABI as any, tokenAddress);
      const balance = await contract.methods.balanceOf(userAddress).call() as string;
      const decimals = await contract.methods.decimals().call() as string;
      
      return parseFloat(this.web3.utils.fromWei(balance, 'ether')) * Math.pow(10, 18 - Number(decimals));
    } catch (error) {
      console.error('Failed to get token balance:', error);
      // Return mock data for demo
      const mockBalances: Record<string, number> = {
        [this.contracts.usdcToken]: 10000,
        [this.contracts.zdltToken]: 5000,
      };
      return mockBalances[tokenAddress] || 0;
    }
  }

  async mintConditionalTokens(marketId: string, collateralAmount: number): Promise<string> {
    try {
      const accounts = await this.web3.eth.getAccounts();
      const userAddress = accounts[0];

      // Mock transaction for demo
      const transaction = {
        from: userAddress,
        to: this.contracts.factory,
        data: this.web3.eth.abi.encodeFunctionCall({
          name: 'mintConditionalTokens',
          type: 'function',
          inputs: [
            { type: 'string', name: 'marketId' },
            { type: 'uint256', name: 'amount' }
          ]
        }, [marketId, this.web3.utils.toWei(collateralAmount.toString(), 'mwei')]), // USDC has 6 decimals
        value: '0',
        gas: '200000'
      };

      // Simulate transaction for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      return `0x${Math.random().toString(16).substr(2, 64)}`;
    } catch (error) {
      console.error('Minting failed:', error);
      throw error;
    }
  }

  async redeemTokens(marketId: string, tokenType: 'PFRT' | 'NFRT', amount: number): Promise<string> {
    try {
      const accounts = await this.web3.eth.getAccounts();
      const userAddress = accounts[0];

      const transaction = {
        from: userAddress,
        to: this.contracts.factory,
        data: this.web3.eth.abi.encodeFunctionCall({
          name: 'redeemTokens',
          type: 'function',
          inputs: [
            { type: 'string', name: 'marketId' },
            { type: 'uint8', name: 'tokenType' },
            { type: 'uint256', name: 'amount' }
          ]
        }, [marketId, tokenType === 'PFRT' ? 0 : 1, this.web3.utils.toWei(amount.toString(), 'ether')]),
        value: '0',
        gas: '150000'
      };

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      return `0x${Math.random().toString(16).substr(2, 64)}`;
    } catch (error) {
      console.error('Redemption failed:', error);
      throw error;
    }
  }

  async executeTradeOrder(order: Omit<TradeOrder, 'id' | 'status' | 'timestamp' | 'filled'>): Promise<string> {
    try {
      const accounts = await this.web3.eth.getAccounts();
      const userAddress = accounts[0];

      const transaction = {
        from: userAddress,
        to: this.contracts.ammFactory,
        data: this.web3.eth.abi.encodeFunctionCall({
          name: 'executeTrade',
          type: 'function',
          inputs: [
            { type: 'string', name: 'market' },
            { type: 'uint8', name: 'tokenType' },
            { type: 'uint8', name: 'orderType' },
            { type: 'uint256', name: 'amount' },
            { type: 'uint256', name: 'price' }
          ]
        }, [
          order.market,
          order.tokenType === 'PFRT' ? 0 : 1,
          order.orderType === 'BUY' ? 0 : 1,
          this.web3.utils.toWei(order.amount.toString(), 'ether'),
          this.web3.utils.toWei(order.price.toString(), 'ether')
        ]),
        value: '0',
        gas: '250000'
      };

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      return `0x${Math.random().toString(16).substr(2, 64)}`;
    } catch (error) {
      console.error('Trade execution failed:', error);
      throw error;
    }
  }

  async getMarkets(): Promise<Market[]> {
    // Mock market data for demo
    return [
      {
        id: 'btc-perp',
        symbol: 'BTC-PERP',
        pfrtToken: '0x1234567890abcdef1234567890abcdef12345678',
        nfrtToken: '0xabcdef1234567890abcdef1234567890abcdef12',
        collateralToken: this.contracts.usdcToken,
        expirationTime: Date.now() + (2 * 60 * 60 * 1000), // 2 hours
        totalCollateral: 89200000,
        isActive: true
      },
      {
        id: 'eth-perp',
        symbol: 'ETH-PERP',
        pfrtToken: '0x2345678901bcdef12345678901bcdef123456789',
        nfrtToken: '0xbcdef123456789abcdef123456789abcdef123456',
        collateralToken: this.contracts.usdcToken,
        expirationTime: Date.now() + (2 * 60 * 60 * 1000),
        totalCollateral: 67800000,
        isActive: true
      }
    ];
  }
}

// SVM Contract Service
export class SVMContractService {
  private connection: Connection;
  private programId: PublicKey;

  constructor(rpcUrl: string = 'https://api.mainnet-beta.solana.com') {
    this.connection = new Connection(rpcUrl);
    this.programId = new PublicKey('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');
  }

  async getTokenBalance(userAddress: string, tokenMint: string): Promise<number> {
    try {
      const userPubkey = new PublicKey(userAddress);
      const tokenMintPubkey = new PublicKey(tokenMint);

      const tokenAccounts = await this.connection.getTokenAccountsByOwner(userPubkey, {
        mint: tokenMintPubkey
      });

      if (tokenAccounts.value.length === 0) return 0;

      const balance = await this.connection.getTokenAccountBalance(tokenAccounts.value[0].pubkey);
      return parseFloat(balance.value.uiAmountString || '0');
    } catch (error) {
      console.error('Failed to get SOL token balance:', error);
      // Return mock data for demo
      const mockBalances: Record<string, number> = {
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 10000, // USDC
        'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 5000,  // ZDLT
      };
      return mockBalances[tokenMint] || 0;
    }
  }

  async mintConditionalTokens(marketId: string, collateralAmount: number, userWallet: any): Promise<string> {
    try {
      const transaction = new Transaction();
      
      // Mock instruction for demo
      const instruction = SystemProgram.transfer({
        fromPubkey: userWallet.publicKey,
        toPubkey: this.programId,
        lamports: collateralAmount * LAMPORTS_PER_SOL / 1000 // Mock conversion
      });

      transaction.add(instruction);

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      return Math.random().toString(36).substr(2, 44); // Mock Solana signature
    } catch (error) {
      console.error('SOL minting failed:', error);
      throw error;
    }
  }

  async redeemTokens(marketId: string, tokenType: 'PFRT' | 'NFRT', amount: number, userWallet: any): Promise<string> {
    try {
      const transaction = new Transaction();
      
      // Mock redemption instruction
      const instruction = SystemProgram.transfer({
        fromPubkey: this.programId,
        toPubkey: userWallet.publicKey,
        lamports: amount * LAMPORTS_PER_SOL / 1000
      });

      transaction.add(instruction);

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      return Math.random().toString(36).substr(2, 44);
    } catch (error) {
      console.error('SOL redemption failed:', error);
      throw error;
    }
  }

  async executeTradeOrder(order: Omit<TradeOrder, 'id' | 'status' | 'timestamp' | 'filled'>, userWallet: any): Promise<string> {
    try {
      const transaction = new Transaction();
      
      // Mock trade instruction
      const instruction = SystemProgram.transfer({
        fromPubkey: userWallet.publicKey,
        toPubkey: this.programId,
        lamports: order.amount * LAMPORTS_PER_SOL / 1000
      });

      transaction.add(instruction);

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      return Math.random().toString(36).substr(2, 44);
    } catch (error) {
      console.error('SOL trade execution failed:', error);
      throw error;
    }
  }

  async getMarkets(): Promise<Market[]> {
    // Mock market data for SVM
    return [
      {
        id: 'sol-perp',
        symbol: 'SOL-PERP',
        pfrtToken: 'BYXVypZZLzY2XvmwnYRYF6jfN8z2RTMrw7TKQFKXKx3r',
        nfrtToken: 'CTokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
        collateralToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        expirationTime: Date.now() + (2 * 60 * 60 * 1000),
        totalCollateral: 34500000,
        isActive: true
      }
    ];
  }
}

// Contract service factory
export class ContractServiceFactory {
  static createEVMService(provider: any, chainId: number): EVMContractService {
    return new EVMContractService(provider, chainId);
  }

  static createSVMService(rpcUrl?: string): SVMContractService {
    return new SVMContractService(rpcUrl);
  }
}

// Utility functions
export const formatTokenAmount = (amount: number, decimals: number = 18): string => {
  if (amount === 0) return '0';
  if (amount < 0.01) return '< 0.01';
  return amount.toFixed(2);
};

export const calculateSlippage = (expectedPrice: number, actualPrice: number): number => {
  return Math.abs((actualPrice - expectedPrice) / expectedPrice) * 100;
};

export const estimateGasUsage = (operation: string): number => {
  const gasEstimates: Record<string, number> = {
    'mint': 200000,
    'redeem': 150000,
    'trade': 250000,
    'approve': 50000,
    'transfer': 21000
  };
  
  return gasEstimates[operation] || 100000;
};
