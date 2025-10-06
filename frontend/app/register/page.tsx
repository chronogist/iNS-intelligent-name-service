'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Wallet, CheckCircle, AlertCircle, Sparkles, Brain } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, keccak256, toHex } from 'viem';
import toast from 'react-hot-toast';
import axios from 'axios';
import { initLearningData } from '@/lib/simple-learning';

const agentTypeInfo = {
  'defi_trader': {
    label: 'DeFi Trader',
    description: 'Learns automated trading strategies from your swaps and trades',
    icon: '📈'
  },
  'gas_optimizer': {
    label: 'Gas Optimizer',
    description: 'Learns to minimize transaction costs by analyzing your gas usage patterns',
    icon: '⚡'
  },
  'nft_analyzer': {
    label: 'NFT Analyzer',
    description: 'Learns to track and analyze NFT markets based on your interactions',
    icon: '🖼️'
  },
  'yield_farmer': {
    label: 'Yield Farmer',
    description: 'Learns to optimize DeFi yields by observing your farming strategies',
    icon: '🌾'
  },
  'arbitrage_bot': {
    label: 'Arbitrage Bot',
    description: 'Learns to find and execute arbitrage opportunities from your trading patterns',
    icon: '🔄'
  },
  'custom': {
    label: 'Custom Agent',
    description: 'General-purpose agent that learns from all your blockchain activities',
    icon: '🤖'
  }
};

function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const domain = searchParams.get('domain') || '';
  const [step, setStep] = useState(1); // 1: Setup, 2: Confirm, 3: Processing
  const [duration, setDuration] = useState(1); // years
  const [price, setPrice] = useState('');
  const [agentType, setAgentType] = useState('custom');

  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
    timeout: 120_000, // 2 minutes timeout
    query: {
      enabled: !!hash, // Only watch if hash exists
    }
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;

  useEffect(() => {
    if (!domain) {
      router.push('/');
      return;
    }
    fetchPrice();
  }, [domain, duration]);

  useEffect(() => {
    if (isSuccess) {
      toast.success('Domain registered successfully!');

      // Initialize learning data for the new domain
      initLearningData(domain, agentType);

      setTimeout(() => {
        router.push('/domains');
      }, 2000);
    }
  }, [isSuccess, domain, agentType]);

  useEffect(() => {
    if (writeError) {
      console.error('Write contract error:', writeError);
      toast.error(writeError.message || 'Transaction failed');
      setStep(2); // Go back to confirm step
    }
  }, [writeError]);

  useEffect(() => {
    if (confirmError) {
      console.error('Confirmation error:', confirmError);
      toast.error('Transaction confirmation failed');
      setStep(2); // Go back to confirm step
    }
  }, [confirmError]);

  useEffect(() => {
    if (hash) {
      console.log('Transaction hash:', hash);
      console.log('Waiting for confirmation...');
    }
  }, [hash]);

  useEffect(() => {
    console.log('Transaction states:', {
      hash,
      isPending,
      isConfirming,
      isSuccess,
      writeError: writeError?.message,
      confirmError: confirmError?.message,
      step
    });
  }, [hash, isPending, isConfirming, isSuccess, writeError, confirmError, step]);

  const fetchPrice = async () => {
    try {
      const res = await axios.get(`${API_URL}/domains/price/${domain}?duration=${duration * 31536000}`);
      setPrice(res.data.data.price);
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  };

  const handleRegister = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    setStep(2);
  };

  const confirmRegister = async () => {
    try {
      // Create simple metadata for agent
      const metadata = {
        agentType,
        owner: address,
        registeredAt: Date.now(),
        intelligenceScore: 0
      };
      const metadataJSON = JSON.stringify(metadata);

      // Use viem's keccak256 to hash the metadata
      const metadataHash = keccak256(toHex(metadataJSON));

      const metadataURI = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/metadata/${domain}`;

      // Call contract
      writeContract({
        address: REGISTRY_ADDRESS,
        abi: [{
          name: 'register',
          type: 'function',
          stateMutability: 'payable',
          inputs: [
            { name: 'name', type: 'string' },
            { name: 'owner', type: 'address' },
            { name: 'duration', type: 'uint256' },
            { name: 'metadataURI', type: 'string' },
            { name: 'metadataHash', type: 'bytes32' },
            { name: 'agentType', type: 'string' }
          ],
          outputs: [{ name: 'inftAddress', type: 'address' }]
        }],
        functionName: 'register',
        args: [
          domain,
          address as `0x${string}`,
          BigInt(duration * 31536000),
          metadataURI,
          metadataHash,
          agentType
        ],
        value: parseEther(price)
      });

      // Move to step 3 after writeContract is called
      setStep(3);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error?.message || 'Registration failed');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 text-center"
            >
              <Wallet className="w-16 h-16 text-primary-400 mx-auto mb-6" />
              <h2 className="text-2xl font-display font-bold mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-dark-300 mb-8">
                You need to connect your wallet to register a domain
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
              Register <span className="gradient-text">{domain}.0g</span>
            </h1>
            <p className="text-dark-300">
              Set up your AI-powered domain that learns from your actions
            </p>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[
                { num: 1, label: 'Setup' },
                { num: 2, label: 'Confirm' },
                { num: 3, label: 'Complete' }
              ].map((s, idx) => (
                <div key={s.num} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s.num
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                      : 'bg-white/10 text-dark-400'
                  }`}>
                    {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                  </div>
                  {idx < 2 && (
                    <div className={`w-16 sm:w-24 h-0.5 mx-2 ${
                      step > s.num ? 'bg-primary-500' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Step 1: Setup */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* AI Agent Type */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary-400" />
                  Choose Your AI Agent Type
                </h3>
                <p className="text-sm text-dark-400 mb-6">
                  Your domain will start with zero intelligence and learn from your blockchain activities
                </p>

                <div className="grid gap-4">
                  {Object.entries(agentTypeInfo).map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => setAgentType(key)}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        agentType === key
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-600 bg-dark-800/50 hover:border-dark-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{info.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{info.label}</h4>
                          <p className="text-sm text-dark-400">{info.description}</p>
                        </div>
                        {agentType === key && (
                          <CheckCircle className="w-5 h-5 text-primary-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Your agent starts with <strong>Intelligence Score: 0</strong> and will learn as you use it!
                    </span>
                  </p>
                </div>
              </div>

              {/* Duration */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-display font-bold mb-4">
                  Registration Period
                </h3>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold gradient-text min-w-[80px]">
                    {duration} {duration === 1 ? 'year' : 'years'}
                  </span>
                </div>
                <p className="text-dark-400 text-sm mt-2">
                  Total: {price ? `${parseFloat(price) * duration} 0G` : '...'}
                </p>
              </div>

              <button
                onClick={handleRegister}
                className="btn-primary w-full text-lg py-4"
              >
                Continue to Review
              </button>
            </motion.div>
          )}

          {/* Step 2: Confirm */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="glass-card p-6">
                <h3 className="text-lg font-display font-bold mb-4">
                  Review Registration
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-dark-400">Domain</span>
                    <span className="font-mono font-bold">{domain}.0g</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-dark-400">AI Agent Type</span>
                    <span className="font-bold">{agentTypeInfo[agentType as keyof typeof agentTypeInfo].label}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-dark-400">Duration</span>
                    <span className="font-bold">{duration} {duration === 1 ? 'year' : 'years'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-dark-400">Starting Intelligence</span>
                    <span className="font-bold text-blue-400">0 / 1000</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-dark-400 font-medium">Total Price</span>
                    <span className="text-xl font-bold gradient-text">
                      {price ? `${parseFloat(price) * duration} 0G` : '...'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 bg-primary-500/5 border-primary-500/20">
                <div className="flex gap-3">
                  <Brain className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-dark-300">
                    <p className="font-medium text-white mb-1">How Learning Works</p>
                    <p>Your agent will observe and learn from your blockchain transactions. The more you use it, the smarter it becomes!</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={confirmRegister}
                  disabled={isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Confirm in Wallet
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Register Domain
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Processing */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 text-center"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-16 h-16 text-primary-400 animate-spin mx-auto mb-6" />
                  <h3 className="text-2xl font-display font-bold mb-2">
                    Processing Transaction
                  </h3>
                  <p className="text-dark-300 mb-4">
                    Please wait while your domain is being registered...
                  </p>
                  {hash && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-dark-400">Transaction Hash:</p>
                      <p className="text-xs font-mono bg-dark-800/50 p-2 rounded break-all">
                        {hash}
                      </p>
                      <a
                        href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:text-primary-300 text-sm underline inline-block"
                      >
                        View on Explorer
                      </a>
                      <div className="pt-4">
                        <button
                          onClick={() => router.push('/domains')}
                          className="btn-secondary text-sm"
                        >
                          Continue Without Waiting
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-display font-bold mb-2">
                    Registration Successful!
                  </h3>
                  <p className="text-dark-300 mb-6">
                    Your AI agent domain {domain}.0g has been registered and is ready to learn!
                  </p>
                  <button
                    onClick={() => router.push('/domains')}
                    className="btn-primary"
                  >
                    View My Domains
                  </button>
                </>
              ) : (
                <>
                  <Loader2 className="w-16 h-16 text-primary-400 animate-spin mx-auto mb-6" />
                  <h3 className="text-2xl font-display font-bold mb-2">
                    Waiting for Confirmation
                  </h3>
                  <p className="text-dark-300">
                    Please confirm the transaction in your wallet
                  </p>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary-400 animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
