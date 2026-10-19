'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ESCROW_ADDRESS, ESCROW_ABI } from '../constants/contracts';
import { formatEther, parseEther } from 'viem';

export default function EscrowDApp() {
  const { address } = useAccount();
  const [milestoneId, setMilestoneId] = useState<bigint>(1n);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: milestoneData, refetch } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'getMilestone',
    args: [milestoneId],
  }) as any;

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) refetch();
  }, [isSuccess, refetch]);

  const stateLabels = ["Uninitialized", "Locked (1)", "WorkSubmitted (2)", "Completed (3)"];
  
  let state = 0;
  let deadline = 0n;
  if (milestoneData) {
    state = milestoneData.state;
    deadline = milestoneData.deadline;
  }

  const isClient = milestoneData?.client?.toLowerCase() === address?.toLowerCase();
  const isFreelancer = milestoneData?.freelancer?.toLowerCase() === address?.toLowerCase();
  
  const canSubmitWork = state === 1;
  const canReleaseFunds = state === 2;
  const isDeadlinePassed = now > Number(deadline);
  const canClaimAutoRelease = state === 2 && isDeadlinePassed;

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200">
      <nav className="border-b border-stone-800 p-4 flex justify-between items-center bg-stone-900">
        <h1 className="text-xl font-bold text-amber-500">Decentralized Escrow Demo</h1>
        <ConnectButton />
      </nav>

      <main className="max-w-4xl mx-auto p-6 mt-8">
        {!address ? (
          <div className="text-center p-12 border border-stone-800 rounded-lg bg-stone-800/50">
            <h2 className="text-2xl font-semibold mb-4 text-stone-300">Welcome to Decentralized Escrow</h2>
            <p className="text-stone-400 mb-6">Please connect your MetaMask wallet to continue.</p>
            <div className="flex justify-center"><ConnectButton /></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Client Portal */}
            <div className="border border-stone-800 rounded-lg bg-stone-900 overflow-hidden shadow-lg">
              <div className="bg-amber-950/30 p-4 border-b border-stone-800">
                <h2 className="text-lg font-bold text-amber-500">Client Portal</h2>
              </div>
              <div className="p-6 space-y-4">
                <button 
                  disabled={!isClient || !canReleaseFunds || isPending}
                  onClick={() => writeContract({
                    address: ESCROW_ADDRESS,
                    abi: ESCROW_ABI,
                    functionName: 'releaseFunds',
                    args: [milestoneId],
                    gas: 300000n
                  })}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPending ? 'Processing...' : 'Approve & Release Funds'}
                </button>
              </div>
            </div>

            {/* Freelancer Portal */}
            <div className="border border-stone-800 rounded-lg bg-stone-900 overflow-hidden shadow-lg">
              <div className="bg-orange-950/30 p-4 border-b border-stone-800">
                <h2 className="text-lg font-bold text-orange-600">Freelancer Portal</h2>
              </div>
              <div className="p-6 space-y-4">
                <button 
                  disabled={!isFreelancer || !canSubmitWork || isPending}
                  onClick={() => writeContract({
                    address: ESCROW_ADDRESS,
                    abi: ESCROW_ABI,
                    functionName: 'submitWork',
                    args: [milestoneId],
                    gas: 300000n
                  })}
                  className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPending ? 'Processing...' : 'Submit Work'}
                </button>

                <div className="border-t border-stone-800 pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-stone-400 mb-2">Ghosting Protection</h3>
                  <button 
                    disabled={!isFreelancer || !canClaimAutoRelease || isPending}
                    onClick={() => writeContract({
                      address: ESCROW_ADDRESS,
                      abi: ESCROW_ABI,
                      functionName: 'claimDefaultPayout',
                      args: [milestoneId],
                      gas: 300000n
                    })}
                    className="w-full py-2 px-4 bg-red-950/40 text-red-300 border border-red-900/50 hover:bg-red-900/60 font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Claim Auto-Release (Timeout)
                  </button>
                  {state === 2 && !isDeadlinePassed && (
                    <p className="text-xs text-stone-500 mt-2 text-center">
                      Time until auto-release: {Math.max(0, Number(deadline) - now)}s
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* State Info */}
            <div className="md:col-span-2 border border-stone-800 rounded-lg p-6 bg-stone-800/50">
              <h3 className="text-lg font-bold text-stone-300 mb-4">Milestone #{milestoneId.toString()} Status</h3>
              {milestoneData ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-stone-500">State:</span> <span className="font-mono text-stone-200">{stateLabels[state]}</span></div>
                  <div><span className="text-stone-500">Amount:</span> <span className="font-mono text-stone-200">{formatEther(milestoneData.amount || 0n)} ETH</span></div>
                  <div className="col-span-2"><span className="text-stone-500">Client:</span> <span className="font-mono text-xs text-stone-400">{milestoneData.client}</span></div>
                  <div className="col-span-2"><span className="text-stone-500">Freelancer:</span> <span className="font-mono text-xs text-stone-400">{milestoneData.freelancer}</span></div>
                </div>
              ) : (
                <p className="text-stone-500">No milestone data found.</p>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
