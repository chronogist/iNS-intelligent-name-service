'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign, PieChart, Activity,
  Zap, Brain, Target, Award
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useSaleListing, useRentalListing, useMarketplaceStats } from '@/hooks/useMarketplace';
import { computeNode, formatPrice } from '@/lib/domain-utils';

interface Domain {
  name: string;
  owner: string;
}

interface PortfolioValueProps {
  domains: Domain[];
}

interface DomainValuation {
  name: string;
  listedPrice: number;
  estimatedValue: number;
  intelligenceScore: number;
  isListed: boolean;
  listingType: 'sale' | 'rent' | 'none';
}

export default function PortfolioValue({ domains }: PortfolioValueProps) {
  const { address } = useAccount();
  const [valuations, setValuations] = useState<DomainValuation[]>([]);
  const [isCalculating, setIsCalculating] = useState(true);

  // Fetch marketplace stats
  const { data: marketplaceStats } = useMarketplaceStats();

  // Calculate portfolio value
  useEffect(() => {
    async function calculateValues() {
      setIsCalculating(true);

      const calculatedValuations: DomainValuation[] = [];

      for (const domain of domains) {
        try {
          const node = computeNode(domain.name) as `0x${string}`;

          // Fetch listing data (we'll do this inline since hooks can't be in loops)
          const saleListingResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/marketplace/listing/${domain.name}`
          );
          const listingData = await saleListingResponse.json();

          // Fetch profile data for intelligence score
          const profileResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/profile/${domain.name}`
          );
          let intelligenceScore = 0;
          if (profileResponse.ok) {
            const profile = await profileResponse.json();
            intelligenceScore = profile.data?.intelligenceScore || 0;
          }

          // Determine listing status and price
          let listedPrice = 0;
          let listingType: 'sale' | 'rent' | 'none' = 'none';

          if (listingData.saleListing?.active) {
            listedPrice = parseFloat(listingData.saleListing.price);
            listingType = 'sale';
          } else if (listingData.rentalListing?.active) {
            // For rentals, estimate value as 365 days * daily price
            listedPrice = parseFloat(listingData.rentalListing.pricePerDay) * 365;
            listingType = 'rent';
          }

          // Calculate estimated value using our pricing algorithm
          const estimatedValue = calculateDomainValue(domain.name, intelligenceScore);

          calculatedValuations.push({
            name: domain.name,
            listedPrice,
            estimatedValue,
            intelligenceScore,
            isListed: listingType !== 'none',
            listingType,
          });
        } catch (error) {
          console.error(`Error calculating value for ${domain.name}:`, error);
          // Add default values if fetch fails
          calculatedValuations.push({
            name: domain.name,
            listedPrice: 0,
            estimatedValue: calculateDomainValue(domain.name, 0),
            intelligenceScore: 0,
            isListed: false,
            listingType: 'none',
          });
        }
      }

      setValuations(calculatedValuations);
      setIsCalculating(false);
    }

    if (domains.length > 0) {
      calculateValues();
    } else {
      setIsCalculating(false);
    }
  }, [domains]);

  // Dynamic pricing algorithm
  const calculateDomainValue = (name: string, intelligenceScore: number): number => {
    let baseValue = 1.0; // Base value in 0G

    // Factor 1: Domain length (shorter = more valuable)
    const length = name.length;
    if (length <= 3) baseValue = 10.0;
    else if (length <= 5) baseValue = 5.0;
    else if (length <= 8) baseValue = 2.0;
    else if (length <= 12) baseValue = 1.0;
    else baseValue = 0.5;

    // Factor 2: Character quality
    const hasNumbers = /\d/.test(name);
    const hasHyphens = /-/.test(name);
    if (!hasNumbers && !hasHyphens) baseValue *= 1.2; // Pure letters are more valuable

    // Factor 3: Pronounceability (simple heuristic)
    const vowels = name.match(/[aeiou]/gi)?.length || 0;
    const consonants = name.match(/[bcdfghjklmnpqrstvwxyz]/gi)?.length || 0;
    const vowelRatio = vowels / name.length;
    if (vowelRatio > 0.3 && vowelRatio < 0.5) baseValue *= 1.15; // Well balanced

    // Factor 4: Intelligence Score (AI agent value)
    if (intelligenceScore > 0) {
      const intelligenceMultiplier = 1 + (intelligenceScore / 1000) * 2; // Up to 3x for genius agents
      baseValue *= intelligenceMultiplier;
    }

    // Factor 5: Market trends (if we have marketplace stats)
    if (marketplaceStats) {
      const avgSalePrice = Number((marketplaceStats as any)[1]) / Number((marketplaceStats as any)[0] || 1) / 1e18;
      if (avgSalePrice > 0) {
        // Adjust based on market average
        const marketFactor = Math.min(avgSalePrice / 2, 1.5); // Cap at 1.5x adjustment
        baseValue *= marketFactor;
      }
    }

    return parseFloat(baseValue.toFixed(4));
  };

  // Calculate portfolio metrics
  const metrics = useMemo(() => {
    const totalEstimatedValue = valuations.reduce((sum, v) => sum + v.estimatedValue, 0);
    const totalListedValue = valuations.reduce((sum, v) => sum + v.listedPrice, 0);
    const listedCount = valuations.filter(v => v.isListed).length;
    const avgIntelligence = valuations.length > 0
      ? valuations.reduce((sum, v) => sum + v.intelligenceScore, 0) / valuations.length
      : 0;

    // Calculate potential earnings (unlisted domains)
    const potentialValue = valuations
      .filter(v => !v.isListed)
      .reduce((sum, v) => sum + v.estimatedValue, 0);

    return {
      totalEstimatedValue,
      totalListedValue,
      listedCount,
      unlistedCount: valuations.length - listedCount,
      avgIntelligence,
      potentialValue,
      totalDomains: valuations.length,
    };
  }, [valuations]);

  if (domains.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <PieChart className="w-12 h-12 text-dark-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">No Domains Yet</h3>
        <p className="text-dark-400">Register your first domain to see portfolio analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
          <PieChart className="w-6 h-6 text-primary-400" />
          Portfolio Value
        </h2>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Total Estimated Value */}
          <div className="bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-primary-400" />
              <span className="text-sm text-dark-400">Estimated Value</span>
            </div>
            <div className="text-3xl font-bold gradient-text">
              {isCalculating ? '...' : metrics.totalEstimatedValue.toFixed(2)} <span className="text-xl">0G</span>
            </div>
            <div className="text-xs text-dark-400 mt-1">
              {metrics.totalDomains} domains
            </div>
          </div>

          {/* Listed Value */}
          <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-green-400" />
              <span className="text-sm text-dark-400">Listed Value</span>
            </div>
            <div className="text-3xl font-bold text-green-400">
              {isCalculating ? '...' : metrics.totalListedValue.toFixed(2)} <span className="text-xl">0G</span>
            </div>
            <div className="text-xs text-dark-400 mt-1">
              {metrics.listedCount} listed
            </div>
          </div>

          {/* Potential Value */}
          <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-dark-400">Unlisted Potential</span>
            </div>
            <div className="text-3xl font-bold text-blue-400">
              {isCalculating ? '...' : metrics.potentialValue.toFixed(2)} <span className="text-xl">0G</span>
            </div>
            <div className="text-xs text-dark-400 mt-1">
              {metrics.unlistedCount} not listed
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-dark-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">Avg Intelligence Score</span>
              <Brain className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {isCalculating ? '...' : Math.floor(metrics.avgIntelligence)}
              <span className="text-sm text-dark-400">/1000</span>
            </div>
          </div>

          <div className="bg-dark-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">Listing Rate</span>
              <Award className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {isCalculating ? '...' : ((metrics.listedCount / metrics.totalDomains) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </motion.div>

      {/* Domain Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-bold mb-4">Domain Valuations</h3>

        <div className="space-y-2">
          {isCalculating ? (
            <div className="text-center py-8 text-dark-400">Calculating valuations...</div>
          ) : (
            valuations.sort((a, b) => b.estimatedValue - a.estimatedValue).map((domain, index) => (
              <div
                key={domain.name}
                className="flex items-center justify-between p-3 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-dark-400 font-mono text-sm w-8">#{index + 1}</div>
                  <div>
                    <div className="font-semibold">{domain.name}.0g</div>
                    <div className="flex items-center gap-2 text-xs text-dark-400">
                      {domain.isListed && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                          {domain.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                        </span>
                      )}
                      {domain.intelligenceScore > 0 && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-purple-400" />
                          {domain.intelligenceScore}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-primary-400">
                    {domain.estimatedValue.toFixed(4)} 0G
                  </div>
                  {domain.isListed && domain.listedPrice > 0 && (
                    <div className="text-xs text-dark-400">
                      Listed: {domain.listedPrice.toFixed(4)} 0G
                      {domain.listedPrice > domain.estimatedValue && (
                        <TrendingUp className="inline w-3 h-3 ml-1 text-green-400" />
                      )}
                      {domain.listedPrice < domain.estimatedValue && (
                        <TrendingDown className="inline w-3 h-3 ml-1 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pricing Tips */}
        <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary-400" />
            Dynamic Pricing Algorithm
          </h4>
          <ul className="text-sm text-dark-300 space-y-1">
            <li>• Shorter domains (3-5 chars) valued 2-10x higher</li>
            <li>• Intelligence score adds up to 3x multiplier</li>
            <li>• Pure letter domains worth 20% more</li>
            <li>• Pronounceable names get 15% premium</li>
            <li>• Market trends automatically factored in</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
