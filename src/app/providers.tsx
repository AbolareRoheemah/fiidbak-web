'use client';
import '@rainbow-me/rainbowkit/styles.css';
// import { lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { CampProvider } from "@campnetwork/origin/react";
import { config } from './wagmi';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
      <CampProvider clientId={process.env.NEXT_PUBLIC_ORIGIN_CLIENT_ID || ""}>
        {/* <RainbowKitProvider theme={lightTheme({
            accentColor: 'linear-gradient(90deg, #2563eb 0%, #9333ea 100%)',
            accentColorForeground: 'white',
            borderRadius: 'small',
            fontStack: 'system',
          })}> */}
          {children}
        {/* </RainbowKitProvider> */}
        </CampProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}