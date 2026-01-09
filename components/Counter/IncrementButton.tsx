'use client'

import { useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { useFrame } from '@/components/farcaster-provider';
import { useCounterContract } from '@/hooks/useCounterContract';
import { usePublicClient } from 'wagmi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

interface IncrementButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function IncrementButton({ onSuccess, onError }: IncrementButtonProps) {
  const { address, connector } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { context } = useFrame();
  const publicClient = usePublicClient();
  const { incrementCounter, refetch } = useCounterContract();
  const [isPending, setIsPending] = useState(false);

  const handleIncrement = async () => {
    if (!address) {
      onError?.(new Error('Please connect your wallet'));
      return;
    }

    if (!context?.user) {
      onError?.(new Error('Farcaster user data not available'));
      return;
    }

    setIsPending(true);

    try {
      const isConnectorGetChainIdError = (e: unknown) => {
        const msg =
          (e as any)?.shortMessage ||
          (e as any)?.message ||
          (typeof e === 'string' ? e : '');
        return typeof msg === 'string' && msg.toLowerCase().includes('connector.getchainid');
      };

      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      const autoReconnect = async (maxAttempts = 2) => {
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            // Prefer the currently-selected connector if available; otherwise fall back to first ready connector
            const preferred =
              connector ||
              connectors.find((c) => (c as any)?.ready) ||
              connectors[0];
            if (!preferred) break;
            await connectAsync({ connector: preferred });
            // brief pause to allow provider state to settle
            await sleep(200);
            return true;
          } catch {
            // try again on next iteration
            await sleep(200);
          }
        }
        return false;
      };

      // Get user data from Farcaster context
      const fid = context.user.fid;
      const username = context.user.username || `User ${fid}`;
      const imageUrl = context.user.pfpUrl || '';

      // Generate signature for reward (backend calculates amount and token)
      const sigResponse = await fetch('/api/counter/generate-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          fid,
        }),
      });

      const sigData = await sigResponse.json();

      if (!sigResponse.ok || !sigData.success) {
        throw new Error(sigData.error || 'Failed to generate signature');
      }

      // Prepare params once
      const txParams = {
        fid,
        username,
        imageUrl,
        rewardToken: sigData.tokenAddress,
        rewardAmount: BigInt(sigData.amountInWei),
        signature: sigData.signature,
      } as const;

      const sendTx = async () => {
        return await incrementCounter(txParams);
      };

      // Call incrementCounter; if connector.getChainId error occurs, auto-reconnect up to 2 times and retry once
      let txHash: `0x${string}` | undefined;
      try {
        txHash = await sendTx();
      } catch (e) {
        if (isConnectorGetChainIdError(e)) {
          const reconnected = await autoReconnect(2);
          if (reconnected) {
            txHash = await sendTx();
          } else {
            throw e;
          }
        } else {
          throw e;
        }
      }

      if (!txHash) {
        throw new Error('Transaction failed');
      }

      // Wait for transaction confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }

      // Refetch data
      refetch();

      onSuccess?.();
    } catch (error) {
      console.error('Increment error:', error);
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleIncrement}
      disabled={isPending || !address}
      className={`
        w-full py-4 px-6 rounded-xl font-bold text-lg
        bg-gradient-to-r from-blue-500 to-purple-600
        text-white shadow-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        flex items-center justify-center gap-2
      `}
    >
      {isPending ? (
        <>
          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <FontAwesomeIcon icon={faPlus} />
          <span>Increment Counter</span>
        </>
      )}
    </motion.button>
  );
}
