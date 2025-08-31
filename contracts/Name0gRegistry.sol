// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

// Minimal ENS-like registry for name.0g MVP
contract Name0gRegistry is Ownable {
	mapping(bytes32 => address) public owners;
	mapping(bytes32 => address) public resolvers;
	mapping(bytes32 => uint64) public ttls;

	event Transfer(bytes32 indexed node, address owner);
	event NewResolver(bytes32 indexed node, address resolver);
	event NewTTL(bytes32 indexed node, uint64 ttl);

	constructor() Ownable(msg.sender) {}

	modifier authorised(bytes32 node) {
		require(owners[node] == msg.sender, "not owner");
		_;
	}

	function setOwner(bytes32 node, address owner) external authorised(node) {
		owners[node] = owner;
		emit Transfer(node, owner);
	}

	function setResolver(bytes32 node, address resolver) external authorised(node) {
		resolvers[node] = resolver;
		emit NewResolver(node, resolver);
	}

	function setTTL(bytes32 node, uint64 ttl) external authorised(node) {
		ttls[node] = ttl;
		emit NewTTL(node, ttl);
	}

	// one-time bootstrap by contract owner to set a node owner (e.g., base node)
	function bootstrapSetOwner(bytes32 node, address owner) external onlyOwner {
		owners[node] = owner;
		emit Transfer(node, owner);
	}

	// bootstrap: current owner of node can create a subnode and set owner
	function setSubnodeOwner(bytes32 node, bytes32 label, address owner) external authorised(node) returns (bytes32) {
		bytes32 subnode = keccak256(abi.encodePacked(node, label));
		owners[subnode] = owner;
		emit Transfer(subnode, owner);
		return subnode;
	}
}


