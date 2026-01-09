'use client'

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface PullLeverProps {
  onPull: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PullLever({ onPull, isLoading, disabled }: PullLeverProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const controls = useAnimation();
  const [isPulled, setIsPulled] = useState(false);

  // Map drag distance to rotation/scale effects
  const scale = useTransform(y, [0, 150], [1, 1.1]);
  const opacity = useTransform(y, [0, 150], [1, 0.5]);
  const arrowOpacity = useTransform(y, [0, 50], [1, 0]);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const threshold = 100; // Drag distance required to trigger
    
    if (info.offset.y > threshold && !isLoading && !disabled) {
      setIsPulled(true);
      
      // Trigger haptic feedback if available
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      
      onPull();
      
      // Reset after a delay or when loading starts
      await controls.start({ y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
      setIsPulled(false);
    } else {
      // Snap back if not pulled far enough
      controls.start({ y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  return (
    <div className="relative w-full h-64 flex justify-center items-start overflow-visible z-10">
      {/* 3D Track with depth */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex items-center">
        {/* Track shadow (behind) */}
        <div className="absolute top-0 bottom-0 w-3 bg-gradient-to-b from-gray-800 via-gray-700 to-gray-900 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]" />
        {/* Track highlight (front) */}
        <div className="relative w-2 bg-gradient-to-b from-gray-400 via-gray-300 to-transparent rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
      </div>
      
      <div ref={constraintsRef} className="absolute inset-0 flex justify-center">
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 150 }}
          dragElastic={0.1}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          animate={controls}
          style={{ y, scale }}
          className={`
            cursor-grab active:cursor-grabbing touch-none
            flex flex-col items-center justify-center
            ${disabled || isLoading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          {/* The Handle - 3D Modern Design */}
          <div className="relative group">
            {/* Outer glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400 to-red-600 blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
            
            {/* Main knob with 3D effect */}
            <div className={`
              relative w-20 h-20 rounded-full
              shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)]
              bg-gradient-to-br from-red-400 via-red-500 to-red-700
              border-4 border-white/90
              flex items-center justify-center
              z-20
              transform transition-all duration-200
              group-hover:scale-105 group-active:scale-95
              ${isPulled ? 'shadow-[0_4px_8px_rgba(0,0,0,0.3)]' : ''}
            `}>
              {/* Inner highlight for 3D depth */}
              <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
              
              {/* Inner shadow for depth */}
              <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-gradient-to-tl from-black/20 to-transparent pointer-events-none" />
              
              {/* Center content */}
              {isLoading ? (
                <FontAwesomeIcon icon={faSpinner} className="text-white text-2xl animate-spin relative z-10 drop-shadow-lg" />
              ) : (
                <div className="relative z-10">
                  {/* Center circle with depth */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] border border-red-900/50" />
                  {/* Inner highlight */}
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white/30 blur-sm" />
                </div>
              )}
            </div>
            
            {/* Connector rod with 3D effect */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-3 h-6 z-10">
              {/* Shadow side */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-800 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" />
              {/* Highlight side */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-400 to-gray-500 rounded-full opacity-60" 
                   style={{ clipPath: 'polygon(0 0, 60% 0, 60% 100%, 0 100%)' }} />
            </div>
          </div>

          {/* Helper Text/Icon with modern styling */}
          <motion.div 
            style={{ opacity: arrowOpacity }}
            className="mt-6 flex flex-col items-center gap-2"
          >
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest drop-shadow-sm">
              Pull to Increment
            </span>
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <FontAwesomeIcon icon={faArrowDown} className="text-gray-400 text-lg drop-shadow-sm" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
