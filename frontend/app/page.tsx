'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Shield, Zap, Globe, ArrowRight, Check, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useReadContract } from 'wagmi';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const router = useRouter();

  const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check availability
  const { data: isAvailable, isLoading: isCheckingAvailability } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: [{
      name: 'available',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'name', type: 'string' }],
      outputs: [{ name: '', type: 'bool' }]
    }],
    functionName: 'available',
    args: [debouncedQuery],
    query: {
      enabled: debouncedQuery.length >= 3 && /^[a-z0-9-]+$/.test(debouncedQuery)
    }
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    const cleanQuery = searchQuery.trim().toLowerCase();

    // If domain is available, go directly to registration
    if (isAvailable && cleanQuery === debouncedQuery && cleanQuery.length >= 3) {
      router.push(`/register?domain=${cleanQuery}`);
      return;
    }

    // Otherwise go to search page
    setIsSearching(true);
    setTimeout(() => {
      router.push(`/search?q=${cleanQuery}`);
      setIsSearching(false);
    }, 500);
  };

  const features = [
    {
      icon: Zap,
      title: 'Smart Routing',
      description: 'AI-powered routing automatically directs payments to the right wallet based on your rules',
      color: 'from-primary-500 to-primary-600',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your routing rules are encrypted and stored securely on 0G Storage',
      color: 'from-accent-500 to-accent-600',
    },
    {
      icon: Globe,
      title: 'Truly Yours',
      description: 'Own your domain as an INFT - transfer it with all its intelligence intact',
      color: 'from-primary-400 to-accent-400',
    },
  ];

  const pricingPlans = [
    { length: '5+ characters', price: '0.1', period: 'year' },
    { length: '3-4 characters', price: '0.1', period: 'year', popular: true },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 glass-card rounded-full"
            >
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-medium">Intelligent Naming Service</span>
            </motion.div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-tight">
              Own Your{' '}
              <span className="gradient-text">Smart Domain</span>
              <br />
              On 0G Network
            </h1>

            <p className="text-lg sm:text-xl text-dark-300 max-w-3xl mx-auto mb-12">
              The first naming service with built-in AI routing. Your .0g domain automatically directs payments to the right wallet.
            </p>

            {/* Search Bar */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto"
            >
              <div className="glass-card p-2 flex items-center gap-2 shadow-glow group hover:shadow-glow-lg transition-all duration-300">
                <Search className="w-5 h-5 text-dark-400 ml-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for your perfect domain..."
                  className="flex-1 bg-transparent border-none outline-none px-2 py-3 text-white placeholder:text-dark-400 text-base sm:text-lg"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className={`flex items-center gap-2 whitespace-nowrap transition-all ${
                    isAvailable && debouncedQuery.length >= 3
                      ? 'btn-primary shadow-glow-lg scale-105'
                      : 'btn-primary'
                  }`}
                >
                  {isSearching ? (
                    'Searching...'
                  ) : isAvailable && debouncedQuery.length >= 3 ? (
                    <>
                      Register
                      <CheckCircle className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Search
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Availability Status */}
              <div className="mt-3 ml-3 min-h-[24px]">
                <AnimatePresence mode="wait">
                  {debouncedQuery.length >= 3 && /^[a-z0-9-]+$/.test(debouncedQuery) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      {isCheckingAvailability ? (
                        <>
                          <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
                          <span className="text-sm text-dark-400">
                            Checking availability...
                          </span>
                        </>
                      ) : isAvailable ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400 font-medium">
                            <span className="font-bold">{debouncedQuery}.0g</span> is available!
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-red-400">
                            <span className="font-bold">{debouncedQuery}.0g</span> is already taken
                          </span>
                          <button
                            onClick={() => router.push(`/d/${debouncedQuery}`)}
                            className="text-sm text-primary-400 hover:text-primary-300 underline ml-2"
                          >
                            View details
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                  {debouncedQuery.length > 0 && debouncedQuery.length < 3 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-dark-400"
                    >
                      Domain must be at least 3 characters
                    </motion.p>
                  )}
                  {debouncedQuery.length === 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-dark-400"
                    >
                      e.g., yourname.0g, company.0g, project.0g
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4">
              Why Choose <span className="gradient-text">iNS</span>?
            </h2>
            <p className="text-lg text-dark-300">
              More than just a domain - it's your intelligent identity on 0G
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="glass-card-hover p-8 group"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 shadow-glow group-hover:shadow-glow-lg transition-all duration-300 group-hover:scale-110`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold mb-3">
                  {feature.title}
                </h3>
                <p className="text-dark-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4">
              Simple Pricing
            </h2>
            <p className="text-lg text-dark-300">
              Register your domain for just a few tokens per year
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.length}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`glass-card p-8 relative ${plan.popular ? 'ring-2 ring-primary-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge-primary px-4 py-1">Most Popular</span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-lg font-medium text-dark-300 mb-2">
                    {plan.length}
                  </h3>
                  <div className="flex items-baseline justify-center gap-2 mb-6">
                    <span className="text-5xl font-display font-bold gradient-text">
                      {plan.price}
                    </span>
                    <span className="text-dark-400">0G/{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 text-left">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                      <span className="text-dark-300">Smart routing included</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                      <span className="text-dark-300">Encrypted storage on 0G</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                      <span className="text-dark-300">Transferable as INFT</span>
                    </li>
                  </ul>
                  <button className="btn-primary w-full">
                    Get Started
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-8 sm:p-12 text-center gradient-bg"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Ready to claim your domain?
            </h2>
            <p className="text-lg text-dark-300 mb-8 max-w-2xl mx-auto">
              Join the future of intelligent naming on 0G Network
            </p>
            <button
              onClick={() => document.querySelector('input')?.focus()}
              className="btn-primary text-lg px-8 py-4"
            >
              Search Your Domain
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-dark-400">
          <p>&copy; 2025 iNS. Built on 0G Network.</p>
        </div>
      </footer>
    </div>
  );
}