"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Wallet, UserCheck, Briefcase, BarChart2, Home } from "lucide-react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { useEffect, useState } from "react";

const ARBITRUM_HEX = "0x66eee";

const navItems = [
  { href: "/",           label: "Home",        icon: Home },
  { href: "/client",     label: "Client",      icon: UserCheck },
  { href: "/freelancer", label: "Freelancer",  icon: Briefcase },
  { href: "/compare",    label: "Compare",     icon: BarChart2 },
];

export default function Navigation() {
  const pathname = usePathname();
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleConnect = async () => {
    if (isConnected) {
      chainId !== arbitrumSepolia.id ? switchChain({ chainId: arbitrumSepolia.id }) : disconnect();
      return;
    }
    // Try wagmi connector first
    if (connectors[0]) { try { connect({ connector: connectors[0] }); return; } catch {} }
    // Direct window.ethereum fallback
    const eth = (window as any).ethereum;
    if (!eth) { window.open("https://metamask.io/download/", "_blank"); return; }
    await eth.request({ method: "eth_requestAccounts" });
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARBITRUM_HEX }] })
      .catch(async (e: any) => {
        if (e.code === 4902) await eth.request({
          method: "wallet_addEthereumChain",
          params: [{ chainId: ARBITRUM_HEX, chainName: "Arbitrum Sepolia",
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
            blockExplorerUrls: ["https://sepolia.arbiscan.io"] }],
        });
      });
  };

  const btnLabel = !mounted || !isConnected
    ? "Connect MetaMask"
    : chainId !== arbitrumSepolia.id
    ? "Switch Network"
    : `${address?.slice(0, 6)}…${address?.slice(-4)}`;

  return (
    <nav className="bg-stone-900/90 border-b border-stone-800 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <div className="bg-amber-500 p-2 rounded-lg">
            <Shield className="h-5 w-5 text-stone-900" />
          </div>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? href === "/client"     ? "bg-amber-600 text-stone-900"
                    : href === "/freelancer" ? "bg-orange-600 text-stone-100"
                    : href === "/compare"    ? "bg-emerald-700 text-stone-100"
                    : "bg-stone-700 text-stone-100"
                    : "text-stone-400 hover:text-stone-100 hover:bg-stone-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}

          <button
            onClick={handleConnect}
            className="ml-2 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-900 font-bold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">{btnLabel}</span>
            <span className="sm:hidden">{!mounted || !isConnected ? "🦊" : "✓"}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
