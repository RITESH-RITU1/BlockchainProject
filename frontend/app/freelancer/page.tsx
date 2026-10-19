"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { ESCROW_ABI, ESCROW_CONTRACT_ADDRESS } from "@/config/contract";
import { formatEther } from "viem";
import {
  Send, DollarSign, Clock, Shield, Loader2,
  AlertCircle, CheckCircle, Search, Zap
} from "lucide-react";

function CountdownTimer({ deadline }: { deadline: number }) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    const update = () => setTimeLeft(Math.max(0, deadline - Math.floor(Date.now() / 1000)));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [deadline]);

  if (timeLeft === 0) return <span className="text-red-400 font-semibold">⚠ Deadline passed — auto-release available</span>;
  const d = Math.floor(timeLeft / 86400);
  const h = Math.floor((timeLeft % 86400) / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  return (
    <span className="font-mono text-amber-400">
      {d > 0 ? `${d}d ` : ""}{String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}
    </span>
  );
}

function MilestoneView({ milestoneId }: { milestoneId: bigint }) {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const { data, refetch, isLoading } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "milestones",
    args: [milestoneId],
  });

  if (isLoading) return <div className="text-stone-400 text-sm p-6">Loading milestone…</div>;
  if (!data) return <div className="text-red-400 text-sm p-6">Milestone not found.</div>;

  const [client, freelancer, amount, state, deadline, description] = data;
  const isFreelancer = address?.toLowerCase() === freelancer.toLowerCase();
  const stateLabel = ["Uninitialized","🔒 Locked","📋 Work Submitted","✅ Completed"][state] ?? "Unknown";
  const isLocked = state === 1;
  const isSubmitted = state === 2;
  const deadlinePassed = Math.floor(Date.now() / 1000) > Number(deadline);

  const submit = () => writeContract({
    address: ESCROW_CONTRACT_ADDRESS as `0x${string}`, abi: ESCROW_ABI,
    functionName: "submitWork", args: [milestoneId], maxFeePerGas: 1000000000n, maxPriorityFeePerGas: 100000000n,
  }, { onSuccess: () => refetch() });

  const autoRelease = () => writeContract({
    address: ESCROW_CONTRACT_ADDRESS as `0x${string}`, abi: ESCROW_ABI,
    functionName: "claimDefaultPayout", args: [milestoneId], maxFeePerGas: 1000000000n, maxPriorityFeePerGas: 100000000n,
  }, { onSuccess: () => refetch() });

  return (
    <div className="bg-stone-800/60 border border-orange-900/40 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-orange-950/60 border-b border-orange-900/40 px-6 py-4 flex justify-between items-start">
        <div>
          <p className="text-xs text-orange-500 uppercase tracking-wider font-semibold">Milestone #{milestoneId.toString()}</p>
          <p className="text-lg font-semibold text-stone-100 mt-0.5">{description}</p>
        </div>
        <span className="text-xs bg-stone-700 text-stone-300 px-3 py-1 rounded-full">{stateLabel}</span>
      </div>

      {/* Details */}
      <div className="px-6 py-5 grid grid-cols-2 gap-4 border-b border-stone-700">
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-wider">Your Payout</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{formatEther(amount)} ETH</p>
          <p className="text-xs text-emerald-600 mt-0.5">100% — no platform cut</p>
        </div>
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-wider">Auto-Release Countdown</p>
          <p className="text-sm mt-1"><CountdownTimer deadline={Number(deadline)} /></p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-stone-500 uppercase tracking-wider">Client</p>
          <p className="font-mono text-xs text-stone-400 mt-1">{client}</p>
        </div>
      </div>

      {/* Actions */}
      {!address && (
        <div className="px-6 py-4 text-stone-500 text-sm">Connect wallet to take actions.</div>
      )}
      {address && !isFreelancer && (
        <div className="px-6 py-4 text-stone-500 text-sm">
          Your connected wallet is not the freelancer for this milestone.
        </div>
      )}
      {isFreelancer && (
        <div className="px-6 py-5 space-y-3">
          <button
            onClick={submit}
            disabled={!isLocked || isPending}
            className="btn-freelancer w-full flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit Work
          </button>
          <p className="text-xs text-stone-500">Only available while milestone is Locked.</p>

          <button
            onClick={autoRelease}
            disabled={!(isSubmitted && deadlinePassed) || isPending}
            className="btn-success w-full flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Claim Auto-Release
          </button>
          <p className="text-xs text-stone-500">Available only after Work Submitted + deadline has passed.</p>
        </div>
      )}
      {state === 3 && (
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="h-4 w-4" /> This milestone is completed. Funds have been paid.
          </div>
        </div>
      )}
    </div>
  );
}

export default function FreelancerPage() {
  const [inputId, setInputId] = useState("");
  const [activeId, setActiveId] = useState<bigint | null>(null);
  const [error, setError] = useState("");

  const lookup = () => {
    const n = parseInt(inputId);
    if (!inputId || isNaN(n) || n < 1) { setError("Enter a valid milestone ID (e.g. 1)"); return; }
    setError("");
    setActiveId(BigInt(n));
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200">
      {/* Page header */}
      <div className="bg-orange-950/50 border-b border-orange-900/40 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <p className="text-orange-500 text-sm font-semibold uppercase tracking-widest mb-2">Freelancer Portal</p>
          <h1 className="text-4xl font-bold text-stone-100 mb-3">Deliver Work. Get Paid.</h1>
          <p className="text-stone-400 max-w-xl">
            Enter the Milestone ID your client shared with you. View locked funds, submit your
            work on-chain, and collect 100% of the payment — with ghosting protection built in.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 grid md:grid-cols-5 gap-8">

        {/* ── LEFT: How it works ── */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold text-orange-400">How it works</h2>
          {[
            { icon: Search,      title: "Enter your Milestone ID",    body: "Your client creates a milestone and shares the ID with you. Paste it here." },
            { icon: DollarSign,  title: "See your locked payout",     body: "The ETH is already locked in the contract. You can verify the amount and deadline before starting." },
            { icon: Send,        title: "Submit work on-chain",       body: "When your deliverable is ready, press Submit Work. This records your submission on Arbitrum permanently." },
            { icon: Shield,      title: "Auto-release protection",    body: "If the client doesn't approve within the deadline, you can trigger Claim Auto-Release for 100% of the funds." },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex gap-3">
                <div className="mt-0.5 flex-shrink-0 bg-orange-600/10 border border-orange-600/20 p-2 rounded-lg h-fit">
                  <Icon className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-stone-200 text-sm">{s.title}</p>
                  <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">{s.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── RIGHT: Lookup + actions ── */}
        <div className="md:col-span-3 space-y-5">
          <div className="bg-stone-800/60 border border-orange-900/40 rounded-2xl overflow-hidden">
            <div className="bg-orange-950/60 border-b border-orange-900/40 px-6 py-4">
              <h2 className="font-semibold text-orange-400">Look Up Your Milestone</h2>
              <p className="text-xs text-stone-500 mt-0.5">Enter the ID your client shared with you</p>
            </div>
            <div className="p-6">
              <div className="flex gap-3">
                <input
                  type="number" value={inputId}
                  onChange={(e) => setInputId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && lookup()}
                  placeholder="e.g.  1"
                  className="input flex-1 font-mono"
                  min="1"
                />
                <button onClick={lookup} className="btn-freelancer px-6 flex items-center gap-2">
                  <Search className="h-4 w-4" /> View
                </button>
              </div>
              {error && (
                <div className="flex items-center gap-2 mt-3 text-red-300 text-sm">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}
            </div>
          </div>

          {activeId !== null && <MilestoneView milestoneId={activeId} />}
        </div>
      </div>
    </div>
  );
}
