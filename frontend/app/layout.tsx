import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { Web3Provider } from "@/components/Web3Provider";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { config } from "@/config/wagmi";

export const metadata: Metadata = {
  title: "Decentralized Escrow",
  description: "0% fee freelance escrow on Arbitrum Sepolia. Ghosting protection included.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookie = (await headers()).get("cookie");

  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <Web3Provider cookie={cookie}>
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}
