'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAccount } from 'wagmi';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isConnected } = useAccount();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    price?: string;
    error?: string;
  } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (query) {
      checkAvailability(query);
    }
  }, [query]);

  const checkAvailability = async (domainName: string) => {
    if (!domainName.trim()) return;

    // Validate domain name
    if (domainName.length < 3) {
      setAvailability({ available: false, error: 'Domain must be at least 3 characters' });
      return;
    }
    if (domainName.length > 63) {
      setAvailability({ available: false, error: 'Domain must be less than 63 characters' });
      return;
    }
    if (!/^[a-z0-9-]+$/.test(domainName)) {
      setAvailability({ available: false, error: 'Only lowercase letters, numbers, and hyphens allowed' });
      return;
    }

    setIsChecking(true);
    setAvailability(null);

    try {
      const [availRes, priceRes] = await Promise.all([
        axios.get(`${API_URL}/domains/available/${domainName}`),
        axios.get(`${API_URL}/domains/price/${domainName}`)
      ]);

      setAvailability({
        available: availRes.data.data.available,
        price: priceRes.data.data.priceFormatted
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailability({ 
        available: false, 
        error: 'Failed to check availability. Please try again.' 
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setQuery(searchInput);
      router.push(`/search?q=${searchInput}`);
    }
  };

  const handleRegister = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    router.push(`/register?domain=${query}`);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Bar */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSearch}
            className="mb-12"
          >
            <div className="glass-card p-2 flex items-center gap-2 shadow-glow">
              <Search className="w-5 h-5 text-dark-400 ml-3" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toLowerCase())}
                placeholder="Search for a domain..."
                className="flex-1 bg-transparent border-none outline-none px-2 py-3 text-white placeholder:text-dark-400 text-lg"
                autoFocus
              />
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
              >
                Search
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.form>

          {/* Loading State */}
          {isChecking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-12 text-center"
            >
              <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
              <p className="text-lg text-dark-300">Checking availability...</p>
            </motion.div>
          )}

          {/* Results */}
          {!isChecking && availability && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Domain Card */}
              <div className="glass-card p-8 relative overflow-hidden">
                {/* Background Effect */}
                {availability.available && (
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"></div>
                )}

                <div className="relative">
                  {/* Domain Name */}
                  <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                    <div>
                      <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
                        {query}.0g
                      </h1>
                      <div className="flex items-center gap-2">
                        {availability.error ? (
                          <>
                            <XCircle className="w-5 h-5 text-red-400" />
                            <span className="text-red-400">{availability.error}</span>
                          </>
                        ) : availability.available ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 font-medium">Available</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-400" />
                            <span className="text-red-400 font-medium">Already Taken</span>
                          </>
                        )}
                      </div>
                    </div>

                    {availability.available && availability.price && (
                      <div className="glass-card px-6 py-3">
                        <p className="text-sm text-dark-400 mb-1">Price</p>
                        <p className="text-2xl font-bold gradient-text">
                          {availability.price}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  {availability.available && !availability.error && (
                    <button
                      onClick={handleRegister}
                      className="btn-primary w-full sm:w-auto text-lg px-8 py-4 flex items-center justify-center gap-2 group"
                    >
                      <Sparkles className="w-5 h-5" />
                      Register Domain
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  {!availability.available && !availability.error && (
                    <div className="space-y-4">
                      <div className="glass-card p-6 bg-red-500/5 border-red-500/20">
                        <p className="text-dark-300 mb-4">
                          This domain is already registered. Try searching for a different name.
                        </p>
                        <button
                          onClick={() => router.push(`/d/${query}`)}
                          className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                          View Domain Details
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Features Info */}
              {availability.available && !availability.error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card p-6"
                >
                  <h3 className="text-lg font-display font-bold mb-4">
                    What you get:
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                      <span className="text-dark-300">
                        <strong className="text-white">Smart Routing:</strong> Automatically route payments based on token type and amount
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                      <span className="text-dark-300">
                        <strong className="text-white">Encrypted Storage:</strong> Your routing rules stored securely on 0G Storage
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                      <span className="text-dark-300">
                        <strong className="text-white">INFT Ownership:</strong> Your domain is an NFT you can transfer or sell
                      </span>
                    </li>
                  </ul>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Empty State */}
          {!isChecking && !availability && query && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-12 text-center"
            >
              <Search className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <p className="text-lg text-dark-300">
                Enter a domain name to check availability
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary-400 animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}