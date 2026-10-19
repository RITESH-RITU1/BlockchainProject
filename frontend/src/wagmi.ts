import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrumSepolia } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';

export const config = getDefaultConfig({
  appName: 'ClearEscrow',
  projectId: 'YOUR_PROJECT_ID', // Replaced in production
  chains: [arbitrumSepolia],
  ssr: true,
});
