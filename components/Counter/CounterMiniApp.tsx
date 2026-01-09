'use client'

import { useState, useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';
import { useFrame } from '@/components/farcaster-provider';
import { useCounterContract } from '@/hooks/useCounterContract';
import { usePublicClient } from 'wagmi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faBolt, faTrophy, faShareNodes, faWallet, faRankingStar } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

import { IncrementFeed } from './IncrementFeed';
import { PullLever } from './PullLever';
import { Leaderboard } from './Leaderboard';
import { captureCounterShareImage } from '@/lib/capture-counter-share';

export function CounterMiniApp() {
  const { isConnected, address } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { context, actions } = useFrame();
  const publicClient = usePublicClient();
  const { 
    totalCounter, 
    userIncrementCount,
    incrementCounter, 
    refetch 
  } = useCounterContract();
  
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showShareButton, setShowShareButton] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [totalRewards, setTotalRewards] = useState<number>(0);
  const [animatedCounter, setAnimatedCounter] = useState<bigint | undefined>(totalCounter);
  const [hasAutoSharedThisSession, setHasAutoSharedThisSession] = useState<boolean>(false);
  const [hasIncrementedThisSession, setHasIncrementedThisSession] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);

  // localStorage key for rewards
  const REWARDS_STORAGE_KEY = 'counter_rewards';

  // Helper functions for localStorage
  const getTotalRewards = (): number => {
    if (typeof window === 'undefined') return 0;
    try {
      const stored = localStorage.getItem(REWARDS_STORAGE_KEY);
      if (!stored) return 0;
      const rewards = JSON.parse(stored) as number[];
      return rewards.reduce((sum, amount) => sum + amount, 0);
    } catch (error) {
      console.error('Error reading rewards from localStorage:', error);
      return 0;
    }
  };

  const addRewardToStorage = (amount: number): void => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(REWARDS_STORAGE_KEY);
      const rewards = stored ? (JSON.parse(stored) as number[]) : [];
      rewards.push(amount);
      localStorage.setItem(REWARDS_STORAGE_KEY, JSON.stringify(rewards));
      setTotalRewards(getTotalRewards());
    } catch (error) {
      console.error('Error saving reward to localStorage:', error);
    }
  };

  // Load total rewards on mount
  useEffect(() => {
    setTotalRewards(getTotalRewards());
    // Initialize animated counter
    setAnimatedCounter(totalCounter);
  }, []);

  // Animate counter when it changes
  useEffect(() => {
    if (!totalCounter || !animatedCounter) {
      setAnimatedCounter(totalCounter);
      return;
    }

    const startValue = Number(animatedCounter);
    const endValue = Number(totalCounter);
    const difference = endValue - startValue;

    // If no change or difference is too large, just set it directly
    if (difference === 0 || Math.abs(difference) > 100) {
      setAnimatedCounter(totalCounter);
      return;
    }

    // Calculate animation duration based on difference (faster for larger jumps)
    const duration = Math.min(800, Math.max(200, Math.abs(difference) * 30));
    const steps = Math.abs(difference);
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        const currentValue = startValue + (difference > 0 ? currentStep : -currentStep);
        setAnimatedCounter(BigInt(currentValue));
      } else {
        setAnimatedCounter(totalCounter);
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [totalCounter]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => refetch(), 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Auto-share on first increment of each session
  useEffect(() => {
    // Only trigger when user has just incremented and hasn't auto-shared yet
    if (!hasIncrementedThisSession || hasAutoSharedThisSession) return;
    
    // Check if we have the required context for sharing
    if (!context?.user || !actions?.composeCast) {
      console.log('🔍 Auto-share waiting for context...', {
        hasContext: !!context?.user,
        hasActions: !!actions?.composeCast,
      });
      return;
    }

    // Mark as shared immediately to prevent duplicate triggers
    setHasAutoSharedThisSession(true);
    
    console.log('🚀 Auto-share triggered on first increment of session!');
    
    // Execute auto-share logic
    const executeAutoShare = async () => {
      // Add delay to ensure counter data is updated
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        setIsSharing(true);
        
        const username = context.user.username || `User ${context.user.fid}`;
        const pfpUrl = context.user.pfpUrl || '';
        
        // Refetch to get latest counter value
        refetch();
        
        // Wait a bit more for refetch to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 1. Capture share image with latest values
        const imageBlob = await captureCounterShareImage(
          totalCounter,
          username,
          userIncrementCount,
          pfpUrl,
          totalRewards
        );

        // 2. Upload to IPFS
        const formData = new FormData();
        formData.append('file', imageBlob, `counter-share-${Date.now()}.png`);

        const uploadResponse = await fetch('/api/ipfs/upload-image', {
          method: 'POST',
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        
        if (!uploadResult.success || !uploadResult.ipfsUrl) {
          throw new Error('Failed to upload image to IPFS');
        }

        const params = new URLSearchParams({ imageUrl: uploadResult.ipfsUrl || '' })
        const composedShareUrl = `${window.location.origin}?${params.toString()}`

        // 3. Share to Farcaster
        let shareText = `I incremented Base Counter to ${totalCounter?.toString() || '0'}🎉! I am based now 🟦`;
        
        await actions.composeCast({
          text: shareText,
          embeds: [composedShareUrl],
        });

        setToast({ type: 'success', message: 'Auto-shared to Farcaster! 🎉' });
        setTimeout(() => setToast(null), 3000);
        setShowShareButton(false);
      } catch (error) {
        console.error('Auto-share error:', error);
        // Don't show error toast for auto-share, just log it
        // But show share button so user can manually share
        setShowShareButton(true);
      } finally {
        setIsSharing(false);
      }
    };
    
    executeAutoShare();
    
  }, [hasIncrementedThisSession, hasAutoSharedThisSession, context, actions]);

  // Particle Background
  const Particles = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-tr from-red-100 to-orange-100 opacity-40"
          initial={{
            x: Math.random() * 100 + "vw",
            y: Math.random() * 100 + "vh",
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [null, Math.random() * 100 + "vh"],
            rotate: [0, 360],
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            width: Math.random() * 50 + 20 + "px",
            height: Math.random() * 50 + 20 + "px",
          }}
        />
      ))}
    </div>
  );

  const handlePull = async () => {
    if (!address || !context?.user) return;
    
    setIsProcessing(true);
    try {
      // 1. Get User Info
      const fid = context.user.fid;
      const username = context.user.username || `User ${fid}`;
      const imageUrl = context.user.pfpUrl || '';

      // 2. Generate Signature
      const sigResponse = await fetch('/api/counter/generate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: address, fid }),
      });

      const sigData = await sigResponse.json();
      if (!sigResponse.ok) throw new Error(sigData.error || 'Signature failed');

      // Store reward amount in localStorage
      if (sigData.amount && sigData.amount > 0) {
        addRewardToStorage(sigData.amount);
      }

      // 3. Contract Call
      const txHash = await incrementCounter({
        fid,
        username,
        imageUrl,
        rewardToken: sigData.tokenAddress,
        rewardAmount: BigInt(sigData.amountInWei),
        signature: sigData.signature,
      });

      if (!txHash) throw new Error('Transaction failed');

      // 4. Wait & Refresh
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }
      
      refetch();
      
      // 5. Update leaderboard
      try {
        await fetch('/api/counter/update-leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fid,
            username,
            imageUrl,
            userAddress: address,
            totalIncrements: userIncrementCount + 1, // New count after increment
            totalRewards: getTotalRewards() + (sigData.amount || 0), // Total rewards including new one
          }),
        });
      } catch (err) {
        console.error('Failed to update leaderboard:', err);
        // Don't block on leaderboard update failure
      }
      
      setToast({ type: 'success', message: 'Incremented! +1' });
      setTimeout(() => setToast(null), 3000);
      
      // Show share button after successful increment
      setShowShareButton(true);
      
      // IMPORTANT: Set isProcessing to false BEFORE triggering increment flag
      setIsProcessing(false);
      
      // Mark that user has incremented this session (triggers auto-share)
      // This must be AFTER setIsProcessing(false) to ensure the useEffect condition is met
      console.log('✅ Increment successful, setting hasIncrementedThisSession = true');
      setTimeout(() => {
        setHasIncrementedThisSession(true);
      }, 100); // Small delay to ensure state is updated

    } catch (err: any) {
      console.error(err);
      const msg = err.message?.includes('rejected') ? 'Cancelled' : 'Failed to increment';
      setToast({ type: 'error', message: msg });
      setTimeout(() => setToast(null), 3000);
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    if (!context?.user || !actions?.composeCast) return;
    
    setIsSharing(true);
    try {
      const username = context.user.username || `User ${context.user.fid}`;
      const pfpUrl = context.user.pfpUrl || '';
      
      // 1. Capture share image
      const imageBlob = await captureCounterShareImage(
        totalCounter,
        username,
        userIncrementCount,
        pfpUrl,
        totalRewards
      );

      // 2. Upload to IPFS
      const formData = new FormData();
      formData.append('file', imageBlob, `counter-share-${Date.now()}.png`);

      const uploadResponse = await fetch('/api/ipfs/upload-image', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.success || !uploadResult.ipfsUrl) {
        throw new Error('Failed to upload image to IPFS');
      }

      const params = new URLSearchParams({ imageUrl: uploadResult.ipfsUrl || '' })
      const composedShareUrl = `${window.location.origin}?${params.toString()}`

      // 3. Share to Farcaster
      const websiteUrl = typeof window !== 'undefined' ? window.location.origin : '';
      let shareText = `I incremented Base Counter to ${totalCounter?.toString() || '0'}🎉! I am based now 🟦`;
      
     
    
      
      await actions.composeCast({
        text: shareText,
        embeds: [composedShareUrl],
      });

      setToast({ type: 'success', message: 'Shared to Farcaster! 🎉' });
      setTimeout(() => setToast(null), 3000);
      setShowShareButton(false);
      
    } catch (error) {
      console.error('Share error:', error);
      setToast({ type: 'error', message: 'Failed to share' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSharing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex w-screen flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
           <FontAwesomeIcon icon={faBolt} className="text-gray-400 text-2xl" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Connect Wallet</h2>
        <p className="text-gray-500 max-w-xs">Connect your wallet to start incrementing the Base counter.</p>
        
        <motion.button
          onClick={() => connect({ connector: miniAppConnector() })}
          disabled={isConnecting}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            mt-4 px-6 py-3 rounded-full shadow-lg font-bold text-sm
            flex items-center gap-2
            bg-gradient-to-r from-blue-500 to-purple-600 text-white
            hover:from-blue-600 hover:to-purple-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          `}
        >
          <FontAwesomeIcon icon={faWallet} className={isConnecting ? "animate-spin" : ""} />
          <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
        </motion.button>
      </div>
    );
  }

  return (
    <div className="relative w-screen min-h-screen bg-white text-gray-900 overflow-hidden font-sans">
      <Particles />
      
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className={`
              fixed top-0 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl font-bold text-sm
              flex items-center gap-2 backdrop-blur-md
              ${toast.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}
            `}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full h-screen flex flex-col overflow-hidden">
        
        {/* Leaderboard Button - Top Right */}
        <button
          onClick={() => setIsLeaderboardOpen(true)}
          className="fixed top-4 right-4 z-30 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-110"
          title="View Leaderboard"
        >
          <FontAwesomeIcon icon={faRankingStar} className="text-white text-xl" />
        </button>

        {/* Leaderboard Modal */}
        <Leaderboard isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
        
        {/* Full Width Header - Global Counter */}
        <header className="flex-none w-full p-4 md:p-6 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-5 md:p-6 shadow-2xl text-center text-white relative overflow-hidden w-full max-w-7xl mx-auto">
             {/* Glow effect */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-white/10 blur-xl rounded-full" />
             
             <div className="relative z-10">
               <div className="text-gray-300 text-xs md:text-sm font-bold uppercase tracking-widest mb-2">
                 Base Counter
               </div>
               <div className="text-5xl md:text-7xl font-black tracking-tighter tabular-nums drop-shadow-lg mb-4">
                 <motion.span
                   key={animatedCounter?.toString()}
                   initial={{ scale: 1.2, opacity: 0.5 }}
                   animate={{ scale: 1, opacity: 1 }}
                   transition={{ duration: 0.2, ease: "easeOut" }}
                   className="inline-block"
                 >
                   {animatedCounter ? animatedCounter.toString() : '---'}
                 </motion.span>
               </div>
               
               <div className="flex justify-center gap-6 md:gap-8">
                 <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-400 mb-1">Your Clicks</span>
                    <span className="font-bold text-lg md:text-xl flex items-center gap-2">
                      <FontAwesomeIcon icon={faTrophy} className="text-yellow-400" />
                      {userIncrementCount}
                    </span>
                 </div>
                 <div className="w-px bg-gray-600 h-10 self-center" />
                 <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-400 mb-1">Rewards</span>
                    <span className="font-bold text-lg md:text-xl flex items-center gap-2">
                      <FontAwesomeIcon icon={faCoins} className="text-yellow-300" />
                      {totalRewards.toFixed(4)} $USDC
                    </span>
                 </div>
               </div>
             </div>
          </div>
        </header>

        {/* Feed & Lever Side by Side */}
        <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
          
          {/* Left Side: Feed Area */}
          <main className="flex-1 min-h-0 relative w-full overflow-hidden">
             {/* Fade gradients */}
             <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
             <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
             
             <div className="h-full overflow-y-auto no-scrollbar pb-4 pt-4 px-4 md:px-6">
               <IncrementFeed />
             </div>
          </main>

          {/* Right Side: Lever Interaction */}
          <div className="flex-none w-20 md:w-72 h-full border-l border-gray-200 bg-gradient-to-b from-white to-gray-50/50 backdrop-blur-sm z-30 flex flex-col justify-center items-center shadow-lg relative">
             <div className="scale-70 md:scale-110 transform origin-center">
               <PullLever 
                 onPull={handlePull} 
                 isLoading={isProcessing} 
                 disabled={!isConnected}
               />
             </div>

             {/* Share Button - appears after successful increment */}
             <AnimatePresence>
               {showShareButton && (
                 <motion.button
                   initial={{ opacity: 0, scale: 0.8, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.8, y: 20 }}
                   onClick={handleShare}
                   disabled={isSharing}
                   className={`
                     absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2
                     px-4 py-2.5 rounded-full shadow-lg font-bold text-sm
                     flex items-center gap-2
                     bg-gradient-to-r from-blue-500 to-purple-600 text-white
                     hover:from-blue-600 hover:to-purple-700
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 z-40
                   `}
                 >
                   <FontAwesomeIcon icon={faShareNodes} className={isSharing ? "animate-spin" : ""} />
                   <span>{isSharing ? 'Sharing...' : 'Share to Farcaster'}</span>
                 </motion.button>
               )}
             </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
}
