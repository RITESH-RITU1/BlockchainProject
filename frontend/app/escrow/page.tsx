"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther, isAddress } from "viem";
import { ESCROW_ABI, ESCROW_CONTRACT_ADDRESS } from "@/config/contract";
import { Plus, Loader2, CheckCircle, AlertCircle, ArrowRight, Fuel } from "lucide-react";
import { arbitrumSepolia } from "wagmi/chains";
import { useGasTracker } from "@/context/GasContext";

export default function EscrowPage() {
  const { address, chainId } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const { trackTransaction, openGasModal } = useGasTracker();

  const [freelancer, setFreelancer] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [durationDays, setDurationDays] = useState("7");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentTxDetails, setCurrentTxDetails] = useState<any>(null);

  const createMilestone = () => {
    if (!freelancer || !amount || !description) {
      setStatus("error");
      setErrorMessage("Please fill in all fields");
      return;
    }
    if (!isAddress(freelancer)) {
      setStatus("error");
      setErrorMessage("Please enter a valid Ethereum address");
      return;
    }
    if (chainId !== arbitrumSepolia.id) {
      setStatus("error");
      setErrorMessage("Please switch to Arbitrum Sepolia first");
      return;
    }

    const durationSeconds = BigInt(parseInt(durationDays) * 24 * 60 * 60);

    writeContract(
      {
        address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "createMilestone",
        args: [freelancer as `0x${string}`, durationSeconds, description],
        value: parseEther(amount),
      },
      {
        onSuccess: async (txHash) => {
          setStatus("success");
          setFreelancer("");
          setAmount("");
          setDescription("");
          if (txHash) {
            const details = await trackTransaction(txHash, "Fund Milestone Escrow");
            if (details) setCurrentTxDetails(details);
          }
        },
        onError: (err) => {
          setStatus("error");
          setErrorMessage(err.message ?? "Transaction failed");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-amber-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="h-8 w-8 text-stone-900" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-amber-500 mb-4">
            Create New Milestone
          </h1>
          <p className="text-lg text-stone-400 max-w-2xl mx-auto">
            Fund a milestone escrow. 0% fee — freelancer gets 100%. Protected from ghosting via auto-release after deadline.
          </p>
        </div>

        {/* Form Card */}
        <div className="card p-8 max-w-2xl mx-auto border border-stone-800 bg-stone-800/50 rounded-lg">
          {/* Panel Header */}
          <div className="panel-header-client mb-6 -mx-8 -mt-8 px-8 pt-8 pb-4 rounded-t-lg">
            <h2 className="text-lg font-semibold">Client Portal — Fund Milestone</h2>
          </div>
          <div className="space-y-6">
            {/* Freelancer Address */}
            <div>
              <label className="label block mb-2">Freelancer Wallet Address</label>
              <input
                type="text"
                value={freelancer}
                onChange={(e) => setFreelancer(e.target.value)}
                placeholder="0x..."
                className="input w-full"
              />
            </div>

            {/* Description */}
            <div>
              <label className="label block mb-2">Milestone Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the deliverable..."
                rows={3}
                className="input w-full resize-none"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="label block mb-2">Milestone Amount (ETH)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.01"
                step="0.001"
                min="0"
                className="input w-full"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="label block mb-2">Auto-Release Deadline (Days)</label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="7"
                min="1"
                className="input w-full"
              />
              <p className="text-xs text-stone-500 mt-1">
                If you don&apos;t approve submitted work within this period, the freelancer can auto-claim funds.
              </p>
            </div>

            {/* Status Messages */}
            {status === "success" && (
              <div className="flex items-center justify-between gap-2 text-emerald-400 bg-emerald-950/30 p-4 rounded-lg border border-emerald-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Milestone created successfully!</span>
                </div>
                {currentTxDetails && (
                  <button
                    type="button"
                    onClick={() => openGasModal(currentTxDetails)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
                  >
                    <Fuel className="h-3.5 w-3.5" />
                    View Gas Details
                  </button>
                )}
              </div>
            )}
            {status === "error" && (
              <div className="card-error flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium text-sm">{errorMessage}</span>
              </div>
            )}

            {!address && (
              <div className="card-error">
                Connect MetaMask (top-right) before creating a milestone.
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={createMilestone}
              disabled={isPending || !address}
              className="btn-client w-full h-12 text-lg font-semibold flex items-center justify-center"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Milestone...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Fund Milestone Escrow
                </>
              )}
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-stone-800/40 rounded-lg p-6 border border-stone-800">
            <h3 className="text-lg font-semibold text-amber-500 mb-4">How it works:</h3>
            <div className="space-y-3 text-sm text-stone-400">
              {[
                "Client funds a milestone — ETH locked in contract",
                "Freelancer submits work via their portal",
                "Client releases payment. If client ghosts → freelancer auto-claims after deadline",
              ].map((step, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="bg-amber-500 text-stone-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                    {i + 1}
                  </div>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
