require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const OG_TESTNET_RPC = process.env.OG_TESTNET_RPC || "https://evmrpc-testnet.0g.ai";
const OG_MAINNET_RPC = process.env.OG_MAINNET_RPC || "https://evmrpc-mainnet.0g.ai";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    ogTestnet: {
      url: OG_TESTNET_RPC,
      chainId: 16602,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
    ogMainnet: {
      url: OG_MAINNET_RPC,
      chainId: 16602,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
  },
  etherscan: {
    apiKey: {
      ogTestnet: ETHERSCAN_API_KEY,
      ogMainnet: ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: "ogTestnet",
        chainId: 16602,
        urls: {
          apiURL: "https://chainscan-galileo.0g.ai/api",
          browserURL: "https://chainscan-galileo.0g.ai",
        },
      },
      {
        network: "ogMainnet",
        chainId: 16602,
        urls: {
          apiURL: "https://chainscan-galileo.0g.ai/api",
          browserURL: "https://chainscan-galileo.0g.ai",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};