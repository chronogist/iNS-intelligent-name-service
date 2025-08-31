import { writeFile } from "fs/promises";
import { readFile } from "fs/promises";
import dotenv from "dotenv";
import { JsonRpcProvider, Wallet, ContractFactory, parseEther, parseUnits, keccak256, toUtf8Bytes, AbiCoder, NonceManager } from "ethers";

dotenv.config();

const RPC_URL = process.env.OG_RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // HH account #0 (f39fd6e51aad88f6f4ce6ab8827279cfffb92266)
const GAS_PRICE = process.env.GAS_PRICE_GWEI ? parseUnits(process.env.GAS_PRICE_GWEI, "gwei") : parseUnits("1", "gwei");

function namehash(name: string): `0x${string}` {
	let node = ("0x" + "00".repeat(32)) as `0x${string}`;
	if (name) {
		const labels = name.split(".");
		for (let i = labels.length - 1; i >= 0; i--) {
			const labelHash = keccak256(toUtf8Bytes(labels[i])) as `0x${string}`;
			const coder = new AbiCoder();
			node = keccak256(coder.encode(["bytes32", "bytes32"], [node, labelHash])) as `0x${string}`;
		}
	}
	return node;
}

async function main() {
	const provider = new JsonRpcProvider(RPC_URL);
	const baseWallet = new Wallet(PRIVATE_KEY, provider);
	const wallet = new NonceManager(baseWallet);
	console.log("Deployer:", await wallet.getAddress());

	// Load artifacts
	const regArtifact = JSON.parse(await readFile("artifacts/contracts/Name0gRegistry.sol/Name0gRegistry.json", "utf8"));
	const registrarArtifact = JSON.parse(await readFile("artifacts/contracts/Name0gRegistrar7857.sol/Name0gRegistrar7857.json", "utf8"));
	const resolverArtifact = JSON.parse(await readFile("artifacts/contracts/Name0gSimpleResolver.sol/Name0gSimpleResolver.json", "utf8"));
	const reverseArtifact = JSON.parse(await readFile("artifacts/contracts/ReverseRegistrar.sol/ReverseRegistrar.json", "utf8"));

	// Deploy registry
	const RegistryF = new ContractFactory(regArtifact.abi, regArtifact.bytecode, wallet);
	const registry = await RegistryF.deploy({ gasPrice: GAS_PRICE });
	await registry.waitForDeployment();
	const registryAddr = await registry.getAddress();
	console.log("Registry:", registryAddr);

	const baseNode = namehash("0g");
	await (await (registry as any).bootstrapSetOwner(baseNode, await wallet.getAddress(), { gasPrice: GAS_PRICE })).wait();

	// Deploy registrar
	const RegistrarF = new ContractFactory(registrarArtifact.abi, registrarArtifact.bytecode, wallet);
	const registrar = await RegistrarF.deploy(registryAddr, baseNode, "0x0000000000000000000000000000000000000000", { gasPrice: GAS_PRICE });
	await registrar.waitForDeployment();
	const registrarAddr = await registrar.getAddress();
	console.log("Registrar:", registrarAddr);

	// Verify interfaces
	const erc7857Id = await (registrar as any).erc7857InterfaceId();
	const ERC721_INTERFACE_ID = "0x80ac58cd" as const;
	const supports7857 = await (registrar as any).supportsInterface(erc7857Id);
	const supports721 = await (registrar as any).supportsInterface(ERC721_INTERFACE_ID);
	console.log("Registrar supports:", { erc7857: supports7857, erc721: supports721, erc7857Id });

	await (await (registry as any).setOwner(baseNode, registrarAddr, { gasPrice: GAS_PRICE })).wait();

	// Deploy resolver
	const ResolverF = new ContractFactory(resolverArtifact.abi, resolverArtifact.bytecode, wallet);
	const resolver = await ResolverF.deploy(registryAddr, { gasPrice: GAS_PRICE });
	await resolver.waitForDeployment();
	const resolverAddr = await resolver.getAddress();
	console.log("Resolver:", resolverAddr);

	// Deploy ReverseRegistrar and bootstrap addr.reverse
	const ReverseF = new ContractFactory(reverseArtifact.abi, reverseArtifact.bytecode, wallet);
	const reverse = await ReverseF.deploy(registryAddr, resolverAddr, { gasPrice: GAS_PRICE });
	await reverse.waitForDeployment();
	const reverseAddr = await reverse.getAddress();
	console.log("ReverseRegistrar:", reverseAddr);

	// set owner of base reverse node: addr.reverse → ReverseRegistrar
	const ADDR_LABEL = keccak256(toUtf8Bytes("addr")) as `0x${string}`;
	const ROOT_NODE = ("0x" + "00".repeat(32)) as `0x${string}`; // root
	await (await (registry as any).setSubnodeOwner(ROOT_NODE, ADDR_LABEL, reverseAddr, { gasPrice: GAS_PRICE })).wait();

	console.log("Base node:", baseNode);

	await (await (registrar as any).setPrice(parseEther("0.01"), { gasPrice: GAS_PRICE })).wait();

	const addresses = { registry: registryAddr, registrar: registrarAddr, resolver: resolverAddr, reverse: reverseAddr, baseNode };
	await writeFile(".ins.addresses.json", JSON.stringify(addresses, null, 2));
	console.log("Saved .ins.addresses.json");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});


