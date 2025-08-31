// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Stub interface for future oracle integration per ERC-7857 flows
interface IOracle {
	function verifyProof(bytes calldata proof) external view returns (bool);
}


