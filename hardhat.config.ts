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
      chainId: 1337,
    },
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
  },
  etherscan: {
    apiKey: process.env.ETH_API_KEY,
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
    ],
  },
};

export default config;
