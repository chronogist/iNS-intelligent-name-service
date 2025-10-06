/**
 * Blockchain Sync for Learning Data
 * Syncs localStorage with on-chain data on page load
 */

import { createPublicClient, http } from 'viem';
import { getLearningData, saveLearningData, type LearningData } from './simple-learning';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://evmrpc-testnet.0g.ai';

/**
 * Sync learning data from blockchain to localStorage
 * Call this when user loads domain page
 */
export async function syncFromBlockchain(
  domain: string,
  inftAddress: string,
  agentType: string = 'custom'
): Promise<LearningData | null> {
  // Always fall back to local data first
  const localData = getLearningData(domain);

  // If no INFT address, can't sync
  if (!inftAddress || inftAddress === '0x0000000000000000000000000000000000000000') {
    return localData;
  }

  try {
    const publicClient = createPublicClient({
      transport: http(RPC_URL),
    });

    // Try to read from INFT contract (with timeout)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    const readPromise = Promise.all([
      publicClient.readContract({
        address: inftAddress as `0x${string}`,
        abi: [{
          name: 'intelligenceScore',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'uint256' }]
        }],
        functionName: 'intelligenceScore',
      }),
      publicClient.readContract({
        address: inftAddress as `0x${string}`,
        abi: [{
          name: 'totalActions',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'uint256' }]
        }],
        functionName: 'totalActions',
      }),
      publicClient.readContract({
        address: inftAddress as `0x${string}`,
        abi: [{
          name: 'successfulActions',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'uint256' }]
        }],
        functionName: 'successfulActions',
      }),
    ]);

    const [intelligenceScore, totalActions, successfulActions] = await Promise.race([
      readPromise,
      timeoutPromise
    ]) as any;

    // If no local data OR blockchain has more actions, use blockchain as source of truth
    if (!localData || Number(totalActions) > localData.totalActions) {
      const syncedData: LearningData = {
        domain,
        agentType,
        intelligenceScore: Number(intelligenceScore),
        totalActions: Number(totalActions),
        successfulActions: Number(successfulActions),
        transactions: localData?.transactions || [], // Keep local transactions
        lastUpdated: Date.now(),
      };

      saveLearningData(syncedData);
      return syncedData;
    }

    return localData;
  } catch (error: any) {
    // Silently fail and use local data
    console.warn('Could not sync from blockchain, using local data:', error);
    return localData;
  }
}

/**
 * Check if local data is synced with blockchain
 */
export async function isDataSynced(
  domain: string,
  inftAddress: string
): Promise<boolean> {
  try {
    const localData = getLearningData(domain);
    if (!localData) return true; // Nothing to sync

    const publicClient = createPublicClient({
      transport: http(RPC_URL),
    });

    const onChainScore = await publicClient.readContract({
      address: inftAddress as `0x${string}`,
      abi: [{
        name: 'intelligenceScore',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      }],
      functionName: 'intelligenceScore',
    });

    return Number(onChainScore) === localData.intelligenceScore;
  } catch (error: any) {
    console.error('Error checking sync status:', error);
    return false;
  }
}
