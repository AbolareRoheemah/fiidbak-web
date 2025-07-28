import '@rainbow-me/rainbowkit/styles.css';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { baseSepolia, base, basecampTestnet } from 'wagmi/chains';
import {
  metaMaskWallet,
  // coinbaseWallet,
  rabbyWallet,
  trustWallet,
  phantomWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        // coinbaseWallet,
        rabbyWallet,
      ],
    },
    {
      groupName: 'Other',
      wallets: [
        trustWallet,
        phantomWallet,
        rainbowWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: 'ProductFeed',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  }
);

export const config = createConfig({
  connectors,
  chains: [basecampTestnet, baseSepolia, base],
  transports: {
    [basecampTestnet.id]: http('https://rpc.basecamp.t.raas.gelato.cloud/'),
    [baseSepolia.id]: http('https://base-sepolia.g.alchemy.com/v2/4FF6xgfo305aOiFhplzY7M6AaWWZMmg_'),
    [base.id]: http(),
  },
});