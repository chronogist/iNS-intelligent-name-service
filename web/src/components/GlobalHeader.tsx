'use client';

import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';
import WalletConnect from './WalletConnect';
import { useWallet } from './WalletContext';

export default function GlobalHeader() {
  const router = useRouter();
  const { isWalletConnected, address, setIsWalletConnected, setAddress, setNetworkInfo, checkConnection } = useWallet();

  const handleWalletConnect = async (address: string) => {
    setIsWalletConnected(true);
    setAddress(address);
    await checkConnection();
  };

  const handleWalletDisconnect = () => {
    setIsWalletConnected(false);
    setAddress(null);
    setNetworkInfo(null);
  };

  const handleViewNamesOn0GScan = () => {
    if (address) {
      window.open(`https://chainscan-galileo.0g.ai/address/${address}?tab=nft-asset`, '_blank');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-0">
        <div className="flex h-16 items-center w-full">
          {/* Left side - Logo and Branding */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-white font-bold text-sm">i</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">iNS</h1>
          </div>
          
          {/* Middle - Maximum space to push elements to extremes */}
          <div className="flex-1 min-w-0"></div>
          
          {/* Right side - Navigation and Controls */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Theme Switcher */}
            <ThemeSwitcher />
            
            {/* My Profile Link */}
            <button
              onClick={() => router.push('/my-profile')}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium">My Profile</span>
            </button>
            
            {/* View Names on 0G Scan Button */}
            {isWalletConnected && address && (
              <button
                onClick={handleViewNamesOn0GScan}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <ExternalLink className="size-4" />
                <span className="text-sm font-medium">View Names on 0G Scan</span>
              </button>
            )}
            
            {/* Features Link */}
            <button
              onClick={() => router.push('/features')}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium">Features</span>
            </button>
            
            {/* Wallet Connection */}
            <WalletConnect 
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
