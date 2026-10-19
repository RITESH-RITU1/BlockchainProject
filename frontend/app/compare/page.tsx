"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, BarChart2, DollarSign, Zap, Clock, ShieldCheck, ArrowRight, Calculator } from "lucide-react";

const charts = [
  {
    file: "/charts/platform_fee.png",
    title: "Platform Take-Rate Comparison",
    desc: "Upwork and Fiverr deduct 10–20% of every contract value. ClearEscrow charges 0% platform fee — the client's full deposited funds transfer directly to the freelancer upon milestone approval.",
    type: "Web2 Platform Published Standards",
  },
  {
    file: "/charts/gas_cost.png",
    title: "Gas Cost per Contract Execution",
    desc: "Ethereum Layer-1 smart contract interactions average $15–$22 during regular network activity. On Arbitrum Sepolia Layer-2, execution costs average ~$0.03 — providing >99% operational cost savings.",
    type: "Empirical Layer-2 Measurements (Arbitrum Sepolia Testnet)",
  },
  {
    file: "/charts/latency.png",
    title: "Transaction Finality & Latency",
    desc: "Ethereum L1 finalizes in ~12 seconds per slot. Arbitrum Sepolia Nitro rollup architecture provides sub-second soft confirmation (~0.25 seconds) for instantaneous UI updates.",
    type: "Empirical Layer-2 Block Timing",
  },
  {
    file: "/charts/cost_breakdown.png",
    title: "Total Economics on a $1,000 Contract",
    desc: "On Web2 platforms, a freelancer loses $200 in commissions on a $1,000 project. On ClearEscrow, the freelancer retains $999.97 net payout (with only ~$0.03 spent in L2 transaction fees).",
    type: "Comparative Economic Model",
  },
];

export default function ComparePage() {
  const [contractAmount, setContractAmount] = useState<number>(1000);

  const calculateTake = (rate: number, fixedGas = 0) => {
    const fee = contractAmount * (rate / 100);
    const net = Math.max(0, contractAmount - fee - fixedGas);
    return { fee, net };
  };

  const upwork = calculateTake(20);
  const fiverr = calculateTake(20);
  const freelancerCom = calculateTake(10);
  const clearEscrow = calculateTake(0, 0.03);

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200">
      {/* Header */}
      <div className="bg-stone-950/80 border-b border-stone-800 px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-emerald-600/20 border border-emerald-500/30 p-2.5 rounded-xl">
              <BarChart2 className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">
              Benchmark Analysis &amp; Platform Economics
            </p>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-100 mb-3 tracking-tight">
            How ClearEscrow Stacks Up
          </h1>
          <p className="text-stone-400 max-w-2xl text-sm sm:text-base leading-relaxed">
            Side-by-side empirical metrics comparing our decentralized Layer-2 escrow against traditional Web2 freelancing intermediaries (Upwork, Fiverr) and Ethereum Layer-1.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">

        {/* ── INTERACTIVE SAVINGS CALCULATOR ── */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-850 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2.5 text-amber-400 text-sm font-bold uppercase tracking-wider mb-2">
            <Calculator className="h-4 w-4" /> Interactive Freelancer Payout Calculator
          </div>
          <h2 className="text-2xl font-bold text-stone-100 mb-2">See How Much More You Keep</h2>
          <p className="text-xs sm:text-sm text-stone-400 mb-6">
            Enter a milestone contract value to see the exact take-rate deducted across major platforms versus ClearEscrow.
          </p>

          <div className="flex items-center gap-3 max-w-xs mb-8">
            <span className="text-xl font-bold text-stone-400">$</span>
            <input
              type="number"
              min="10"
              step="50"
              value={contractAmount}
              onChange={(e) => setContractAmount(Math.max(0, Number(e.target.value)))}
              className="input text-xl font-bold font-mono h-12 w-full text-emerald-400"
              placeholder="1000"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Upwork */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-4 text-center">
              <span className="text-xs text-stone-400 font-semibold block mb-1">Upwork (20% fee)</span>
              <span className="text-xl font-bold text-red-400 block">${upwork.net.toFixed(2)}</span>
              <span className="text-[11px] text-stone-500 mt-1 block">Deduction: -${upwork.fee.toFixed(2)}</span>
            </div>

            {/* Fiverr */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-4 text-center">
              <span className="text-xs text-stone-400 font-semibold block mb-1">Fiverr (20% fee)</span>
              <span className="text-xl font-bold text-red-400 block">${fiverr.net.toFixed(2)}</span>
              <span className="text-[11px] text-stone-500 mt-1 block">Deduction: -${fiverr.fee.toFixed(2)}</span>
            </div>

            {/* Freelancer.com */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-4 text-center">
              <span className="text-xs text-stone-400 font-semibold block mb-1">Freelancer (10% fee)</span>
              <span className="text-xl font-bold text-orange-400 block">${freelancerCom.net.toFixed(2)}</span>
              <span className="text-[11px] text-stone-500 mt-1 block">Deduction: -${freelancerCom.fee.toFixed(2)}</span>
            </div>

            {/* ClearEscrow */}
            <div className="bg-amber-950/20 border-2 border-amber-500/60 rounded-xl p-4 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500 text-stone-950 font-bold text-[9px] uppercase px-2 py-0.5 rounded-bl">
                0% Fee
              </div>
              <span className="text-xs text-amber-400 font-bold block mb-1">ClearEscrow</span>
              <span className="text-xl font-bold text-emerald-400 block">${clearEscrow.net.toFixed(2)}</span>
              <span className="text-[11px] text-emerald-500 mt-1 block">Freelancer keeps 99.99%</span>
            </div>
          </div>
        </div>

        {/* ── STRUCTURED COMPARISON MATRIX TABLE ── */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-stone-800">
            <h3 className="text-lg font-bold text-stone-100">Platform Feature &amp; Performance Matrix</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Empirically measured testnet metrics and standard fee policies.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-950 text-stone-400 border-b border-stone-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Evaluation Criteria</th>
                  <th className="py-3.5 px-4 font-semibold text-amber-400">ClearEscrow (Arbitrum L2)</th>
                  <th className="py-3.5 px-4 font-semibold">Upwork / Fiverr</th>
                  <th className="py-3.5 px-4 font-semibold">Ethereum Layer-1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 text-stone-300">
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-200">Platform Take-Rate</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">0% (Zero Middleman)</td>
                  <td className="py-3.5 px-4 text-red-400">10% – 20% commission</td>
                  <td className="py-3.5 px-4 text-stone-400">0% (protocol-dependent)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-200">Transaction Gas Cost</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">~$0.03 per contract call*</td>
                  <td className="py-3.5 px-4 text-stone-400">$0 (covered in 20% cut)</td>
                  <td className="py-3.5 px-4 text-red-400">$15.00 – $25.00+</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-200">Confirmation Latency</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">~0.25 seconds (Nitro rollup)</td>
                  <td className="py-3.5 px-4 text-stone-400">2–5 business days payout</td>
                  <td className="py-3.5 px-4 text-stone-400">~12.0 seconds</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-200">Client Ghosting Protection</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">Smart Contract Timeout Auto-Claim</td>
                  <td className="py-3.5 px-4 text-stone-400">Manual support ticket queue</td>
                  <td className="py-3.5 px-4 text-stone-400">Supported if coded in contract</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-200">Payment Custody</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">Non-Custodial Multi-Sig Escrow</td>
                  <td className="py-3.5 px-4 text-stone-400">Centralized bank holding account</td>
                  <td className="py-3.5 px-4 text-stone-400">Non-Custodial</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-200">Identity Model</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">EIP-191 / Viem Wallet Signatures</td>
                  <td className="py-3.5 px-4 text-stone-400">SSN / Passport KYC</td>
                  <td className="py-3.5 px-4 text-stone-400">Private key signature</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-stone-950/60 border-t border-stone-800 text-[11px] text-stone-500">
            * Arbitrum Sepolia gas measurements are calculated from on-chain gas usage of Escrow.sol execution at 0.1 gwei base fee.
          </div>
        </div>

        {/* ── DETAILED VISUAL CHARTS GRID ── */}
        <div className="space-y-10">
          <h3 className="text-xl font-bold text-stone-100">Visual Benchmark Visualizations</h3>
          {charts.map((c, i) => (
            <div key={i} className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-5 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-500 tracking-wider mb-1">
                    {c.type}
                  </div>
                  <h2 className="text-lg font-bold text-stone-100">{c.title}</h2>
                  <p className="text-xs text-stone-400 mt-0.5 max-w-xl">{c.desc}</p>
                </div>
                <a
                  href={c.file}
                  download
                  className="self-start sm:self-center flex items-center gap-1.5 text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 px-3 py-2 rounded-lg transition-colors font-medium"
                >
                  <Download className="h-3.5 w-3.5" /> Download Chart
                </a>
              </div>
              <div className="p-4 bg-stone-950/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.file}
                  alt={c.title}
                  className="w-full rounded-lg border border-stone-800/60"
                  style={{ imageRendering: "auto" }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="border-t border-stone-800 pt-8 pb-4 text-center">
          <p className="text-stone-400 text-sm mb-4">Start trading work with zero take-rate and full escrow protection.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/client"
              className="inline-flex items-center justify-center px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition-all shadow-md text-sm"
            >
              Post Work Opportunity as Client
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold rounded-xl transition-all text-sm"
            >
              Browse Open Work as Freelancer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
