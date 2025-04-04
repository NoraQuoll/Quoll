import { HardhatUserConfig } from "hardhat/config";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";

import * as dotenv from "dotenv";
dotenv.config();

const private_key = process.env.PK !== undefined ? [process.env.PK] : [];

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: {
      default: 0,
    },
    dev: {
      // Default to 1
      default: 1,
      // dev address mainnet
      // 1: "",
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://bsc-dataseed1.binance.org/",
        // blockNumber: 45810378,
      },

    },
    // hardhat: {
    //   chainId: 1337,
    // },
    goerli_arbi: {
      url: process.env.RPC, //"https://data-seed-prebsc-1-s3.binance.org:8545",
      accounts: private_key,
    },
    sepolia: {
      url: process.env.RPC, //"https://data-seed-prebsc-1-s3.binance.org:8545",
      accounts: private_key,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: private_key,
    },
    goerli: {
      url: process.env.RPC, //"https://data-seed-prebsc-1-s3.binance.org:8545",
      accounts: private_key,
    },
    testnet: {
      url: process.env.RPC, //"https://data-seed-prebsc-1-s3.binance.org:8545",
      accounts: private_key,
    },
    bsc: {
      url: process.env.RPC, //"https://data-seed-prebsc-1-s3.binance.org:8545",
      accounts: private_key,
    },
    arb: {
      url: process.env.RPC, //"https://data-seed-prebsc-1-s3.binance.org:8545",
      accounts: private_key,
    },
    blaze: {
      url: process.env.RPC, //"https://data-seed-prebsc-1-s3.binance.org:8545",
      chainId: 57054,
      accounts: private_key,
    },
    sonic: {
      url: process.env.RPC, //"https://data-seed-prebsc-1-s3.binance.org:8545",
      chainId: 146,
      accounts: private_key
    },
  },
  etherscan: {
    apiKey: {
      blaze: process.env.ETH_API_KEY!,
      sonic: process.env.ETH_API_KEY!,
      bscTestnet: process.env.ETH_API_KEY!,
      arbitrumOne: process.env.ETH_API_KEY!,
      bsc: process.env.ETH_API_KEY!,
    },
    customChains: [
      {
        network: "sonic",
        chainId: 146,
        urls: {
          apiURL: "https://api.sonicscan.org/api",
          browserURL: "https://sonicscan.org"
        }
      },
      {
        network: "blaze",
        chainId: 57054,
        urls: {
          apiURL: "https://api-testnet.sonicscan.org/api",
          browserURL: "https://testnet.sonicscan.org"
        }
      }
    ]

  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: true,
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.7.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.13",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
};

export default config;
