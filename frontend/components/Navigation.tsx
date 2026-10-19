"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Wallet,
  UserCheck,
  Briefcase,
  BarChart2,
  Home,
  Bell,
  Check,
  Sparkles,
} from "lucide-react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { useEffect, useState, useRef } from "react";

const ARBITRUM_HEX = "0x66eee";

const navItems = [
  { href: "/",           label: "Home",        icon: Home },
  { href: "/jobs",       label: "Marketplace", icon: Sparkles },
  { href: "/client",     label: "Client",      icon: UserCheck },
  { href: "/freelancer", label: "Freelancer",  icon: Briefcase },
  { href: "/compare",    label: "Compare",     icon: BarChart2 },
];

interface NotificationItem {
  id: number;
  recipient_address: string;
  title: string;
  message: string;
  link: string;
  type: string;
  is_read: number;
  created_at: number;
}

export default function Navigation() {
  const pathname = usePathname();
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [mounted, setMounted] = useState(false);

  // In-App Notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Fetch notifications on address change or interval
  useEffect(() => {
    if (!address) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/notifications?address=${address.toLowerCase()}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        // Silently handle transient network issues
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [address]);

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setPanelOpen(false);
      }
    }
    if (panelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [panelOpen]);

  const handleMarkAllRead = async () => {
    if (!address) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.toLowerCase() }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {}
  };

  const handleConnect = async () => {
    if (isConnected) {
      if (chainId !== arbitrumSepolia.id) {
        switchChain({ chainId: arbitrumSepolia.id });
      } else {
        disconnect();
      }
      return;
    }
    if (connectors[0]) {
      try {
        connect({ connector: connectors[0] });
        return;
      } catch {}
    }
    const eth = (window as any).ethereum;
    if (!eth) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    await eth.request({ method: "eth_requestAccounts" });
    await eth
      .request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARBITRUM_HEX }] })
      .catch(async (e: any) => {
        if (e.code === 4902) {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: ARBITRUM_HEX,
                chainName: "Arbitrum Sepolia",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
                blockExplorerUrls: ["https://sepolia.arbiscan.io"],
              },
            ],
          });
        }
      });
  };

  const btnLabel = !mounted || !isConnected
    ? "Connect MetaMask"
    : chainId !== arbitrumSepolia.id
    ? "Switch Network"
    : `${address?.slice(0, 6)}…${address?.slice(-4)}`;

  return (
    <nav className="bg-stone-900/95 border-b border-stone-800 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center h-14">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="bg-amber-500 p-2 rounded-lg group-hover:bg-amber-400 transition-colors">
            <Shield className="h-5 w-5 text-stone-900" />
          </div>
          <span className="font-bold text-stone-100 tracking-tight text-base hidden md:inline">
            Clear<span className="text-amber-500">Escrow</span>
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? href === "/client"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : href === "/freelancer"
                      ? "bg-orange-600/20 text-orange-400 border border-orange-600/40"
                      : href === "/jobs"
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      : href === "/compare"
                      ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/40"
                      : "bg-stone-800 text-stone-100 border border-stone-700"
                    : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60 border border-transparent"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}

          {/* In-App Notification Bell */}
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className="relative p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors border border-transparent hover:border-stone-700"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-stone-950">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {panelOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 bg-stone-800/80 border-b border-stone-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-sm text-stone-100">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-stone-400 hover:text-amber-400 transition-colors flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-stone-800">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-stone-500 text-xs">
                      No notifications yet. You will be alerted when new jobs are posted or applications update.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.link}
                        onClick={() => setPanelOpen(false)}
                        className={`block p-3.5 transition-colors hover:bg-stone-800/60 ${
                          !n.is_read ? "bg-amber-950/20 border-l-2 border-l-amber-500" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-stone-200">{n.title}</p>
                          <span className="text-[10px] text-stone-500 whitespace-nowrap">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Wallet Connect Pill */}
          <button
            onClick={handleConnect}
            className={`ml-1 flex items-center gap-2 font-bold py-1.5 px-3.5 rounded-lg transition-all text-xs sm:text-sm ${
              !mounted || !isConnected
                ? "bg-amber-500 hover:bg-amber-600 text-stone-900 shadow-sm"
                : chainId !== arbitrumSepolia.id
                ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                : "bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200"
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{btnLabel}</span>
            <span className="sm:hidden">{!mounted || !isConnected ? "Connect" : "✓"}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
