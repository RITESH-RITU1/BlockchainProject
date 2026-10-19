"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { ESCROW_ABI, ESCROW_CONTRACT_ADDRESS } from "@/config/contract";
import { formatEther } from "viem";

export default function EscrowDetail() {
  const { id } = useParams();
  const milestoneId = BigInt(id as string);
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  const { data: milestoneData, refetch } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "milestones",
    args: [milestoneId],
  });

  const { data: arbitratorAddress } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "arbitrator",
  });

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (milestoneData) {
      const deadline = Number(milestoneData[4]);
      const updateTimer = () => {
        const now = Math.floor(Date.now() / 1000);
        setTimeLeft(Math.max(0, deadline - now));
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [milestoneData]);

  if (!milestoneData) {
    return <div className="p-8 text-stone-200">Loading Milestone...</div>;
  }

  const [client, freelancer, amount, state, deadline, description] = milestoneData;
  const isFreelancer = address?.toLowerCase() === freelancer.toLowerCase();
  const isClient = address?.toLowerCase() === client.toLowerCase();
  const isArbitrator = address?.toLowerCase() === (arbitratorAddress as string)?.toLowerCase();
  
  const isLocked = state === 1;
  const isWorkSubmitted = state === 2;
  const isDisputed = state === 3;
  const isCompleted = state === 4;
  const deadlinePassed = timeLeft === 0;

  const handleSubmitWork = () => {
    writeContract({
      address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "submitWork",
      args: [milestoneId],
      maxFeePerGas: 1000000000n, maxPriorityFeePerGas: 100000000n,
    }, { onSuccess: () => refetch() });
  };

  const handleReleasePayment = () => {
    writeContract({
      address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "releasePayment",
      args: [milestoneId],
      maxFeePerGas: 1000000000n, maxPriorityFeePerGas: 100000000n,
    }, { onSuccess: () => refetch() });
  };

  const handleRejectWork = () => {
    writeContract({
      address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "rejectWork",
      args: [milestoneId],
      maxFeePerGas: 1000000000n, maxPriorityFeePerGas: 100000000n,
    }, { onSuccess: () => refetch() });
  };

  const handleClaimAutoRelease = () => {
    writeContract({
      address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "claimDefaultPayout",
      args: [milestoneId],
      maxFeePerGas: 1000000000n, maxPriorityFeePerGas: 100000000n,
    }, { onSuccess: () => refetch() });
  };

  const handleResolveToFreelancer = () => {
    writeContract({
      address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "resolveDispute",
      args: [milestoneId, freelancer],
      maxFeePerGas: 1000000000n, maxPriorityFeePerGas: 100000000n,
    }, { onSuccess: () => refetch() });
  };

  const handleResolveToClient = () => {
    writeContract({
      address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "resolveDispute",
      args: [milestoneId, client],
      maxFeePerGas: 1000000000n, maxPriorityFeePerGas: 100000000n,
    }, { onSuccess: () => refetch() });
  };

  const getStateText = () => {
    if (state === 0) return "Uninitialized";
    if (state === 1) return "Locked";
    if (state === 2) return "Work Submitted";
    if (state === 3) return "Disputed (Needs Arbitration)";
    if (state === 4) return "Completed";
    return "Unknown";
  };

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto text-stone-200">
      <div className="card p-6 border border-stone-800 bg-stone-900/50">
        <h1 className="text-2xl font-bold text-amber-500 mb-4">Milestone #{id}</h1>
        <div className="mb-4">
          <p className="text-stone-300"><strong className="text-stone-400">Description:</strong> {description}</p>
          <p className="text-stone-300"><strong className="text-stone-400">Amount:</strong> {formatEther(amount)} ETH</p>
          <p className="text-stone-300"><strong className="text-stone-400">State:</strong> {getStateText()}</p>
          <p className="text-stone-300">
            <strong className="text-stone-400">Time Left:</strong> {timeLeft > 0 ? `${Math.floor(timeLeft / 86400)}d ${Math.floor((timeLeft % 86400) / 3600)}h` : "Deadline Passed"}
          </p>
        </div>

        <div className="flex flex-col gap-4 mt-6">
          {/* Client View */}
          {isClient && (
            <div className="w-full border border-amber-900/40 p-4 rounded-xl bg-amber-950/20">
              <div className="text-amber-500 mb-4 font-semibold uppercase tracking-wider text-sm">Client Actions</div>
              <div className="flex gap-3">
                <button
                  onClick={handleReleasePayment}
                  disabled={!isWorkSubmitted || isPending}
                  className="btn-success flex-1"
                >
                  Approve & Release Funds
                </button>
                <button
                  onClick={handleRejectWork}
                  disabled={!isWorkSubmitted || isPending}
                  className="bg-red-900/80 hover:bg-red-800 text-red-100 font-bold py-2 px-4 rounded-lg flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject & Raise Dispute
                </button>
              </div>
              <p className="text-xs text-stone-500 mt-2">
                Approving will send 100% of the funds to the freelancer. Rejecting will block the funds and require the arbitrator to resolve.
              </p>
            </div>
          )}

          {/* Freelancer View */}
          {isFreelancer && (
            <div className="w-full border border-orange-900/40 p-4 rounded-xl bg-orange-950/20">
              <div className="text-orange-500 mb-4 font-semibold uppercase tracking-wider text-sm">Freelancer Actions</div>
              <button
                onClick={handleSubmitWork}
                disabled={!isLocked || isPending}
                className="btn-freelancer w-full mb-4"
              >
                Submit Work
              </button>

              <button
                onClick={handleClaimAutoRelease}
                disabled={!(isWorkSubmitted && deadlinePassed) || isPending}
                className="btn-success w-full"
              >
                Claim Auto-Release (Ghosting Protection)
              </button>
            </div>
          )}

          {/* Arbitrator View */}
          {isArbitrator && isDisputed && (
            <div className="w-full border border-blue-900/40 p-4 rounded-xl bg-blue-950/20">
              <div className="text-blue-400 mb-4 font-semibold uppercase tracking-wider text-sm">Arbitrator Actions</div>
              <p className="text-sm text-stone-300 mb-4">
                This milestone is disputed. You can resolve the multi-sig protocol by routing the funds to either the Client (refund) or Freelancer (payout).
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleResolveToClient}
                  disabled={isPending}
                  className="bg-stone-700 hover:bg-stone-600 text-stone-100 font-bold py-2 px-4 rounded-lg flex-1"
                >
                  Refund Client
                </button>
                <button
                  onClick={handleResolveToFreelancer}
                  disabled={isPending}
                  className="btn-success flex-1"
                >
                  Pay Freelancer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
