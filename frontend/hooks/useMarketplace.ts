import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { marketplaceConfig, MARKETPLACE_ADDRESS } from '@/lib/marketplace-contract';
import type { SaleListing, RentalListing, ActiveRental, Offer, MarketplaceStats } from '@/lib/marketplace-contract';
import { parseEther } from 'viem';

export function useMarketplace() {
  const { writeContractAsync } = useWriteContract();

  // Sale Functions
  const listForSale = async (node: `0x${string}`, price: string) => {
    return writeContractAsync({
      ...marketplaceConfig,
      functionName: 'listForSale',
      args: [node, parseEther(price)],
    });
  };

  const buyDomain = async (node: `0x${string}`, price: string) => {
    return writeContractAsync({
      ...marketplaceConfig,
      functionName: 'buyDomain',
      args: [node],
      value: parseEther(price),
    });
  };

  const cancelSaleListing = async (node: `0x${string}`) => {
    return writeContractAsync({
      ...marketplaceConfig,
      functionName: 'cancelSaleListing',
      args: [node],
    });
  };

  const updateSalePrice = async (node: `0x${string}`, newPrice: string) => {
    return writeContractAsync({
      ...marketplaceConfig,
      functionName: 'updateSalePrice',
      args: [node, parseEther(newPrice)],
    });
  };

  // Rental Functions
  const listForRent = async (
    node: `0x${string}`,
    pricePerDay: string,
    minDuration: number,
    maxDuration: number
  ) => {
    return writeContractAsync({
      ...marketplaceConfig,
      functionName: 'listForRent',
      args: [node, parseEther(pricePerDay), BigInt(minDuration), BigInt(maxDuration)],
    });
  };

  const rentDomain = async (node: `0x${string}`, durationDays: number, totalPrice: string) => {
    return writeContractAsync({
      ...marketplaceConfig,
      functionName: 'rentDomain',
      args: [node, BigInt(durationDays)],
      value: parseEther(totalPrice),
    });
  };

  const cancelRentalListing = async (node: `0x${string}`) => {
    return writeContractAsync({
      ...marketplaceConfig,
      functionName: 'cancelRentalListing',
      args: [node],
    });
  };

  const endRental = async (node: `0x${string}`) => {
    return writeContractAsync({
      ...marketplaceConfig,
      functionName: 'endRental',
      args: [node],
    });
  };

  // Offer Functions
  const makeOffer = async (
    node: `0x${string}`,
    offerType: number,
    duration: number,
    amount: string
  ) => {
    return writeContractAsync({
      ...marketplaceConfig,
      functionName: 'makeOffer',
      args: [node, offerType, BigInt(duration)],
      value: parseEther(amount),
    });
  };

  const acceptOffer = async (node: `0x${string}`, offerIndex: number) => {
    return writeContractAsync({
      ...marketplaceConfig,
      functionName: 'acceptOffer',
      args: [node, BigInt(offerIndex)],
    });
  };

  const cancelOffer = async (node: `0x${string}`, offerIndex: number) => {
    return writeContractAsync({
      ...marketplaceConfig,
      functionName: 'cancelOffer',
      args: [node, BigInt(offerIndex)],
    });
  };

  return {
    listForSale,
    buyDomain,
    cancelSaleListing,
    updateSalePrice,
    listForRent,
    rentDomain,
    cancelRentalListing,
    endRental,
    makeOffer,
    acceptOffer,
    cancelOffer,
  };
}

// Hook to get sale listing
export function useSaleListing(node: `0x${string}` | undefined) {
  return useReadContract({
    ...marketplaceConfig,
    functionName: 'saleListings',
    args: node ? [node] : undefined,
    query: {
      enabled: !!node,
    },
  });
}

// Hook to get rental listing
export function useRentalListing(node: `0x${string}` | undefined) {
  return useReadContract({
    ...marketplaceConfig,
    functionName: 'rentalListings',
    args: node ? [node] : undefined,
    query: {
      enabled: !!node,
    },
  });
}

// Hook to get active rental
export function useActiveRental(node: `0x${string}` | undefined) {
  return useReadContract({
    ...marketplaceConfig,
    functionName: 'activeRentals',
    args: node ? [node] : undefined,
    query: {
      enabled: !!node,
    },
  });
}

// Hook to get offers for a domain
export function useOffers(node: `0x${string}` | undefined) {
  return useReadContract({
    ...marketplaceConfig,
    functionName: 'getOffers',
    args: node ? [node] : undefined,
    query: {
      enabled: !!node,
    },
  });
}

// Hook to get user's listings
export function useUserListings(address: `0x${string}` | undefined) {
  return useReadContract({
    ...marketplaceConfig,
    functionName: 'getUserListings',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

// Hook to get user's rentals
export function useUserRentals(address: `0x${string}` | undefined) {
  return useReadContract({
    ...marketplaceConfig,
    functionName: 'getUserRentals',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

// Hook to check if listed for sale
export function useIsListedForSale(node: `0x${string}` | undefined) {
  return useReadContract({
    ...marketplaceConfig,
    functionName: 'isListedForSale',
    args: node ? [node] : undefined,
    query: {
      enabled: !!node,
    },
  });
}

// Hook to check if listed for rent
export function useIsListedForRent(node: `0x${string}` | undefined) {
  return useReadContract({
    ...marketplaceConfig,
    functionName: 'isListedForRent',
    args: node ? [node] : undefined,
    query: {
      enabled: !!node,
    },
  });
}

// Hook to check if currently rented
export function useIsCurrentlyRented(node: `0x${string}` | undefined) {
  return useReadContract({
    ...marketplaceConfig,
    functionName: 'isCurrentlyRented',
    args: node ? [node] : undefined,
    query: {
      enabled: !!node,
    },
  });
}

// Hook to get marketplace stats
export function useMarketplaceStats() {
  return useReadContract({
    ...marketplaceConfig,
    functionName: 'getMarketplaceStats',
  });
}

// Hook to get platform fee
export function usePlatformFee() {
  return useReadContract({
    ...marketplaceConfig,
    functionName: 'platformFee',
  });
}
