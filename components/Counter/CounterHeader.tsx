'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHashtag, faGift } from '@fortawesome/free-solid-svg-icons';

interface CounterHeaderProps {
  totalCounter: bigint | undefined;
  dailyRewardCount: number;
  userIncrementCount: number;
  isLoading?: boolean;
}

export function CounterHeader({ totalCounter, dailyRewardCount, userIncrementCount, isLoading }: CounterHeaderProps) {
  return (
    <div className="w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 shadow-lg">
      <div className="flex flex-col gap-4">
        {/* Title */}
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FontAwesomeIcon icon={faHashtag} />
          Counter Mini App
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {/* Total Counter */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-white/80 text-sm mb-1">Total Counter</div>
            <div className="text-3xl font-bold text-white">
              {isLoading ? (
                <div className="h-8 w-20 bg-white/20 rounded animate-pulse" />
              ) : (
                totalCounter?.toString() || '0'
              )}
            </div>
          </div>

          {/* Your Increments */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-white/80 text-sm mb-1">Your Increments</div>
            <div className="text-3xl font-bold text-white">
              {isLoading ? (
                <div className="h-8 w-20 bg-white/20 rounded animate-pulse" />
              ) : (
                userIncrementCount
              )}
            </div>
          </div>

          {/* Daily Rewards */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-white/80 text-sm mb-1 flex items-center gap-1">
              <FontAwesomeIcon icon={faGift} className="text-xs" />
              Rewarded Today
            </div>
            <div className="text-3xl font-bold text-white">
              {isLoading ? (
                <div className="h-8 w-20 bg-white/20 rounded animate-pulse" />
              ) : (
                `${dailyRewardCount} / 10`
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
