import marketplaceABI from './marketplace-abi.json';

export const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`;
export const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;

export const marketplaceConfig = {
  address: MARKETPLACE_ADDRESS,
  abi: marketplaceABI,
} as const;

// Marketplace contract function signatures
export const MARKETPLACE_FUNCTIONS = {
  // Sale functions
  listForSale: 'listForSale',
  buyDomain: 'buyDomain',
  cancelSaleListing: 'cancelSaleListing',
  updateSalePrice: 'updateSalePrice',

  // Rental functions
  listForRent: 'listForRent',
  rentDomain: 'rentDomain',
  cancelRentalListing: 'cancelRentalListing',
  endRental: 'endRental',

  // Offer functions
  makeOffer: 'makeOffer',
  acceptOffer: 'acceptOffer',
  cancelOffer: 'cancelOffer',

  // View functions
  saleListings: 'saleListings',
  rentalListings: 'rentalListings',
  activeRentals: 'activeRentals',
  getOffers: 'getOffers',
  getUserListings: 'getUserListings',
  getUserRentals: 'getUserRentals',
  isListedForSale: 'isListedForSale',
  isListedForRent: 'isListedForRent',
  isCurrentlyRented: 'isCurrentlyRented',
  getMarketplaceStats: 'getMarketplaceStats',
  platformFee: 'platformFee',
  treasury: 'treasury',
} as const;

export enum ListingType {
  NONE = 0,
  SALE = 1,
  RENT = 2,
  BOTH = 3
}

export enum OfferType {
  BUY = 0,
  RENT = 1
}

export interface SaleListing {
  seller: string;
  price: bigint;
  listedAt: bigint;
  active: boolean;
}

export interface RentalListing {
  owner: string;
  pricePerDay: bigint;
  minDuration: bigint;
  maxDuration: bigint;
  listedAt: bigint;
  active: boolean;
}

export interface ActiveRental {
  renter: string;
  startTime: bigint;
  endTime: bigint;
  totalPaid: bigint;
  active: boolean;
}

export interface Offer {
  offerer: string;
  amount: bigint;
  offerType: OfferType;
  duration: bigint;
  expiresAt: bigint;
  active: boolean;
}

export interface MarketplaceStats {
  totalSales: bigint;
  totalVolume: bigint;
  totalRentals: bigint;
  totalRentalVolume: bigint;
}
