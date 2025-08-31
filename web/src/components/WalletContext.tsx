'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { blockchainService } from '@/lib/blockchain';

interface WalletContextType {
  isWalletConnected: boolean;
  address: string | null;
  networkInfo: { chainId: bigint; name: string } | null;
  setIsWalletConnected: (connected: boolean) => void;
  setAddress: (address: string | null) => void;
  setNetworkInfo: (info: { chainId: bigint; name: string } | null) => void;
  checkConnection: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<{ chainId: bigint; name: string } | null>(null);

  const checkConnection = async () => {
    try {
      const connected = await blockchainService.isConnected();
      setIsWalletConnected(connected);
      
      if (connected) {
        const addr = await blockchainService.getConnectedAddress();
        setAddress(addr);
        
        const network = await blockchainService.getNetworkInfo();
        setNetworkInfo(network);
      } else {
        setAddress(null);
        setNetworkInfo(null);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsWalletConnected(false);
      setAddress(null);
      setNetworkInfo(null);
    }
  };

  const refreshProfile = async () => {
    // This will trigger a refresh of the user profile in the WalletConnect component
    // The WalletConnect component will automatically refresh its profile
    console.log('Refreshing profile in wallet context...');
    // Force a re-check of the connection which will trigger profile refresh
    await checkConnection();
    // Dispatch custom event to trigger profile refresh in WalletConnect
    window.dispatchEvent(new CustomEvent('refresh-profile'));
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const value = {
    isWalletConnected,
    address,
    networkInfo,
    setIsWalletConnected,
    setAddress,
    setNetworkInfo,
    checkConnection,
    refreshProfile
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
