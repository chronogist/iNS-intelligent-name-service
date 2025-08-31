// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Name0gRegistry.sol";
import "./Name0gSimpleResolver.sol";

// Minimal reverse registrar: lowercased hex(addr).addr.reverse → name()
contract ReverseRegistrar {
	Name0gRegistry public immutable registry;
	Name0gSimpleResolver public immutable resolver;

	bytes32 public constant ADDR_REVERSE_LABEL = keccak256(abi.encodePacked("addr"));
	bytes32 public constant REVERSE_NODE = keccak256(abi.encodePacked(bytes32(0), ADDR_REVERSE_LABEL));

	event ReverseClaimed(address indexed claimant, bytes32 indexed node, string name);

	constructor(Name0gRegistry _registry, Name0gSimpleResolver _resolver) {
		registry = _registry;
		resolver = _resolver;
	}

	function _toLowerHex(bytes20 a) internal pure returns (bytes memory) {
		bytes16 hexSymbols = 0x30313233343536373839616263646566; // 0-9a-f
		bytes memory str = new bytes(40);
		for (uint256 i = 0; i < 20; i++) {
			uint8 b = uint8(a[i]);
			str[2 * i] = bytes1(hexSymbols[b >> 4]);
			str[2 * i + 1] = bytes1(hexSymbols[b & 0x0f]);
		}
		return str;
	}

	function node(address account) public pure returns (bytes32) {
		bytes32 label = keccak256(_toLowerHex(bytes20(account))); // keccak(lowercase hex addr)
		return keccak256(abi.encodePacked(REVERSE_NODE, label));
	}

	// Sets the reverse name for msg.sender to `name_` and returns the reverse node
	function setName(string calldata name_) external returns (bytes32) {
		bytes32 label = keccak256(_toLowerHex(bytes20(msg.sender)));
		bytes32 accountNode = keccak256(abi.encodePacked(REVERSE_NODE, label));
		// ensure we own the node
		if (registry.owners(accountNode) != msg.sender) {
			registry.setSubnodeOwner(REVERSE_NODE, label, msg.sender);
		}
		// ensure resolver is set
		if (registry.resolvers(accountNode) != address(resolver)) {
			registry.setResolver(accountNode, address(resolver));
		}
		resolver.setName(accountNode, name_);
		emit ReverseClaimed(msg.sender, accountNode, name_);
		return accountNode;
	}
}


