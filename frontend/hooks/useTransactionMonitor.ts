import { useEffect } from 'react';
import { useAccount, useBlockNumber } from 'wagmi';
import { usePublicClient } from 'wagmi';

/**
 * Simple transaction monitor
 * Watches for new transactions from the connected wallet
 */
export function useTransactionMonitor(onTransaction: (tx: any) => void) {
  const { address } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!address || !publicClient || !blockNumber) return;

    // Get transactions from the latest block
    const checkTransactions = async () => {
      try {
        const block = await publicClient.getBlock({
          blockNumber: blockNumber,
          includeTransactions: true,
        });

        // Check if any transactions are from our address
        const userTxs = (block.transactions as any[]).filter(
          (tx: any) => tx.from?.toLowerCase() === address.toLowerCase()
        );

        // Notify about each transaction
        userTxs.forEach((tx) => {
          onTransaction({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value?.toString() || '0',
            gasPrice: tx.gasPrice?.toString() || '0',
            gas: tx.gas?.toString() || '0',
            blockNumber: Number(blockNumber),
            timestamp: Date.now(),
          });
        });
      } catch (error) {
        console.error('Error checking transactions:', error);
      }
    };

    checkTransactions();
  }, [address, blockNumber, publicClient, onTransaction]);
}
