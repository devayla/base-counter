'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faCoins, faTimes, faRankingStar } from '@fortawesome/free-solid-svg-icons';

interface LeaderboardEntry {
  fid: number;
  username: string;
  imageUrl: string;
  userAddress: string;
  totalIncrements: number;
  totalRewards: number;
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Leaderboard({ isOpen, onClose }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
      // Refresh every 10 seconds when open
      const interval = setInterval(fetchLeaderboard, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/counter/leaderboard?limit=100');
      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Leaderboard Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-400 to-orange-400">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faRankingStar} className="text-2xl text-white" />
                <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <FontAwesomeIcon icon={faTrophy} className="text-4xl mb-4 opacity-50" />
                  <p>No entries yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <motion.div
                      key={entry.fid}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                        ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 shadow-lg' : ''}
                        ${index === 1 ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300' : ''}
                        ${index === 2 ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300' : ''}
                        ${index > 2 ? 'bg-white border-gray-200 hover:border-gray-300' : ''}
                      `}
                    >
                      {/* Rank */}
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                        ${index === 0 ? 'bg-yellow-400 text-white' : ''}
                        ${index === 1 ? 'bg-gray-400 text-white' : ''}
                        ${index === 2 ? 'bg-orange-400 text-white' : ''}
                        ${index > 2 ? 'bg-gray-200 text-gray-600' : ''}
                      `}>
                        {index + 1}
                      </div>

                      {/* Avatar */}
                      <div className="relative">
                        <img
                          src={entry.imageUrl || '/default-avatar.png'}
                          alt={entry.username}
                          className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><circle cx="24" cy="24" r="24" fill="%23e5e7eb"/></svg>';
                          }}
                        />
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1">
                            <FontAwesomeIcon 
                              icon={faTrophy} 
                              className={index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-500'}
                              style={{ fontSize: '16px' }}
                            />
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{entry.username || `Fid ${entry.fid}`}</h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faTrophy} />
                            <span className="font-semibold">{entry.totalIncrements}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faCoins} />
                            <span className="font-semibold">{entry.totalRewards.toFixed(4)} USDC</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
