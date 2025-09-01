"use client";

import { useState } from 'react';

export default function NetworkSwitcher() {
  const [status, setStatus] = useState<string>('Ready');
  const [currentNetwork, setCurrentNetwork] = useState<string>('Unknown');

  const checkCurrentNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setStatus('MetaMask not available');
      return;
    }

    try {
      setStatus('Checking network...');
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      const networkName = getNetworkName(chainId);
      setCurrentNetwork(`${networkName} (${chainId})`);
      setStatus('Network checked');
    } catch (error) {
      setStatus('Failed to check network');
      console.error('Error checking network:', error);
    }
  };

  const getNetworkName = (chainId: string): string => {
    switch (chainId) {
      case '0x1':
        return 'Ethereum Mainnet';
      case '0x5':
        return 'Goerli Testnet';
      case '0xaa36a7':
        return 'Sepolia Testnet';
      case '0x40d9':
        return '0G Testnet (Galileo)';
      case '0x89':
        return 'Polygon Mainnet';
      case '0x13881':
        return 'Mumbai Testnet';
      default:
        return 'Unknown Network';
    }
  };

  const add0GTestnet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setStatus('MetaMask not available');
      return;
    }

    try {
      setStatus('Adding 0G testnet...');
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x40d9',
          chainName: '0G Testnet (Galileo)',
          nativeCurrency: {
            name: '0G',
            symbol: '0G',
            decimals: 18
          },
          rpcUrls: ['https://evmrpc-testnet.0g.ai/'],
          blockExplorerUrls: ['https://testnet.0g.ai/']
        }]
      });
      setStatus('✅ 0G testnet added successfully!');
      await checkCurrentNetwork();
    } catch (error: any) {
      if (error.code === 4001) {
        setStatus('❌ User rejected adding network');
      } else if (error.code === -32602) {
        setStatus('✅ Network already exists');
        await checkCurrentNetwork();
      } else {
        setStatus(`❌ Failed to add network: ${error.message}`);
      }
    }
  };

  const switchTo0GTestnet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setStatus('MetaMask not available');
      return;
    }

    try {
      setStatus('Switching to 0G testnet...');
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x40d9' }]
      });
      setStatus('✅ Switched to 0G testnet!');
      await checkCurrentNetwork();
    } catch (error: any) {
      if (error.code === 4001) {
        setStatus('❌ User rejected switching network');
      } else if (error.code === 4902) {
        setStatus('❌ Network not found. Please add it first.');
      } else {
        setStatus(`❌ Failed to switch network: ${error.message}`);
      }
    }
  };

  const manualInstructions = () => {
    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Manual Network Setup</h3>
        <p className="text-blue-700 text-sm mb-2">If automatic switching doesn't work, add 0G testnet manually in MetaMask:</p>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• <strong>Network Name:</strong> 0G Testnet (Galileo)</li>
          <li>• <strong>Chain ID:</strong> 16601</li>
          <li>• <strong>RPC URL:</strong> https://evmrpc-testnet.0g.ai/</li>
          <li>• <strong>Currency Symbol:</strong> 0G</li>
          <li>• <strong>Block Explorer:</strong> https://testnet.0g.ai/</li>
        </ul>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Network Switcher</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Current Network:</p>
        <p className="font-mono text-sm bg-gray-100 p-2 rounded">{currentNetwork}</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={checkCurrentNetwork}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Check Current Network
        </button>
        
        <button
          onClick={add0GTestnet}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add 0G Testnet
        </button>
        
        <button
          onClick={switchTo0GTestnet}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Switch to 0G Testnet
        </button>
      </div>

      <div className="mt-4">
        <span className="font-semibold">Status: </span>
        <span className={status.includes('✅') ? 'text-green-600' : status.includes('❌') ? 'text-red-600' : 'text-yellow-600'}>
          {status}
        </span>
      </div>

      {manualInstructions()}
    </div>
  );
}
