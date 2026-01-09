'use client'

import { useAccount, useContractRead, usePublicClient, useWriteContract } from 'wagmi';
import { useFrame } from '@/components/farcaster-provider';
import { COUNTER_ADDRESS, COUNTER_ABI } from '@/lib/contracts';
import { useMemo } from 'react';

export interface IncrementInfo {
  user: string;
  fid: bigint;
  username: string;
  imageUrl: string;
  timestamp: bigint;
  userTotalIncrements: bigint;
}

export interface UseCounterContractReturn {
  // Data
  totalCounter: bigint | undefined;
  increments: IncrementInfo[];
  dailyRewardCount: number;
  userIncrementCount: number;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  incrementCounter: (params: {
    fid: number;
    username: string;
    imageUrl: string;
    rewardToken: string;
    rewardAmount: bigint;
    signature: string;
  }) => Promise<`0x${string}` | undefined>;
  
  // Utils
  refetch: () => void;
}

export function useCounterContract(): UseCounterContractReturn {
  const { address } = useAccount();
  const { context } = useFrame();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Calculate current day ID (timestamp / 1 day)
  const dayId = useMemo(() => {
    if (!publicClient) return BigInt(0);
    // We'll need to get current block timestamp, but for now use Date
    const now = Math.floor(Date.now() / 1000);
    return BigInt(Math.floor(now / 86400)); // 86400 seconds = 1 day
  }, [publicClient]);

  // Read total counter
  const { data: totalCounter, refetch: refetchCounter } = useContractRead({
    address: COUNTER_ADDRESS ? (COUNTER_ADDRESS as `0x${string}`) : undefined,
    abi: COUNTER_ABI,
    functionName: 'counter',
  });

  // Read increments around user
  const { data: incrementsData, refetch: refetchIncrements, isLoading: isLoadingIncrements } = useContractRead({
    address: COUNTER_ADDRESS && address ? (COUNTER_ADDRESS as `0x${string}`) : undefined,
    abi: COUNTER_ABI,
    functionName: 'getIncrementsAroundMe',
    args: address ? [address, BigInt(3), BigInt(3)] : undefined,
  });

  // Read daily reward count
  const { data: dailyRewardCountData, refetch: refetchDailyReward } = useContractRead({
    address: COUNTER_ADDRESS && address && dayId > 0 ? (COUNTER_ADDRESS as `0x${string}`) : undefined,
    abi: COUNTER_ABI,
    functionName: 'dailyRewardCount',
    args: address && dayId > 0 ? [address, dayId] : undefined,
  });

  // Read user's total increment count
  const { data: userIncrementCountData, refetch: refetchUserCount } = useContractRead({
    address: COUNTER_ADDRESS && address ? (COUNTER_ADDRESS as `0x${string}`) : undefined,
    abi: COUNTER_ABI,
    functionName: 'userIncrementCount',
    args: address ? [address] : undefined,
  });

  // Transform increments data
  const increments: IncrementInfo[] = useMemo(() => {
    if (!incrementsData) return [];
    return (incrementsData as IncrementInfo[]).map((inc) => ({
      user: inc.user,
      fid: inc.fid,
      username: inc.username,
      imageUrl: inc.imageUrl,
      timestamp: inc.timestamp,
      userTotalIncrements: inc.userTotalIncrements,
    }));
  }, [incrementsData]);

  const dailyRewardCount = useMemo(() => {
    return dailyRewardCountData ? Number(dailyRewardCountData) : 0;
  }, [dailyRewardCountData]);

  const userIncrementCount = useMemo(() => {
    return userIncrementCountData ? Number(userIncrementCountData) : 0;
  }, [userIncrementCountData]);

  const incrementCounter = async (params: {
    fid: number;
    username: string;
    imageUrl: string;
    rewardToken: string;
    rewardAmount: bigint;
    signature: string;
  }): Promise<`0x${string}` | undefined> => {
    if (!COUNTER_ADDRESS) {
      throw new Error('Counter contract address not configured');
    }

    const txHash = await writeContractAsync({
      address: COUNTER_ADDRESS as `0x${string}`,
      abi: COUNTER_ABI,
      functionName: 'incrementCounter',
      args: [
        BigInt(params.fid),
        params.username,
        params.imageUrl,
        params.rewardToken as `0x${string}`,
        params.rewardAmount,
        params.signature as `0x${string}`,
      ],
    });

    return txHash;
  };

  const refetch = () => {
    refetchCounter();
    refetchIncrements();
    refetchDailyReward();
    refetchUserCount();
  };

  return {
    totalCounter: totalCounter as bigint | undefined,
    increments,
    dailyRewardCount,
    userIncrementCount,
    isLoading: isLoadingIncrements,
    error: null,
    incrementCounter,
    refetch,
  };
}
