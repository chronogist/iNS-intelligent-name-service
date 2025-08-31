"use client";

import { useRouter } from 'next/navigation';
import AddressMappingManager from '@/components/AddressMappingManager';

export default function AddressMappingPage() {
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
                <h1 className="text-2xl font-bold text-gray-900">Address Mapping</h1>
                <p className="text-gray-600">Quick NFT metadata queries and management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <AddressMappingManager />
      </div>
    </div>
  );
}
