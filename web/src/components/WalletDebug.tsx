"use client";

import { useState } from 'react';
import { blockchainService } from '@/lib/blockchain';

export default function WalletDebug() {
  const [status, setStatus] = useState<string>('Ready');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setStatus('Testing...');
    setLogs([]);
    
    try {
      addLog('🔄 Starting connection test...');
      
      // Test 1: Check if MetaMask is available
      if (typeof window !== 'undefined' && window.ethereum) {
        addLog('✅ MetaMask is available');
      } else {
        addLog('❌ MetaMask is not available');
        setStatus('Failed: No MetaMask');
        return;
      }

      // Test 2: Initialize blockchain service
      addLog('🔄 Initializing blockchain service...');
      await blockchainService.initialize();
      addLog('✅ Blockchain service initialized');

      // Test 3: Check wallet connection
      addLog('🔍 Checking wallet connection...');
      const isConnected = await blockchainService.isConnected();
      addLog(`Wallet connected: ${isConnected ? '✅ Yes' : '❌ No'}`);

      // Test 4: Get user address
      if (isConnected) {
        const address = await blockchainService.getConnectedAddress();
        addLog(`User address: ${address}`);
      }

      // Test 5: Check contracts
      addLog('🔍 Checking contracts...');
      const contractsDeployed = await blockchainService.areContractsDeployed();
      addLog(`Contracts deployed: ${contractsDeployed ? '✅ Yes' : '❌ No'}`);

      // Test 6: Get network info
      const networkInfo = await blockchainService.getNetworkInfo();
      addLog(`Network: ${networkInfo ? `${networkInfo.name} (${networkInfo.chainId})` : 'Unknown'}`);

      if (isConnected && contractsDeployed) {
        setStatus('✅ All tests passed!');
        addLog('🎉 Connection test completed successfully');
      } else {
        setStatus('⚠️ Some tests failed');
        addLog('⚠️ Connection test completed with issues');
      }

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('❌ Test failed');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setStatus('Ready');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Wallet Connection Debug</h2>
      
      <div className="flex gap-3 mb-4">
        <button
          onClick={testConnection}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test Connection
        </button>
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Clear Logs
        </button>
      </div>

      <div className="mb-4">
        <span className="font-semibold">Status: </span>
        <span className={status.includes('✅') ? 'text-green-600' : status.includes('❌') ? 'text-red-600' : 'text-yellow-600'}>
          {status}
        </span>
      </div>

      <div className="bg-gray-100 rounded p-3 max-h-96 overflow-y-auto">
        <h3 className="font-semibold mb-2">Logs:</h3>
        {logs.length === 0 ? (
          <p className="text-gray-500">No logs yet. Click "Test Connection" to start.</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-sm font-mono">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
