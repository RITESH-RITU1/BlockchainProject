"use client";

import React from "react";
import { formatGwei } from "viem";
import {
  GasFeeDetails,
  formatEthFee,
  isLowGasFee,
  calculateGasSavings,
} from "@/lib/gas";
import {
  X,
  ExternalLink,
  Fuel,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Sparkles,
  Info,
} from "lucide-react";

interface GasDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: GasFeeDetails | null;
}

export default function GasDetailsModal({
  isOpen,
  onClose,
  details,
}: GasDetailsModalProps) {
  if (!isOpen || !details) return null;

  const lowGas = isLowGasFee(details.totalFeeWei);
  const savings = calculateGasSavings(details.totalFeeWei);
  const explorerUrl = `https://sepolia.arbiscan.io/tx/${details.txHash}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Fuel className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-100">
                Transaction Gas Details
              </h3>
              <p className="text-xs text-stone-400">
                Arbitrum Sepolia Layer-2 Receipt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Top Status Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-850 border border-stone-800">
            <div>
              <span className="text-xs text-stone-500 uppercase tracking-wider block font-semibold">
                Action
              </span>
              <span className="font-bold text-stone-100 text-sm">
                {details.actionName}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-500 uppercase tracking-wider block font-semibold">
                Status
              </span>
              {details.status === "success" ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Mined &amp; Confirmed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-400 text-xs font-bold">
                  <XCircle className="h-3.5 w-3.5" /> Reverted on-chain
                </span>
              )}
            </div>
          </div>

          {/* Low Gas Badge if < 0.00001 ETH */}
          {lowGas && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Low Gas Fee: Below 0.00001 ETH</span>
            </div>
          )}

          {/* Primary Fee Breakdown */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-stone-400 text-xs">
                Total Actual Fee Paid:
              </span>
              <div className="text-right">
                <span className="font-mono font-extrabold text-lg text-emerald-400">
                  {formatEthFee(details.totalFeeWei)} ETH
                </span>
                {savings.actualFeeUsd !== undefined && (
                  <span className="text-stone-500 text-xs block font-mono">
                    ≈ ${savings.actualFeeUsd.toFixed(4)} USD
                  </span>
                )}
              </div>
            </div>

            <div className="h-px bg-stone-800 my-1" />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-stone-500 block">Gas Units Used:</span>
                <span className="font-mono text-stone-200 font-semibold">
                  {details.gasUsed.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">Effective Gas Price:</span>
                <span className="font-mono text-stone-200 font-semibold">
                  {details.effectiveGasPrice !== undefined
                    ? `${formatGwei(details.effectiveGasPrice)} Gwei`
                    : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">Execution Fee (L2):</span>
                <span className="font-mono text-stone-300 font-semibold">
                  {formatEthFee(details.executionFeeWei)} ETH
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">L1 Calldata Fee:</span>
                <span className="font-mono text-stone-300 font-semibold">
                  {details.l1FeeWei !== undefined
                    ? `${formatEthFee(details.l1FeeWei)} ETH`
                    : "Included in total"}
                </span>
              </div>
            </div>

            {details.isPartialFee && (
              <div className="flex items-center gap-2 text-[11px] text-amber-400 bg-amber-950/20 border border-amber-800/40 p-2 rounded-lg mt-2">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Partial fee displayed: effective gas price was not exposed in
                  the receipt.
                </span>
              </div>
            )}
          </div>

          {/* Gas Fee & Savings Benchmark Section */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-stone-900 to-stone-950 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                <TrendingDown className="h-4 w-4" /> Gas Fee &amp; Savings
              </div>
              <span className="text-[10px] text-stone-500 bg-stone-800 px-2 py-0.5 rounded">
                vs Ethereum L1 Benchmark
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-2.5">
                <span className="text-[11px] text-stone-500 block">
                  Eth L1 Estimated Fee:
                </span>
                <span className="font-mono font-bold text-red-400 text-xs sm:text-sm block">
                  ~{savings.ethL1BenchmarkFeeEth} ETH
                </span>
                <span className="text-[10px] text-stone-500">
                  (${savings.ethL1BenchmarkFeeUsd.toFixed(2)})
                </span>
              </div>
              <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-2.5">
                <span className="text-[11px] text-stone-500 block">
                  ClearEscrow L2 Fee:
                </span>
                <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm block">
                  {savings.actualFeeEth} ETH
                </span>
                <span className="text-[10px] text-emerald-500">
                  (&lt; $0.05)
                </span>
              </div>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-3 flex items-center justify-between text-xs">
              <div>
                <span className="text-stone-400 block text-[11px]">
                  Estimated Savings:
                </span>
                <span className="font-mono font-bold text-emerald-300">
                  ~{savings.estimatedSavingsEth} ETH
                </span>
              </div>
              <div className="text-right">
                <span className="text-stone-400 block text-[11px]">
                  Percentage Saved:
                </span>
                <span className="font-bold text-emerald-400 text-sm">
                  ~{savings.savingsPercentage}%
                </span>
              </div>
            </div>
            <p className="text-[10px] text-stone-500 leading-tight">
              * Savings calculated against standard Ethereum L1 escrow call benchmark ($22.00 reference). ClearEscrow uses Arbitrum Sepolia Nitro rollup.
            </p>
          </div>

          {/* Tx Hash & Explorer Link */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs text-stone-500 block">Transaction Hash:</span>
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-stone-950 border border-stone-800 font-mono text-xs text-stone-400">
              <span className="truncate">{details.txHash}</span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors font-medium text-xs ml-2"
              >
                <span>Explorer</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-800 bg-stone-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
