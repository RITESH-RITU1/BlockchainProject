import Image from "next/image";
import Link from "next/link";
import { Download, BarChart2 } from "lucide-react";

const charts = [
  {
    file: "/charts/platform_fee.png",
    title: "Platform Fee Comparison",
    desc: "Upwork and Fiverr charge 10–20% per job. This dApp charges 0% — the full ETH goes straight to the freelancer.",
  },
  {
    file: "/charts/gas_cost.png",
    title: "Gas Cost per Transaction",
    desc: "Ethereum L1 contract calls average $15–$22. On Arbitrum Sepolia the same call costs ~$0.03 — over 99% cheaper.",
  },
  {
    file: "/charts/latency.png",
    title: "Transaction Finality / Latency",
    desc: "Ethereum L1 finalises in ~12 seconds. Arbitrum Sepolia delivers sub-second block confirmation (~0.25 s).",
  },
  {
    file: "/charts/cost_breakdown.png",
    title: "Total Cost on a $1,000 Job",
    desc: "On Upwork/Fiverr a freelancer loses $200 in fees. Here, $999.97 reaches the freelancer (only $0.03 in gas).",
  },
];

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-stone-900 text-stone-200">
      {/* Header */}
      <div className="bg-stone-800 border-b border-stone-700 px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-emerald-600/20 p-2.5 rounded-xl">
              <BarChart2 className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">
              Benchmark Comparison
            </p>
          </div>
          <h1 className="text-4xl font-bold text-stone-100 mb-3">
            How We Stack Up
          </h1>
          <p className="text-stone-400 max-w-2xl">
            Side-by-side data comparing this decentralised escrow against existing platforms
            and Ethereum L1 — across platform fees, gas costs, latency, and real job economics.
          </p>
        </div>
      </div>

      {/* Chart grid */}
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {charts.map((c, i) => (
          <div key={i} className="bg-stone-800/50 border border-stone-700 rounded-2xl overflow-hidden">
            {/* Card header */}
            <div className="px-6 py-5 border-b border-stone-700 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-stone-100">{c.title}</h2>
                <p className="text-sm text-stone-400 mt-1 max-w-xl">{c.desc}</p>
              </div>
              <a
                href={c.file}
                download
                className="flex-shrink-0 flex items-center gap-1.5 text-xs bg-stone-700 hover:bg-stone-600 text-stone-300 px-3 py-2 rounded-lg transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> Download PNG
              </a>
            </div>
            {/* Chart image */}
            <div className="p-4 bg-stone-900/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.file}
                alt={c.title}
                className="w-full rounded-lg"
                style={{ imageRendering: "auto" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-stone-800 bg-stone-800/30">
        <div className="max-w-5xl mx-auto px-4 py-10 text-center">
          <p className="text-stone-400 mb-4">Ready to try it yourself?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/client"
              className="inline-flex items-center px-6 py-3 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold rounded-xl transition-colors"
            >
              I&apos;m a Client — Fund a Milestone
            </Link>
            <Link
              href="/freelancer"
              className="inline-flex items-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-stone-100 font-bold rounded-xl transition-colors"
            >
              I&apos;m a Freelancer — View My Work
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
