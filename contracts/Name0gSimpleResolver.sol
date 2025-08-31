// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Name0gRegistry.sol";

// Minimal resolver supporting addr/text/contenthash
contract Name0gSimpleResolver {
	Name0gRegistry public immutable registry;

	mapping(bytes32 => address) internal _addrs;
	mapping(bytes32 => mapping(string => string)) internal _texts;
	mapping(bytes32 => bytes) internal _contenthash;
	mapping(bytes32 => string) internal _names;

	event AddrChanged(bytes32 indexed node, address addr);
	event TextChanged(bytes32 indexed node, string indexed key, string value);
	event ContenthashChanged(bytes32 indexed node, bytes hash);
	event NameChanged(bytes32 indexed node, string name);

	constructor(Name0gRegistry _registry) {
		registry = _registry;
	}

	modifier authorised(bytes32 node) {
		require(registry.owners(node) == msg.sender, "not owner");
		_;
	}

	function setAddr(bytes32 node, address a) external authorised(node) {
		_addrs[node] = a;
		emit AddrChanged(node, a);
	}

	function addr(bytes32 node) external view returns (address) {
		return _addrs[node];
	}

	function setText(bytes32 node, string calldata key, string calldata value) external authorised(node) {
		_texts[node][key] = value;
		emit TextChanged(node, key, value);
	}

	function text(bytes32 node, string calldata key) external view returns (string memory) {
		return _texts[node][key];
	}

	function setContenthash(bytes32 node, bytes calldata hash) external authorised(node) {
		_contenthash[node] = hash;
		emit ContenthashChanged(node, hash);
	}

	function contenthash(bytes32 node) external view returns (bytes memory) {
		return _contenthash[node];
	}

	function setName(bytes32 node, string calldata name_) external authorised(node) {
		_names[node] = name_;
		emit NameChanged(node, name_);
	}

	function name(bytes32 node) external view returns (string memory) {
		return _names[node];
	}
}


