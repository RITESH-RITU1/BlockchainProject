"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther, isAddress } from "viem";
import { ESCROW_ABI, ESCROW_CONTRACT_ADDRESS } from "@/config/contract";
import {
  Lock, CheckCircle, Shield, ArrowRight, Loader2,
  AlertCircle, DollarSign, Clock, Info
} from "lucide-react";
import { arbitrumSepolia } from "wagmi/chains";

export default function ClientPage() {
  const { address, chainId } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  const [freelancer, setFreelancer] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [durationDays, setDurationDays] = useState("7");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!freelancer || !amount || !description) {
      setStatus("error"); setErrorMessage("Please fill in all fields."); return;
    }
    if (!isAddress(freelancer)) {
      setStatus("error"); setErrorMessage("Freelancer address is not a valid Ethereum address."); return;
    }
    if (chainId !== arbitrumSepolia.id) {
      setStatus("error"); setErrorMessage("Switch your wallet to Arbitrum Sepolia first."); return;
    }

    writeContract(
      {
        address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "createMilestone",
        args: [freelancer as `0x${string}`, BigInt(parseInt(durationDays) * 86400), description],
        value: parseEther(amount),
        maxFeePerGas: 1000000000n, // 1 gwei
        maxPriorityFeePerGas: 100000000n, // 0.1 gwei
      },
      {
        onSuccess: (hash) => {
          setStatus("success");
          setFreelancer(""); setAmount(""); setDescription("");
        },
        onError: (err) => {
          setStatus("error");
          setErrorMessage(err.message?.slice(0, 180) ?? "Transaction failed.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200">
      {/* Page header */}
      <div className="bg-amber-950/50 border-b border-amber-900/40 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <p className="text-amber-500 text-sm font-semibold uppercase tracking-widest mb-2">Client Portal</p>
          <h1 className="text-4xl font-bold text-stone-100 mb-3">Fund a Milestone</h1>
          <p className="text-stone-400 max-w-xl">
            Lock ETH into the smart contract for a specific deliverable. Your freelancer gets paid
            only after you approve — or automatically after the deadline if you don&apos;t respond.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 grid md:grid-cols-5 gap-8">

        {/* ── LEFT: How it works ── */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold text-amber-400">How it works</h2>
          {[
            { icon: Lock,         title: "You lock the funds",        body: "ETH is sent to the smart contract, not to the freelancer. Only you control release." },
            { icon: CheckCircle,  title: "Freelancer submits work",   body: "They press Submit Work on-chain when done. You get notified via the milestone page." },
            { icon: DollarSign,   title: "You approve → instant pay", body: "One click releases 100% of the ETH straight to the freelancer. Zero platform cut." },
            { icon: Clock,        title: "Missed deadline?",          body: "If you don't act within the deadline, the freelancer auto-claims — no dispute needed." },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex gap-3">
                <div className="mt-0.5 flex-shrink-0 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg h-fit">
                  <Icon className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-stone-200 text-sm">{s.title}</p>
                  <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">{s.body}</p>
                </div>
              </div>
            );
          })}

          <div className="bg-stone-800 border border-stone-700 rounded-xl p-4 text-xs text-stone-400 leading-relaxed">
            <p className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
              <Info className="h-3.5 w-3.5" /> Share the Milestone ID with your freelancer
            </p>
            After creating, go to <strong className="text-stone-300">/profile</strong> to find the ID
            and share it so the freelancer can view and submit work.
          </div>
        </div>

        {/* ── RIGHT: Form ── */}
        <div className="md:col-span-3">
          <div className="bg-stone-800/60 border border-amber-900/40 rounded-2xl overflow-hidden">
            <div className="bg-amber-950/60 border-b border-amber-900/40 px-6 py-4">
              <h2 className="font-semibold text-amber-400">New Milestone</h2>
              <p className="text-xs text-stone-500 mt-0.5">All fields required</p>
            </div>
            <div className="p-6 space-y-5">

              <div>
                <label className="label block mb-1.5 text-xs uppercase tracking-wider">
                  Freelancer Wallet Address
                </label>
                <input
                  type="text" value={freelancer}
                  onChange={(e) => setFreelancer(e.target.value)}
                  placeholder="0x..."
                  className="input w-full font-mono text-sm"
                />
              </div>

              <div>
                <label className="label block mb-1.5 text-xs uppercase tracking-wider">
                  Milestone Description
                </label>
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Design a landing page with 3 sections and mobile responsive layout…"
                  rows={4} className="input w-full resize-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label block mb-1.5 text-xs uppercase tracking-wider">
                    Amount (ETH)
                  </label>
                  <input
                    type="number" value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.05" step="0.001" min="0"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label block mb-1.5 text-xs uppercase tracking-wider">
                    Deadline (days)
                  </label>
                  <input
                    type="number" value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    placeholder="7" min="1"
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Status */}
              {status === "success" && (
                <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800 text-emerald-400 p-3 rounded-lg text-sm">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  Milestone created! Share the ID from your <Link href="/profile" className="underline">Profile</Link> with your freelancer.
                </div>
              )}
              {status === "error" && (
                <div className="flex items-start gap-2 bg-red-950/40 border border-red-900 text-red-300 p-3 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {!address && (
                <div className="bg-stone-700/40 border border-stone-600 text-stone-400 p-3 rounded-lg text-sm">
                  Connect MetaMask (top-right) to continue.
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={isPending || !address}
                className="btn-client w-full h-12 text-base font-bold flex items-center justify-center gap-2"
              >
                {isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                  : <><Lock className="h-4 w-4" /> Lock Funds in Escrow</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
