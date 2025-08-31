// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./Name0gRegistry.sol";
import "./IERC7857.sol";
import "./IOracle.sol";

// Minimal ERC-7857-like Registrar for name.0g MVP
// NOTE: This is simplified. It follows the spirit of ERC-7857 by coupling
// token ownership with pointers to encrypted metadata, but omits oracle logic.
contract Name0gRegistrar7857 is ERC721URIStorage, Ownable, ReentrancyGuard, IERC7857 {
	Name0gRegistry public immutable registry;
	bytes32 public immutable baseNode; // namehash("0g")

	IOracle public oracle; // optional, not used in MVP

	// ERC-7857-style state (simplified): metadata hash and encrypted URI per token
	mapping(uint256 => bytes32) private _metadataHashes;
	mapping(uint256 => string) private _encryptedURIs;
	mapping(uint256 => mapping(address => bytes)) private _authorizations;

	// node <-> token mapping
	mapping(bytes32 => uint256) public nodeToTokenId;
	mapping(uint256 => bytes32) public tokenIdToNode;

	uint256 private _nextId = 1;

	event NameRegistered(bytes32 indexed node, uint256 indexed tokenId, address owner, address resolver);
	event NameTransferred(bytes32 indexed node, address from, address to);
    // override event name collision: keep internal detail event
    event MetadataUpdatedFull(uint256 indexed tokenId, bytes32 newHash, string newEncryptedURI);

	constructor(Name0gRegistry _registry, bytes32 _baseNode, IOracle _oracle)
		ERC721("name.0g", "NAME0G")
		Ownable(msg.sender)
	{
		registry = _registry;
		baseNode = _baseNode;
		oracle = _oracle; // can be address(0) in MVP
	}

	function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
		address owner = ownerOf(tokenId);
		return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
	}

	function mint(
		string calldata label,
		address owner_,
		address resolver_,
		uint64 /*ttl*/,
		string calldata encryptedURI,
		bytes32 metadataHash
	) external onlyOwner returns (uint256 tokenId) {
		bytes32 labelhash = keccak256(abi.encodePacked(label));
		bytes32 node = keccak256(abi.encodePacked(baseNode, labelhash));
		require(nodeToTokenId[node] == 0, "taken");

		tokenId = _nextId++;
		_safeMint(owner_, tokenId);
		nodeToTokenId[node] = tokenId;
		tokenIdToNode[tokenId] = node;

		_metadataHashes[tokenId] = metadataHash;
		_encryptedURIs[tokenId] = encryptedURI;

		// set subnode owner directly to name owner for simplicity
		registry.setSubnodeOwner(baseNode, labelhash, owner_);

		// set tokenURI so explorers show name
		_setTokenURI(tokenId, _buildTokenURI(label));

		emit NameRegistered(node, tokenId, owner_, resolver_);
	}

	// IERC7857 transfer (simplified): proof ignored in MVP
	function transfer(address from, address to, uint256 tokenId, bytes calldata sealedKey, bytes calldata /*proof*/)
		external
		nonReentrant
	{
		require(_isApprovedOrOwner(msg.sender, tokenId), "not approved");
		_transfer(from, to, tokenId);

		bytes32 node = tokenIdToNode[tokenId];
		registry.setOwner(node, to);
		emit NameTransferred(node, from, to);

		// simplistic metadata update keyed off sealedKey hash
		bytes32 newHash = keccak256(sealedKey);
		_metadataHashes[tokenId] = newHash;
		emit MetadataUpdated(tokenId, newHash);
		emit MetadataUpdatedFull(tokenId, newHash, _encryptedURIs[tokenId]);
	}

	function setResolver(uint256 tokenId, address resolver) external {
		require(ownerOf(tokenId) == msg.sender, "not owner");
		registry.setResolver(tokenIdToNode[tokenId], resolver);
	}

	function getEncryptedURI(uint256 tokenId) external view returns (string memory) {
		return _encryptedURIs[tokenId];
	}

	function getMetadataHash(uint256 tokenId) external view returns (bytes32) {
		return _metadataHashes[tokenId];
	}

	function updateMetadata(uint256 tokenId, string calldata newEncryptedURI, bytes32 newHash) external {
		require(ownerOf(tokenId) == msg.sender, "not owner");
		_encryptedURIs[tokenId] = newEncryptedURI;
		_metadataHashes[tokenId] = newHash;
		emit MetadataUpdated(tokenId, newHash);
		emit MetadataUpdatedFull(tokenId, newHash, newEncryptedURI);
	}

	// IERC7857 authorizeUsage (simple mapping)
	function authorizeUsage(uint256 tokenId, address executor, bytes calldata permissions) external {
		require(ownerOf(tokenId) == msg.sender, "not owner");
		_authorizations[tokenId][executor] = permissions;
		emit UsageAuthorized(tokenId, executor);
	}

	function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721URIStorage) returns (bool) {
		return interfaceId == type(IERC7857).interfaceId || super.supportsInterface(interfaceId);
	}

	// Helper for off-chain tools to query the ERC-7857 interface id
	function erc7857InterfaceId() external pure returns (bytes4) {
		return type(IERC7857).interfaceId;
	}

	// Public purchase: flat price per label, mints to msg.sender
	uint256 public priceWei = 0.01 ether;
	function setPrice(uint256 newPrice) external onlyOwner { priceWei = newPrice; }

	function purchase(
		string calldata label,
		address resolver_,
		uint64 /*ttl*/,
		string calldata encryptedURI,
		bytes32 metadataHash
	) external payable returns (uint256 tokenId) {
		require(msg.value >= priceWei, "insufficient payment");

		bytes32 labelhash = keccak256(abi.encodePacked(label));
		bytes32 node = keccak256(abi.encodePacked(baseNode, labelhash));
		require(nodeToTokenId[node] == 0, "taken");

		tokenId = _nextId++;
		_safeMint(msg.sender, tokenId);
		nodeToTokenId[node] = tokenId;
		tokenIdToNode[tokenId] = node;

		_metadataHashes[tokenId] = metadataHash;
		_encryptedURIs[tokenId] = encryptedURI;

		// set subnode owner directly to buyer
		registry.setSubnodeOwner(baseNode, labelhash, msg.sender);

		// set tokenURI for display
		_setTokenURI(tokenId, _buildTokenURI(label));

		emit NameRegistered(node, tokenId, msg.sender, resolver_);
	}

	function withdraw(address payable to) external onlyOwner {
		to.transfer(address(this).balance);
	}

	function _buildTokenURI(string memory label) internal pure returns (string memory) {
		string memory nameJson = string.concat(label, ".0g");
		// simple on-chain SVG
		string memory svg = string(
			abi.encodePacked(
				'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">',
				'<rect width="100%" height="100%" fill="#0b1020"/>',
				'<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"',
				' font-family="monospace" font-size="36" fill="#b0ffa3">', nameJson, '</text>',
				'</svg>'
			)
		);
		string memory imageB64 = Base64.encode(bytes(svg));
		string memory imageUri = string.concat("data:image/svg+xml;base64,", imageB64);

		bytes memory jsonBytes = abi.encodePacked(
			'{"name":"', nameJson,
			'","description":"name.0g iNFT",',
			'"creator":"name.0g",',
			'"external_url":"https://0g.ai",',
			'"image":"', imageUri, '",',
			'"attributes":[{"trait_type":"TLD","value":"0g"}]}'
		);
		string memory jsonB64 = Base64.encode(jsonBytes);
		return string.concat("data:application/json;base64,", jsonB64);
	}
}


