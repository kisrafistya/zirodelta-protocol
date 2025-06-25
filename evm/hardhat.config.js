require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      gas: 12000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    goerli: {
      url: process.env.GOERLI_RPC_URL || "https://goerli.example.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://mumbai.example.com", 
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    mainnet: {
      url: process.env.ETHEREUM_RPC_URL || "https://mainnet.example.com",
      accounts: process.env.PRODUCTION_PRIVATE_KEY ? [process.env.PRODUCTION_PRIVATE_KEY] : [],
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon.example.com",
      accounts: process.env.PRODUCTION_PRIVATE_KEY ? [process.env.PRODUCTION_PRIVATE_KEY] : [],
    },
  },
  mocha: {
    timeout: 60000, // 60 seconds
    reporter: 'spec', // Default to spec reporter for clear output
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    gasPrice: 20, // gwei
    showTimeSpent: true,
    showMethodSig: true,
  },
};
