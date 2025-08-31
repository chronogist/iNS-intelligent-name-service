"use client";

import { motion } from "framer-motion";
import { Search, Crown, Zap, Globe, CheckCircle, XCircle, AlertCircle, Shield, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { blockchainService } from "@/lib/blockchain";
import { ethers } from "ethers";
import WalletConnect from "@/components/WalletConnect";
import SuccessModal from "@/components/SuccessModal";
import { useWallet } from "@/components/WalletContext";


interface NameStatus {
  isValid: boolean;
  isAvailable: boolean;
  message: string;
  status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';
  price?: bigint;
  owner?: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [nameStatus, setNameStatus] = useState<NameStatus>({
    isValid: false,
    isAvailable: false,
    message: "",
    status: 'idle'
  });
  const { isWalletConnected, refreshProfile } = useWallet();
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationHash, setRegistrationHash] = useState<string | null>(null);
  const [contractsDeployed, setContractsDeployed] = useState<boolean | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    contractsDeployed: boolean | null;
    contractTest: any;
    networkInfo: any;
  }>({
    contractsDeployed: null,
    contractTest: null,
    networkInfo: null
  });
  const [successModalData, setSuccessModalData] = useState<{
    isOpen: boolean;
    name: string;
    transactionHash: string;
    tokenId?: string;
    ownerAddress: string;
    price: string;
    metadataHash?: string;
    encryptedURI?: string;
  }>({
    isOpen: false,
    name: '',
    transactionHash: '',
    ownerAddress: '',
    price: '',
    metadataHash: '',
    encryptedURI: ''
  });

  // Check name availability using blockchain
  const checkNameAvailability = async (name: string) => {
    if (name.length < 3) {
      setNameStatus({
        isValid: false,
        isAvailable: false,
        message: "",
        status: 'idle'
      });
      return;
    }

    // Normalize to lowercase for validation and display
    const normalizedName = name.toLowerCase();
    
    if (!/^[a-z0-9]{3,}$/.test(normalizedName)) {
      setNameStatus({
        isValid: false,
        isAvailable: false,
        message: "Invalid characters. Use only letters and numbers.",
        status: 'invalid'
      });
      return;
    }

    setNameStatus(prev => ({ ...prev, status: 'checking' }));

    try {
      const result = await blockchainService.checkNameAvailability(normalizedName);
      
             if (result.isAvailable) {
                  const priceInOg = ethers.formatEther(result.price || BigInt(0));
         setNameStatus({
           isValid: true,
           isAvailable: true,
           message: `${normalizedName}.0g is available for ${priceInOg} OG!`,
           status: 'available',
           price: result.price
         });
      } else {
        setNameStatus({
          isValid: true,
          isAvailable: false,
          message: `${normalizedName}.0g is already registered by ${result.owner?.slice(0, 6)}...${result.owner?.slice(-4)}`,
          status: 'taken',
          owner: result.owner
        });
      }
    } catch (error) {
      console.error('Error checking name availability:', error);
      
      // Check if this is a contract deployment error
      if (error instanceof Error && error.message.includes('Contracts not deployed')) {
        setNameStatus({
          isValid: false,
          isAvailable: false,
          message: "Contracts not deployed. Please deploy the contracts first.",
          status: 'error'
        });
      } else {
        setNameStatus({
          isValid: false,
          isAvailable: false,
          message: "Error checking availability. Please try again.",
          status: 'error'
        });
      }
    }
  };

  // Check if contracts are deployed
  useEffect(() => {
    const checkContracts = async () => {
      try {
        await blockchainService.initialize();
        const deployed = await blockchainService.areContractsDeployed();
        setContractsDeployed(deployed);
      } catch (error) {
        console.warn('Could not check contract deployment status:', error);
        setContractsDeployed(false);
      }
    };
    
    checkContracts();
  }, []);

  // Debounced effect to check availability
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 3 && contractsDeployed !== false) {
        checkNameAvailability(query);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, contractsDeployed]);

  const getStatusIcon = () => {
    switch (nameStatus.status) {
      case 'checking':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent" />;
      case 'available':
        return <CheckCircle className="size-4 text-success" />;
      case 'taken':
        return <XCircle className="size-4 text-destructive" />;
      case 'invalid':
        return <AlertCircle className="size-4 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusStyles = () => {
    switch (nameStatus.status) {
      case 'available':
        return "bg-success/10 text-success border-success/20";
      case 'taken':
        return "bg-destructive/10 text-destructive border-destructive/20";
      case 'invalid':
        return "bg-warning/10 text-warning border-warning/20";
      case 'checking':
        return "bg-accent/10 text-accent border-accent/20";
      case 'error':
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "";
    }
  };

  const handleRegister = async () => {
    if (!isWalletConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!nameStatus.isAvailable) {
      alert('Name is not available for registration');
      return;
    }

    setIsRegistering(true);
    try {
      const address = await blockchainService.getConnectedAddress();
      const result = await blockchainService.registerName(query);
      setRegistrationHash(result.hash);
      
      // Show success modal with 0G Storage info
      setSuccessModalData({
        isOpen: true,
        name: query,
        transactionHash: result.hash,
        tokenId: result.tokenId,
        ownerAddress: address || '',
        price: ethers.formatEther(nameStatus.price || BigInt(0)),
        metadataHash: result.metadataHash,
        encryptedURI: result.encryptedURI
      });
      
      // Refresh availability check
      setTimeout(() => {
        checkNameAvailability(query);
      }, 2000);
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Registration failed: ${errorMessage}`);
    } finally {
      setIsRegistering(false);
    }
  };



  const handleProfileUpdate = () => {
    // This will trigger a refresh of the wallet connection display
    // The WalletConnect component will automatically refresh its profile
    setTimeout(async () => {
      try {
        await refreshProfile();
        console.log('Profile refreshed after registration');
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }, 2000);
  };

  const handleCloseSuccessModal = () => {
    setSuccessModalData(prev => ({ ...prev, isOpen: false }));
  };

  const testContractConnection = async () => {
    try {
      console.log('🔍 Testing contract connection...');
      
      // Initialize blockchain service
      await blockchainService.initialize();
      
      // Test contract deployment
      const deployed = await blockchainService.areContractsDeployed();
      console.log('Contracts deployed:', deployed);
      
      // Test contract connection
      const contractTest = await blockchainService.testContractConnection();
      console.log('Contract test result:', contractTest);
      
      // Get network info
      const networkInfo = await blockchainService.getNetworkInfo();
      console.log('Network info:', networkInfo);
      
      setDebugInfo({
        contractsDeployed: deployed,
        contractTest,
        networkInfo
      });
      
      alert(`Contract Test Results:\nRegistry: ${contractTest.registry ? '✅' : '❌'}\nRegistrar: ${contractTest.registrar ? '✅' : '❌'}\nPrice: ${contractTest.price || 'N/A'}`);
      
    } catch (error) {
      console.error('Contract test failed:', error);
      alert(`Contract test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
        {/* Subtle radial overlays for light mode */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(153,179,182,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,110,53,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(245,158,11,0.1),transparent_50%)]" />
        
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          {/* Logo/Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <motion.h1 
              className="clean-type text-6xl md:text-8xl font-bold tracking-[-0.05em] text-gray-900 dark:text-white mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 1.2, 
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.2 
              }}
              whileHover={{ 
                scale: 1.05,
                textShadow: "0 0 20px rgba(59, 130, 246, 0.3)"
              }}
            >
              iNS
            </motion.h1>
            
            {/* Animated tagline with staggered text reveal */}
            <div className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mb-2"
              >
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="inline-block"
                >
                  Replace complex 0x address with name that grow with you.
                </motion.span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
              >
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                  className="inline-block"
                >
                  Intelligent NFTs for evolving digital identities.
                </motion.span>
              </motion.div>
            </div>
            
            {/* Floating animation elements */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-20"
              animate={{ 
                y: [0, -20, 0],
                opacity: [0.2, 0.6, 0.2]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1.5
              }}
            />
            <motion.div
              className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-400 rounded-full opacity-30"
              animate={{ 
                y: [0, -15, 0],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 2
              }}
            />
            <motion.div
              className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-25"
              animate={{ 
                y: [0, -25, 0],
                opacity: [0.25, 0.7, 0.25]
              }}
              transition={{ 
                duration: 3.5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1.8
              }}
            />
          </motion.div>

          {/* Search Component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="max-w-4xl mx-auto mb-8"
          >
                          <div className="group relative">
                {/* Main input container */}
                <div className="relative flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-6 py-4 md:py-6">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Register your name"
                    className="flex-1 bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 text-2xl md:text-4xl font-semibold clean-type tracking-[-0.05em] text-gray-900 dark:text-white"
                  />
                
                <div className="flex items-center gap-4 ml-4">
                  {/* Status badge */}
                  {nameStatus.status !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`px-4 py-2 rounded-full text-sm font-medium lux-type tracking-[-0.05em] border flex items-center gap-2 ${getStatusStyles()}`}
                    >
                      {getStatusIcon()}
                      <span className="hidden md:inline">
                        {nameStatus.status === 'checking' ? 'Checking...' : 
                         nameStatus.status === 'available' ? 'Available' :
                         nameStatus.status === 'taken' ? 'Taken' :
                         nameStatus.status === 'invalid' ? 'Invalid' : ''}
                      </span>
                    </motion.div>
                  )}
                  
                  {/* Register button */}
                  <button
                    onClick={handleRegister}
                    disabled={nameStatus.status === 'checking' || !nameStatus.isAvailable || isRegistering || !isWalletConnected}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Register name"
                  >
                    {isRegistering ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ) : nameStatus.isAvailable ? (
                      <Check className="size-5" />
                    ) : (
                      <Search className="size-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Status message */}
            {nameStatus.message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center"
              >
                <p className={`text-sm font-medium clean-type tracking-[-0.05em] ${
                  nameStatus.status === 'available' ? 'text-green-700 dark:text-green-400' :
                  nameStatus.status === 'taken' ? 'text-red-700 dark:text-red-400' :
                  nameStatus.status === 'invalid' ? 'text-orange-700 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {nameStatus.message}
                </p>
              </motion.div>
            )}
            
            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Use a-z, 0-9. Minimum 3 characters.
            </p>
            
            {/* Registration Status */}
            {registrationHash && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center"
              >
                <p className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 inline-block">
                  ✅ Registration successful! Hash: {registrationHash.slice(0, 10)}...{registrationHash.slice(-8)}
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Contract Deployment Warning */}
          {contractsDeployed === false && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.8 }}
              className="max-w-4xl mx-auto mb-8"
            >
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Contracts Not Deployed</span>
                </div>
                <p className="text-yellow-700 text-sm">
                  The smart contracts are not deployed on this network. Please deploy the contracts first or switch to a network where they are deployed.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Complexity Removal Demo Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="clean-type text-3xl md:text-4xl font-bold tracking-[-0.05em] text-gray-900 dark:text-white mb-4">
              Farewell to complexity
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              No more confusing hex addresses. Your iNS name is easy to remember, easy to share.
            </p>
          </motion.div>

          {/* Demo Window */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Window Header */}
              <div className="bg-gray-100 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="ml-4 text-sm text-gray-600 dark:text-gray-300">iNS Demo</div>
                </div>
              </div>

              {/* Demo Content */}
              <div className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800">
                <div className="space-y-6">
                  {/* Chat Messages */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="flex justify-start"
                  >
                    <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-bl-md max-w-xs">
                      <p className="text-sm">What's your crypto address so I can pay you?</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="flex justify-end"
                  >
                    <div className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-2xl rounded-br-md max-w-xs shadow-sm border border-gray-200 dark:border-gray-600">
                      <p className="text-xs font-mono break-all">
                        0x0b08dA7068b73A579Bd5E8a8290ff8afd37bc32A
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="flex justify-start"
                  >
                    <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-bl-md max-w-xs">
                      <p className="text-sm">Wow. Go to ins.app</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.0, duration: 0.6 }}
                    className="flex justify-end"
                  >
                    <div className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-2xl rounded-br-md max-w-xs shadow-sm border border-gray-200 dark:border-gray-600">
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        This is so much simpler! Send to alice.0g
                      </p>
                    </div>
                  </motion.div>

                  {/* Additional Benefits */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <span className="text-white text-xl">🎯</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Easy to Remember</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">No more copying long addresses. Just remember alice.0g</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <span className="text-white text-xl">🔗</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Easy to Share</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Share your identity with a simple .0g name</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <span className="text-white text-xl">🛡️</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Secure & Owned</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Your name is an NFT - you own it completely</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="clean-type text-3xl md:text-4xl font-bold tracking-[-0.05em] text-gray-900 dark:text-white mb-4">
              Why choose iNS?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Built for the modern web with cutting-edge technology and elegant design.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Crown,
                title: "Own your handle",
                description: "Names are NFTs—portable across apps and wallets with full ownership.",
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: Zap,
                title: "Gas-optimized",
                description: "Carefully engineered Solidity contracts for fair and efficient minting.",
                color: "from-orange-500 to-orange-600"
              },
              {
                icon: Globe,
                title: "Resolve anywhere",
                description: "Registry and resolver system for seamless name lookups across the network.",
                color: "from-green-500 to-green-600"
              },
              {
                icon: Shield,
                title: "0G Storage",
                description: "Metadata automatically encrypted and stored on 0G Storage with Merkle proofs.",
                color: "from-purple-500 to-purple-600"
              }
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="group relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6`}>
                    <feature.icon className="size-6" />
                  </div>
                  <h3 className="clean-type text-xl font-semibold tracking-[-0.05em] text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Debug Panel */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={testContractConnection}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          🔍 Test Contracts
        </button>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={successModalData.isOpen}
        onClose={handleCloseSuccessModal}
        name={successModalData.name}
        transactionHash={successModalData.transactionHash}
        tokenId={successModalData.tokenId}
        ownerAddress={successModalData.ownerAddress}
        price={successModalData.price}
        metadataHash={successModalData.metadataHash}
        encryptedURI={successModalData.encryptedURI}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
}
