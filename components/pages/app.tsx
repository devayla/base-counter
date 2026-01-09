'use client'

import { Demo } from '@/components/Home'
import { useFrame } from '@/components/farcaster-provider'
import { SafeAreaContainer } from '@/components/safe-area-container'
import { motion } from 'framer-motion'

export default function Home() {
  const { context, isLoading, isSDKLoaded } = useFrame()
  const { actions } = useFrame()
  if (isLoading) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="relative w-full h-screen bg-white overflow-hidden flex items-center justify-center">
          {/* Floating Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-gradient-to-tr from-blue-100 to-purple-100 opacity-40"
                initial={{
                  x: Math.random() * 100 + "%",
                  y: Math.random() * 100 + "%",
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  y: [null, Math.random() * 100 + "%"],
                  x: [null, Math.random() * 100 + "%"],
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

          {/* Main Loader Content */}
          <div className="relative z-20 flex flex-col items-center justify-center space-y-8 p-8">
            {/* Animated Counter Display */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              {/* Gradient Background Circle */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-30"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Counter Box */}
              <motion.div 
                className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-12 shadow-2xl"
                animate={{
                  boxShadow: [
                    "0 20px 60px rgba(0,0,0,0.3)",
                    "0 20px 80px rgba(59,130,246,0.4)",
                    "0 20px 60px rgba(0,0,0,0.3)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* Animated Numbers */}
                <motion.div className="text-center">
                  {[0, 1, 2, 3, 4, 5].map((num, i) => (
                    <motion.span
                      key={i}
                      className="inline-block text-6xl md:text-8xl font-black text-white tabular-nums"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        y: [20, 0, 0, -20],
                      }}
                      transition={{
                        duration: 0.6,
                        delay: i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 1.8,
                        ease: "easeInOut",
                      }}
                    >
                      {num}
                    </motion.span>
                  ))}
                </motion.div>

                {/* Plus Icon Animation */}
                <motion.div
                  className="absolute -right-4 -top-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                  animate={{
                    rotate: [0, 90, 180, 270, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <span className="text-white text-3xl font-bold">+</span>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* App Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 drop-shadow-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Base Counter
              </h1>
              <p className="text-lg text-gray-600 font-semibold">
                Loading your counter...
              </p>
            </motion.div>

            {/* Loading Progress Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            {/* Loading Dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="flex space-x-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </SafeAreaContainer>
    )
  }

  if (!isSDKLoaded) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
          <h1 className="text-3xl font-bold text-center">
            No farcaster SDK found, please use this miniapp in the farcaster app
          </h1>
          <button onClick={()=>{
           window.open('https://farcaster.xyz/~/mini-apps/launch?domain=base-counter-one.vercel.app', '_blank')
          }}>Open in Farcaster</button>
        </div>
      </SafeAreaContainer>
    )
  }

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      <Demo />
    </SafeAreaContainer>
  )
}
