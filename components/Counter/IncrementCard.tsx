'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faTrophy, faClock } from '@fortawesome/free-solid-svg-icons';
import type { IncrementInfo } from '@/hooks/useCounterContract';

interface IncrementCardProps {
  increment: IncrementInfo;
  isCurrentUser: boolean;
  index: number;
}

function formatRelativeTime(timestamp: bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const time = Number(timestamp);
  const diff = now - time;

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function IncrementCard({ increment, isCurrentUser }: IncrementCardProps) {
  return (
    <div className={`
      relative overflow-hidden rounded-2xl md:rounded-3xl transition-all duration-300
      ${isCurrentUser 
        ? 'bg-white shadow-2xl border-2 border-red-200 p-5 md:p-6 ring-2 ring-red-100' 
        : 'bg-white/70 backdrop-blur-sm border border-gray-100 p-4 md:p-5 shadow-sm'
      }
    `}>
      {isCurrentUser && (
        <div className="absolute top-0 right-0 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-bl-2xl shadow-lg">
          YOU
        </div>
      )}

      <div className={`flex items-center ${isCurrentUser ? 'gap-4 md:gap-5' : 'gap-3 md:gap-4'}`}>
        {/* Avatar */}
        <div className={`
          relative flex-shrink-0 rounded-full overflow-hidden border-2 bg-gray-100
          ${isCurrentUser 
            ? 'w-16 h-16 md:w-20 md:h-20 border-red-500 shadow-lg ring-4 ring-red-50' 
            : 'w-12 h-12 md:w-14 md:h-14 border-gray-200'
          }
        `}>
          {increment.imageUrl ? (
            <img 
              src={increment.imageUrl} 
              alt={increment.username}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.nextElementSibling) {
                  (target.nextElementSibling as HTMLElement).style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div 
            className="w-full h-full flex items-center justify-center text-gray-400"
            style={{ display: increment.imageUrl ? 'none' : 'flex' }}
          >
            <FontAwesomeIcon icon={faUser} className={isCurrentUser ? "text-2xl" : "text-sm"} />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className={`
              font-bold truncate leading-tight
              ${isCurrentUser ? 'text-lg md:text-xl text-gray-900' : 'text-sm md:text-base text-gray-700'}
            `}>
              {increment.username || `Fid ${increment.fid}`}
            </h3>
            {isCurrentUser && (
               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono border border-gray-200">
                 #{increment.fid.toString()}
               </span>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 md:gap-5 text-xs md:text-sm text-gray-500">
            <div className="flex items-center gap-1.5 md:gap-2" title="Total Increments">
              <FontAwesomeIcon icon={faTrophy} className={isCurrentUser ? "text-yellow-500" : "text-gray-400"} />
              <span className="font-semibold text-gray-700">
                {increment.userTotalIncrements ? increment.userTotalIncrements.toString() : '1'}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-2" title="Time">
              <FontAwesomeIcon icon={faClock} className="text-gray-300" />
              <span>{formatRelativeTime(increment.timestamp)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
