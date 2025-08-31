// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Minimal ERC-7857 interface for MVP, aligned with 0G docs
// Ref: https://docs.0g.ai/developer-hub/building-on-0g/inft/erc7857
interface IERC7857 {
	// Emitted when metadata hash/URI changes (e.g., on transfer rekey)
	event MetadataUpdated(uint256 indexed tokenId, bytes32 newHash);
	// Emitted when usage authorization is granted/updated
	event UsageAuthorized(uint256 indexed tokenId, address indexed executor);

	function transfer(
		address from,
		address to,
		uint256 tokenId,
		bytes calldata sealedKey,
		bytes calldata proof
	) external;

	function authorizeUsage(
		uint256 tokenId,
		address executor,
		bytes calldata permissions
	) external;

	function getMetadataHash(uint256 tokenId) external view returns (bytes32);
	function getEncryptedURI(uint256 tokenId) external view returns (string memory);
}


