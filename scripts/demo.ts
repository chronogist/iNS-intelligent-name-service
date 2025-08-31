import { readFile } from "fs/promises";
import dotenv from "dotenv";
import { JsonRpcProvider, Wallet, Contract, parseUnits, keccak256, toUtf8Bytes, AbiCoder } from "ethers";

dotenv.config();

const RPC_URL = process.env.OG_RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY_0 = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const BUYER_PRIVATE_KEY = process.env.BUYER_PRIVATE_KEY || process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const GAS_PRICE = process.env.GAS_PRICE_GWEI ? parseUnits(process.env.GAS_PRICE_GWEI, "gwei") : parseUnits("1", "gwei");

function namehash(name: string): `0x${string}` {
	let node = ("0x" + "00".repeat(32)) as `0x${string}`;
	if (name) {
		const labels = name.split(".");
		for (let i = labels.length - 1; i >= 0; i--) {
			const coder = new AbiCoder();
			const labelHash = keccak256(toUtf8Bytes(labels[i])) as `0x${string}`;
			node = keccak256(coder.encode(["bytes32", "bytes32"], [node, labelHash])) as `0x${string}`;
		}
	}
	return node;
}

async function main() {
	const provider = new JsonRpcProvider(RPC_URL);
	const deployer = new Wallet(PRIVATE_KEY_0, provider);
	const buyer = new Wallet(BUYER_PRIVATE_KEY, provider);
	console.log("Buyer:", await buyer.getAddress());

	const addrs = JSON.parse(await readFile(".ins.addresses.json", "utf8"));
	const registryAddr = addrs.registry as `0x${string}`;
	const registrarAddr = addrs.registrar as `0x${string}`;
	const resolverAddr = addrs.resolver as `0x${string}`;

	const registrarArtifact = JSON.parse(await readFile("artifacts/contracts/Name0gRegistrar7857.sol/Name0gRegistrar7857.json", "utf8"));
	const resolverArtifact = JSON.parse(await readFile("artifacts/contracts/Name0gSimpleResolver.sol/Name0gSimpleResolver.json", "utf8"));
	const registryArtifact = JSON.parse(await readFile("artifacts/contracts/Name0gRegistry.sol/Name0gRegistry.json", "utf8"));

	const registrar = new Contract(registrarAddr, registrarArtifact.abi, provider);
	const registrarBuyer = registrar.connect(buyer);
	const resolver = new Contract(resolverAddr, resolverArtifact.abi, provider);
	const registry = new Contract(registryAddr, registryArtifact.abi, provider);

	// Detect standard via ERC-165 using on-chain interface ids
	const ERC721_INTERFACE_ID = "0x80ac58cd" as const;
	const erc7857Id = await (registrar as any).erc7857InterfaceId();
	const is7857 = await (registrar as any).supportsInterface(erc7857Id);
	const is721 = await (registrar as any).supportsInterface(ERC721_INTERFACE_ID);
	console.log("Registrar supports:", { erc7857: is7857, erc721: is721, erc7857Id: erc7857Id });

	const label = `king`;
	const node = namehash(`${label}.0g`);
	const price = await registrar.priceWei();
	await (await (registrarBuyer as any).purchase(label, resolverAddr, 0, "encrypted://uri", keccak256(toUtf8Bytes("metadata")), { value: price, gasPrice: GAS_PRICE })).wait();
	console.log("Purchased:", label);

	await (await (registry.connect(buyer) as any).setResolver(node, resolverAddr, { gasPrice: GAS_PRICE })).wait();
	await (await (resolver.connect(buyer) as any).setAddr(node, await buyer.getAddress(), { gasPrice: GAS_PRICE })).wait();

	const resolved = await (resolver as any).addr(node);
	console.log("Resolved addr:", resolved);

	// Set reverse record so explorer/wallets that support reverse can show name
	const reverseArtifact = JSON.parse(await readFile("artifacts/contracts/ReverseRegistrar.sol/ReverseRegistrar.json", "utf8"));
	const addrs2 = JSON.parse(await readFile(".ins.addresses.json", "utf8"));
	const reverseAddr = addrs2.reverse as `0x${string}`;
	const reverse = new Contract(reverseAddr, reverseArtifact.abi, buyer);
	await (await (reverse as any).setName(`${label}.0g`, { gasPrice: GAS_PRICE })).wait();
	console.log("Set reverse name:", `${label}.0g`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});


