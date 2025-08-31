'use client';

import { useRouter } from 'next/navigation';
import ThemeSwitcher from './ThemeSwitcher';
import WalletConnect from './WalletConnect';
import { useWallet } from './WalletContext';

export default function GlobalHeader() {
  const router = useRouter();
  const { isWalletConnected, setIsWalletConnected, setAddress, setNetworkInfo, checkConnection } = useWallet();

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-white font-bold text-sm">i</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">iNS</h1>
          </div>
          
          {/* Right side - Navigation and Controls */}
          <div className="flex items-center gap-4">
            {/* Theme Switcher */}
            <ThemeSwitcher />
            
            {/* My Profile Link */}
            <button
              onClick={() => router.push('/my-profile')}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium">My Profile</span>
            </button>
            
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
