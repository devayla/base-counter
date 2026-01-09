'use client'

import { useAccount } from 'wagmi';
import { useCounterContract } from '@/hooks/useCounterContract';
import { IncrementCard } from './IncrementCard';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';

const UPPER_BOUND = 3; // Max users above
const LOWER_BOUND = 3; // Max users below
const MAX_TOTAL = UPPER_BOUND + 1 + LOWER_BOUND; // +1 for current user

export function IncrementFeed() {
  const { address } = useAccount();
  const { increments, isLoading } = useCounterContract();

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center gap-4 py-8">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`
              w-full rounded-xl bg-gray-100 animate-pulse
              ${i === 1 ? 'h-32 scale-110 shadow-lg' : 'h-20 opacity-50 scale-90'}
            `}
          />
        ))}
      </div>
    );
  }

  if (increments.length === 0) {
    return (
      <div className="w-full py-20 text-center flex flex-col items-center justify-center opacity-50">
        <FontAwesomeIcon icon={faUsers} className="text-4xl text-gray-400 mb-4" />
        <p className="text-gray-500 font-medium">Be the first to pull the lever!</p>
      </div>
    );
  }

  // Find current user's position and calculate bounds
  const userIndex = increments.findIndex(inc => inc.user.toLowerCase() === address?.toLowerCase());
  const usersAbove = userIndex !== -1 ? userIndex : 0;
  const usersBelow = userIndex !== -1 ? increments.length - userIndex - 1 : 0;

  return (
    <div className="w-full flex flex-col items-center gap-3 md:gap-4 py-2 relative z-10">
      
     

      {increments.map((increment, index) => {
        const isCurrentUser = increment.user.toLowerCase() === address?.toLowerCase();
        
        // Calculate visual properties based on distance from current user
        let dist = 0;
        if (userIndex !== -1) {
          dist = Math.abs(index - userIndex);
        } else {
          dist = Math.abs(index - Math.floor(increments.length / 2));
        }

        // Scale based on distance (no opacity fade)
        const scale = Math.max(0.85, 1.15 - (dist * 0.12));
        const zIndex = 10 - dist;

        return (
          <motion.div
            key={`${increment.user}-${increment.timestamp}-${index}`}
            layout
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: isCurrentUser ? 1.15 : scale,
              y: 0 
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`
              w-full max-w-md md:max-w-lg transition-all duration-500
              ${isCurrentUser ? 'my-6 z-20' : 'z-0'}
            `}
            style={{ zIndex }}
          >
            <IncrementCard
              increment={increment}
              isCurrentUser={isCurrentUser}
              index={index}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
