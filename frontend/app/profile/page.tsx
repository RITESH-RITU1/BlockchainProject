"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { ESCROW_ABI, ESCROW_CONTRACT_ADDRESS } from "@/config/contract";
import { formatEther } from "viem";
import { User, Briefcase, DollarSign, ArrowRight, Plus } from "lucide-react";

export default function Profile() {
  const { address } = useAccount();
  const [milestoneId, setMilestoneId] = useState("1");

  // Read the total milestone count
  const { data: count } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "milestoneCounter",
  });

  const totalCount = count ? Number(count) : 0;

  if (!address) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p className="text-stone-300 text-lg mb-2">Connect your wallet to view your dashboard</p>
          <p className="text-stone-500 text-sm">Click "Connect MetaMask" in the top navigation bar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-amber-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-8 w-8 text-stone-900" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-amber-500 mb-4">My Dashboard</h1>
          <p className="text-stone-400 max-w-2xl mx-auto">
            Connected: <span className="text-amber-400 font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="card p-6 border border-stone-800 bg-stone-800/50 rounded-lg flex items-center space-x-4">
            <div className="bg-amber-500/10 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-stone-400">Total On-Chain Milestones</p>
              <p className="text-2xl font-bold text-stone-100">{totalCount}</p>
            </div>
          </div>
          <div className="card p-6 border border-stone-800 bg-stone-800/50 rounded-lg flex items-center space-x-4">
            <div className="bg-orange-600/10 p-3 rounded-lg">
              <Briefcase className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-stone-400">Platform Fee</p>
              <p className="text-2xl font-bold text-emerald-400">0%</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6 mb-12 border border-stone-800 bg-stone-800/50 rounded-lg">
          <h3 className="text-lg font-semibold text-amber-500 mb-4">Quick Actions</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/escrow" className="btn-client flex items-center justify-center flex-1">
              <Plus className="mr-2 h-5 w-5" />
              Create New Milestone
            </Link>
          </div>
        </div>

        {/* Lookup Milestone by ID */}
        <div className="card p-6 border border-stone-800 bg-stone-800/50 rounded-lg">
          <h3 className="text-lg font-semibold text-amber-500 mb-4">Look Up a Milestone</h3>
          <p className="text-stone-400 text-sm mb-4">
            Enter a milestone ID to view its details and take actions.
            There are <strong className="text-stone-200">{totalCount}</strong> milestone(s) on-chain.
          </p>
          <div className="flex gap-3">
            <input
              type="number"
              value={milestoneId}
              onChange={(e) => setMilestoneId(e.target.value)}
              min="1"
              max={totalCount || 1}
              className="input flex-1"
              placeholder="Milestone ID"
            />
            <Link
              href={`/escrow/${milestoneId}`}
              className="btn-freelancer flex items-center px-6"
            >
              View
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
