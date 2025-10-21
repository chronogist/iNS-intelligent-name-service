'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Clock, X, DollarSign, Calendar, TrendingUp,
  Loader2, AlertCircle, CheckCircle, Edit2, Trash2
} from 'lucide-react';
import { useMarketplace, useSaleListing, useRentalListing, useIsCurrentlyRented } from '@/hooks/useMarketplace';
import { useINFTApproval } from '@/hooks/useINFTApproval';
import { computeNode, formatPrice } from '@/lib/domain-utils';
import toast from 'react-hot-toast';
import { parseEther } from 'viem';
import { useAccount } from 'wagmi';

interface MarketplaceManagerProps {
  domainName: string;
  isOwner: boolean;
}

export default function MarketplaceManager({ domainName, isOwner }: MarketplaceManagerProps) {
  const { address } = useAccount();
  const node = computeNode(domainName) as `0x${string}`;

  // Check INFT approval
  const { isApproved, isApproving, approveMarketplace } = useINFTApproval(domainName, address);

  // Fetch listing status
  const { data: saleListing, refetch: refetchSale } = useSaleListing(node);
  const { data: rentalListing, refetch: refetchRental } = useRentalListing(node);
  const { data: isRented } = useIsCurrentlyRented(node);

  // Marketplace functions
  const {
    listForSale,
    cancelSaleListing,
    updateSalePrice,
    listForRent,
    cancelRentalListing,
  } = useMarketplace();

  // UI State
  const [showListForSale, setShowListForSale] = useState(false);
  const [showListForRent, setShowListForRent] = useState(false);
  const [showEditPrice, setShowEditPrice] = useState(false);

  // Form state
  const [salePrice, setSalePrice] = useState('');
  const [rentalPricePerDay, setRentalPricePerDay] = useState('');
  const [minDuration, setMinDuration] = useState('1');
  const [maxDuration, setMaxDuration] = useState('30');

  // Loading states
  const [isListing, setIsListing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleListForSale = async () => {
    if (!salePrice || parseFloat(salePrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setIsListing(true);
      toast.loading('Listing domain for sale...', { id: 'list-sale' });

      await listForSale(node, salePrice);

      toast.success('Domain listed for sale!', { id: 'list-sale' });
      setShowListForSale(false);
      setSalePrice('');
      setTimeout(() => refetchSale(), 2000);
    } catch (error: any) {
      console.error('Error listing for sale:', error);
      toast.error(error.message || 'Failed to list domain', { id: 'list-sale' });
    } finally {
      setIsListing(false);
    }
  };

  const handleListForRent = async () => {
    if (!rentalPricePerDay || parseFloat(rentalPricePerDay) <= 0) {
      toast.error('Please enter a valid rental price');
      return;
    }

    const min = parseInt(minDuration);
    const max = parseInt(maxDuration);

    if (min < 1 || max < min || max > 365) {
      toast.error('Invalid duration range (1-365 days)');
      return;
    }

    try {
      setIsListing(true);
      toast.loading('Listing domain for rent...', { id: 'list-rent' });

      await listForRent(node, rentalPricePerDay, min, max);

      toast.success('Domain listed for rent!', { id: 'list-rent' });
      setShowListForRent(false);
      setRentalPricePerDay('');
      setTimeout(() => refetchRental(), 2000);
    } catch (error: any) {
      console.error('Error listing for rent:', error);
      toast.error(error.message || 'Failed to list domain', { id: 'list-rent' });
    } finally {
      setIsListing(false);
    }
  };

  const handleCancelSale = async () => {
    try {
      setIsCanceling(true);
      toast.loading('Canceling sale listing...', { id: 'cancel-sale' });

      await cancelSaleListing(node);

      toast.success('Sale listing canceled', { id: 'cancel-sale' });
      setTimeout(() => refetchSale(), 2000);
    } catch (error: any) {
      console.error('Error canceling sale:', error);
      toast.error(error.message || 'Failed to cancel listing', { id: 'cancel-sale' });
    } finally {
      setIsCanceling(false);
    }
  };

  const handleCancelRental = async () => {
    try {
      setIsCanceling(true);
      toast.loading('Canceling rental listing...', { id: 'cancel-rental' });

      await cancelRentalListing(node);

      toast.success('Rental listing canceled', { id: 'cancel-rental' });
      setTimeout(() => refetchRental(), 2000);
    } catch (error: any) {
      console.error('Error canceling rental:', error);
      toast.error(error.message || 'Failed to cancel listing', { id: 'cancel-rental' });
    } finally {
      setIsCanceling(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!salePrice || parseFloat(salePrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setIsUpdating(true);
      toast.loading('Updating price...', { id: 'update-price' });

      await updateSalePrice(node, salePrice);

      toast.success('Price updated!', { id: 'update-price' });
      setShowEditPrice(false);
      setSalePrice('');
      setTimeout(() => refetchSale(), 2000);
    } catch (error: any) {
      console.error('Error updating price:', error);
      toast.error(error.message || 'Failed to update price', { id: 'update-price' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Get suggested price based on domain quality (simple algorithm)
  const getSuggestedPrice = () => {
    const length = domainName.length;
    if (length <= 3) return '10.0';
    if (length <= 5) return '5.0';
    if (length <= 8) return '2.0';
    return '1.0';
  };

  const getSuggestedRentalPrice = () => {
    const basePrice = parseFloat(getSuggestedPrice());
    return (basePrice * 0.05).toFixed(4); // 5% of sale price per day
  };

  if (!isOwner) return null;

  const isListedForSale = saleListing && (saleListing as any).active;
  const isListedForRent = rentalListing && (rentalListing as any).active;
  const isCurrentlyRented = Boolean(isRented);

  return (
    <div className="space-y-4">
      {/* Approval Required Notice */}
      {!isApproved && (
        <div className="glass-card p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-400 mb-2">Approval Required</h3>
              <p className="text-dark-300 text-sm mb-4">
                Before you can list this domain on the marketplace, you need to approve the marketplace contract
                to manage your domain NFT. This is a one-time security step that allows the marketplace to transfer
                your domain when someone purchases it.
              </p>
              <button
                onClick={approveMarketplace}
                disabled={isApproving}
                className="btn-primary flex items-center gap-2"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Approve Marketplace
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Listing Status */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary-400" />
          Marketplace Status
        </h3>

        <div className="space-y-3">
          {/* Sale Status */}
          <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isListedForSale ? 'bg-green-400' : 'bg-gray-600'}`} />
              <div>
                <div className="font-semibold">Sale Listing</div>
                {isListedForSale && (
                  <div className="text-sm text-primary-400">
                    {formatPrice((saleListing as any).price)} 0G
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {isListedForSale ? (
                <>
                  <button
                    onClick={() => setShowEditPrice(true)}
                    disabled={isCanceling}
                    className="btn-ghost text-sm flex items-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleCancelSale}
                    disabled={isCanceling}
                    className="btn-ghost text-sm flex items-center gap-1 text-red-400"
                  >
                    {isCanceling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowListForSale(true)}
                  disabled={!isApproved}
                  className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!isApproved ? 'Approve marketplace first' : ''}
                >
                  List for Sale
                </button>
              )}
            </div>
          </div>

          {/* Rental Status */}
          <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isListedForRent ? 'bg-green-400' : 'bg-gray-600'}`} />
              <div>
                <div className="font-semibold">Rental Listing</div>
                {isListedForRent && (
                  <div className="text-sm text-primary-400">
                    {formatPrice((rentalListing as any).pricePerDay)} 0G/day
                  </div>
                )}
                {isCurrentlyRented && (
                  <div className="text-xs text-yellow-400 mt-1">Currently Rented</div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {isListedForRent ? (
                <button
                  onClick={handleCancelRental}
                  disabled={isCanceling || isCurrentlyRented}
                  className="btn-ghost text-sm flex items-center gap-1 text-red-400"
                >
                  {isCanceling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() => setShowListForRent(true)}
                  disabled={isCurrentlyRented || !isApproved}
                  className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!isApproved ? 'Approve marketplace first' : isCurrentlyRented ? 'Cannot list while rented' : ''}
                >
                  List for Rent
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* List for Sale Modal */}
      <AnimatePresence>
        {showListForSale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowListForSale(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">List for Sale</h3>
                <button onClick={() => setShowListForSale(false)} className="text-dark-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sale Price (0G)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="Enter price in 0G"
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg focus:outline-none focus:border-primary-400"
                  />
                  <div className="mt-2 text-xs text-dark-400">
                    Suggested: {getSuggestedPrice()} 0G (based on domain length)
                  </div>
                </div>

                <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-primary-400 mt-0.5" />
                    <div>
                      <div className="font-semibold text-primary-400">Platform Fee: 2.5%</div>
                      <div className="text-dark-300 text-xs mt-1">
                        You will receive {salePrice ? (parseFloat(salePrice) * 0.975).toFixed(4) : '0'} 0G after sale
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowListForSale(false)}
                    className="flex-1 btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleListForSale}
                    disabled={isListing || !salePrice}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {isListing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                    List Domain
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List for Rent Modal */}
      <AnimatePresence>
        {showListForRent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowListForRent(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">List for Rent</h3>
                <button onClick={() => setShowListForRent(false)} className="text-dark-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price per Day (0G)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={rentalPricePerDay}
                    onChange={(e) => setRentalPricePerDay(e.target.value)}
                    placeholder="Enter daily rental price"
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg focus:outline-none focus:border-primary-400"
                  />
                  <div className="mt-2 text-xs text-dark-400">
                    Suggested: {getSuggestedRentalPrice()} 0G/day
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Min Days</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={minDuration}
                      onChange={(e) => setMinDuration(e.target.value)}
                      className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg focus:outline-none focus:border-primary-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Days</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={maxDuration}
                      onChange={(e) => setMaxDuration(e.target.value)}
                      className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg focus:outline-none focus:border-primary-400"
                    />
                  </div>
                </div>

                <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-primary-400 mt-0.5" />
                    <div>
                      <div className="font-semibold text-primary-400">Estimated Earnings</div>
                      <div className="text-dark-300 text-xs mt-1">
                        {rentalPricePerDay && maxDuration
                          ? `Up to ${(parseFloat(rentalPricePerDay) * parseInt(maxDuration) * 0.975).toFixed(4)} 0G per rental`
                          : 'Enter price to see estimate'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowListForRent(false)}
                    className="flex-1 btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleListForRent}
                    disabled={isListing || !rentalPricePerDay}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {isListing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                    List Domain
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Price Modal */}
      <AnimatePresence>
        {showEditPrice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditPrice(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Update Price</h3>
                <button onClick={() => setShowEditPrice(false)} className="text-dark-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">New Price (0G)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder={formatPrice((saleListing as any)?.price)}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg focus:outline-none focus:border-primary-400"
                  />
                  <div className="mt-2 text-xs text-dark-400">
                    Current: {formatPrice((saleListing as any)?.price)} 0G
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditPrice(false)}
                    className="flex-1 btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdatePrice}
                    disabled={isUpdating || !salePrice}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                    Update Price
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
