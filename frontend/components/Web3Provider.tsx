'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, cookieToInitialState } from 'wagmi'
import { config } from '@/config/wagmi'
import { useState, type ReactNode } from 'react'

export function Web3Provider({
  children,
  cookie,
}: {
  children: ReactNode
  cookie?: string | null
}) {
  const [queryClient] = useState(() => new QueryClient())
  const initialState = cookieToInitialState(config, cookie)

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
