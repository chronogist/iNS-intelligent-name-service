'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAccount, useReadContract } from 'wagmi';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { address } = useAccount();

  const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;

  // Get primary name for connected address
  const { data: primaryName } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: [{
      name: 'getPrimaryName',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'addr', type: 'address' }],
      outputs: [{ name: '', type: 'string' }]
    }],
    functionName: 'getPrimaryName',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address
    }
  });

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/domains', label: 'My Domains' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/explore', label: 'Explore' },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className="glass-card px-4 sm:px-6 py-3 sm:py-4 shadow-glow">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all duration-300 group-hover:scale-110">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="font-display text-xl sm:text-2xl font-bold gradient-text hidden sm:block">
                iNS
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-dark-200 hover:text-white font-medium rounded-lg hover:bg-white/10 transition-all duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Connect Button - Desktop */}
              <div className="hidden sm:block">
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    mounted,
                  }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          style: {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <button onClick={openConnectModal} className="btn-primary">
                                Connect Wallet
                              </button>
                            );
                          }

                          if (chain.unsupported) {
                            return (
                              <button onClick={openChainModal} className="btn-primary bg-red-500">
                                Wrong network
                              </button>
                            );
                          }

                          return (
                            <div className="flex items-center gap-3">
                              {primaryName && (
                                <Link
                                  href={`/domains/${primaryName}`}
                                  className="px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 rounded-lg transition-all group"
                                >
                                  <span className="font-medium text-primary-300 group-hover:text-primary-200">
                                    {primaryName}.0g
                                  </span>
                                </Link>
                              )}
                              <button
                                onClick={openAccountModal}
                                className="glass-card px-4 py-2 hover:bg-white/10 transition-colors"
                              >
                                {account.displayName}
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>

              {/* Connect Button - Mobile (Icon Only) */}
              <div className="block sm:hidden">
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    mounted,
                  }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          style: {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <button onClick={openConnectModal} className="btn-primary">
                                Connect
                              </button>
                            );
                          }

                          return (
                            <button
                              onClick={openAccountModal}
                              className="glass-card px-3 py-2 hover:bg-white/10 transition-colors"
                            >
                              {account.displayName}
                            </button>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-2 max-w-7xl mx-auto overflow-hidden"
          >
            <div className="glass-card p-4 space-y-2 shadow-glow">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-dark-200 hover:text-white font-medium rounded-lg hover:bg-white/10 transition-all duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}