import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-viem";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // default HH key 0 (f39fd6e51aad88f6f4ce6ab8827279cfffb92266)
const OG_RPC_URL = process.env.OG_RPC_URL || "http://127.0.0.1:8545"; // default to local

const config: HardhatUserConfig = {
	solidity: {
		version: "0.8.24",
		settings: {
			optimizer: { enabled: true, runs: 200 }
		}
	},
	networks: {
		og: {
			type: "http",
			url: OG_RPC_URL,
			accounts: [PRIVATE_KEY],
			chainId: 16601,
			gasPrice: 1_000_000_000
		},
		localhost: {
			type: "http",
			url: "http://127.0.0.1:8545"
		}
	}
};

export default config;


