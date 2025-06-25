export interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  apiBaseUrl: string;
  wsBaseUrl: string;
  contractAddresses: {
    evm: {
      usdcToken: string;
      zdltToken: string;
      ammRouter: string;
      epochManager: string;
      oracle: string;
      emergencyStop: string;
    };
    svm: {
      usdcToken: string;
      zdltToken: string;
      ammProgram: string;
      epochProgram: string;
      oracleProgram: string;
      emergencyProgram: string;
    };
  };
  rpcUrls: {
    ethereum: string;
    polygon: string;
    solana: string;
  };
  features: {
    enableMockData: boolean;
    enableRealTimeUpdates: boolean;
    enableAnalytics: boolean;
  };
}

const environment: EnvironmentConfig = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
  wsBaseUrl: process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:3001',
  
  contractAddresses: {
    evm: {
      usdcToken: process.env.REACT_APP_EVM_USDC_TOKEN || '0xa0b86a33e6c3fa',
      zdltToken: process.env.REACT_APP_EVM_ZDLT_TOKEN || '0xb1c97a44e7d3fb',
      ammRouter: process.env.REACT_APP_EVM_AMM_ROUTER || '0xc2d8b55f8e4fc',
      epochManager: process.env.REACT_APP_EVM_EPOCH_MANAGER || '0xd3e9c66g9f5gd',
      oracle: process.env.REACT_APP_EVM_ORACLE || '0xe4fad77hafhe',
      emergencyStop: process.env.REACT_APP_EVM_EMERGENCY || '0xf5gb88igbigi'
    },
    svm: {
      usdcToken: process.env.REACT_APP_SVM_USDC_TOKEN || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      zdltToken: process.env.REACT_APP_SVM_ZDLT_TOKEN || 'BYXVypZZLzY2XvmwnYRYF6jfN8z2RTMrw7TKQFKXKx3r',
      ammProgram: process.env.REACT_APP_SVM_AMM_PROGRAM || 'CTokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      epochProgram: process.env.REACT_APP_SVM_EPOCH_PROGRAM || 'DTokenHQxbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      oracleProgram: process.env.REACT_APP_SVM_ORACLE_PROGRAM || 'ETokenIRybdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      emergencyProgram: process.env.REACT_APP_SVM_EMERGENCY_PROGRAM || 'FTokenJSzcGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
    }
  },
  
  rpcUrls: {
    ethereum: process.env.REACT_APP_ETHEREUM_RPC || 'https://mainnet.infura.io/v3/YOUR_KEY',
    polygon: process.env.REACT_APP_POLYGON_RPC || 'https://polygon-rpc.com',
    solana: process.env.REACT_APP_SOLANA_RPC || 'https://api.mainnet-beta.solana.com'
  },
  
  features: {
    enableMockData: process.env.REACT_APP_ENABLE_MOCK_DATA === 'true' || process.env.NODE_ENV === 'development',
    enableRealTimeUpdates: process.env.REACT_APP_ENABLE_REALTIME !== 'false',
    enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true'
  }
};

export default environment;

// Helper functions
export const isMockDataEnabled = () => environment.features.enableMockData;
export const isRealTimeEnabled = () => environment.features.enableRealTimeUpdates;
export const getContractAddress = (chain: 'evm' | 'svm', contract: string) => {
  return environment.contractAddresses[chain]?.[contract as keyof typeof environment.contractAddresses.evm] || '';
};
export const getRpcUrl = (network: keyof typeof environment.rpcUrls) => {
  return environment.rpcUrls[network];
}; 