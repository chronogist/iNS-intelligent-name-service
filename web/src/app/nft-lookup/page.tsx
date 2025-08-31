"use client";

import { useRouter } from 'next/navigation';
import NFTLookup from '@/components/NFTLookup';

export default function NFTLookupPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ← Back to Home
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">NFT Lookup</h1>
                <p className="text-gray-600">Check what NFTs any address owns</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <NFTLookup />
      </div>
    </div>
  );
}
