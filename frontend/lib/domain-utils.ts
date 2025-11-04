import { keccak256, toHex } from 'viem';

/**
 * Computes the namehash (node) for a domain name
 * @param name - The domain name (e.g., "alice")
 * @returns The namehash as a bytes32 hex string
 */
export function computeNode(name: string): `0x${string}` {
  // For top-level domains in INS, we just hash the name
  // If we had subdomains, we'd need to recursively compute the hash
  const label = keccak256(toHex(name));

  // For root domains, the node is just the keccak256 of the label
  // In a full ENS-style implementation, you'd compute:
  // node = keccak256(parentNode + labelHash)
  // But for simplicity with top-level domains:
  return label;
}

/**
 * Formats an address for display
 * @param address - The Ethereum address
 * @returns Shortened address (0x1234...5678)
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Formats a price in wei to ETH
 * @param wei - Price in wei as bigint
 * @returns Formatted price string
 */
export function formatPrice(wei: bigint | undefined): string {
  if (!wei) return '0';
  const eth = Number(wei) / 1e18;
  return eth.toFixed(4);
}

/**
 * Calculates total rental price
 * @param pricePerDay - Price per day in wei
 * @param days - Number of days
 * @returns Total price in wei
 */
export function calculateRentalPrice(pricePerDay: bigint, days: number): bigint {
  return pricePerDay * BigInt(days);
}
