'use client'


import { CounterMiniApp } from '@/components/Counter/CounterMiniApp'
import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useFrame } from '@/components/farcaster-provider'

export function Demo() {
  const { isConnected } = useAccount()
  const { actions } = useFrame()
useEffect(()=>{
  if(isConnected){
    actions?.addFrame()
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
},[isConnected])

  return (
      <div className="space-y-8">
        <CounterMiniApp />
        {/* <RootsOfYou /> */}
    </div>
  )
}
