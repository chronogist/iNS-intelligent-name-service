import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { MARKETPLACE_ADDRESS } from '@/lib/marketplace-contract';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;

const REGISTRY_ABI = [{
  name: 'getINFT',
  type: 'function',
  stateMutability: 'view',
  inputs: [{ name: 'name', type: 'string' }],
  outputs: [{ name: '', type: 'address' }]
}];

const INFT_ABI = [
  {
    name: 'isApprovedForAll',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'setApprovalForAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' }
    ],
    outputs: []
  },
  {
    name: 'getApproved',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: []
  }
];

export function useINFTApproval(domainName: string, ownerAddress: `0x${string}` | undefined) {
  const [inftAddress, setInftAddress] = useState<`0x${string}` | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Get INFT address
  const { data: inftData } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'getINFT',
    args: [domainName],
    query: {
      enabled: !!domainName
    }
  });

  useEffect(() => {
    if (inftData && inftData !== '0x0000000000000000000000000000000000000000') {
      setInftAddress(inftData as `0x${string}`);
    }
  }, [inftData]);

  // Check if marketplace is approved for all
  const { data: isApprovedForAll, refetch: refetchApproval } = useReadContract({
    address: inftAddress || undefined,
    abi: INFT_ABI,
    functionName: 'isApprovedForAll',
    args: ownerAddress && MARKETPLACE_ADDRESS ? [ownerAddress, MARKETPLACE_ADDRESS] : undefined,
    query: {
      enabled: !!inftAddress && !!ownerAddress && !!MARKETPLACE_ADDRESS
    }
  });

  // Check specific token approval
  const { data: approvedAddress } = useReadContract({
    address: inftAddress || undefined,
    abi: INFT_ABI,
    functionName: 'getApproved',
    args: [BigInt(0)], // Token ID 0 for domains
    query: {
      enabled: !!inftAddress
    }
  });

  const { writeContractAsync } = useWriteContract();

  const approveMarketplace = async () => {
    if (!inftAddress) {
      toast.error('INFT address not found');
      return false;
    }

    try {
      setIsApproving(true);
      toast.loading('Approving marketplace...', { id: 'approve' });

      const hash = await writeContractAsync({
        address: inftAddress,
        abi: INFT_ABI,
        functionName: 'setApprovalForAll',
        args: [MARKETPLACE_ADDRESS, true],
      });

      toast.loading('Waiting for confirmation...', { id: 'approve' });

      // Wait a bit for the transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 3000));

      await refetchApproval();

      toast.success('Marketplace approved! You can now list your domain.', { id: 'approve' });
      return true;
    } catch (error: any) {
      console.error('Error approving marketplace:', error);
      toast.error(error.message || 'Failed to approve marketplace', { id: 'approve' });
      return false;
    } finally {
      setIsApproving(false);
    }
  };

  const isApproved = Boolean(
    isApprovedForAll ||
    (approvedAddress && typeof approvedAddress === 'string' && approvedAddress.toLowerCase() === MARKETPLACE_ADDRESS.toLowerCase())
  );

  return {
    isApproved,
    isApproving,
    approveMarketplace,
    inftAddress,
    refetchApproval,
  };
}
