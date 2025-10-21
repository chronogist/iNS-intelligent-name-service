import { keccak256, toHex } from 'viem';

/**
 * Computes the namehash (node) for a domain name
 * @param name - The domain name (e.g., "alice" or "alice.0g")
 * @returns The namehash as a bytes32 hex string
 */
export function computeNode(name: string): `0x${string}` {
  // Normalize: strip TLD and lowercase to match backend/contract expectations
  const normalized = name.replace(/\.?0g$/i, '').toLowerCase();
  return keccak256(toHex(normalized));
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
