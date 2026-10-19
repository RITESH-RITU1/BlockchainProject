import './globals.css';
import { Providers } from './providers';
import { SavingsBanner } from '../components/SavingsBanner';

export const metadata = {
  title: 'ClearEscrow',
  description: 'Decentralized Escrow Demo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-stone-900 text-stone-200">
        <Providers>
          <SavingsBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
