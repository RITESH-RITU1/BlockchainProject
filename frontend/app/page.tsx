"use client";

import Link from "next/link";
import { ArrowRight, Zap, BarChart2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-900 text-stone-200 flex flex-col">

      {/* ── HERO ── fills most of the screen */}
      <section className="relative flex-1 flex flex-col items-center justify-center overflow-hidden min-h-[88vh]">
        {/* Landscape bg */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80&auto=format&fit=crop"
          alt="Mountain landscape"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-stone-900/65" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <Zap className="h-3.5 w-3.5" />
            Arbitrum Sepolia · 0% Fees · Ghosting Protection
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg leading-tight mb-6">
            Freelance Payments,{" "}
            <span className="text-amber-500">
              On-Chain.
            </span>
          </h1>
          <p className="text-xl text-stone-300 max-w-2xl mx-auto mb-14">
            A decentralised escrow where clients lock funds and freelancers get paid
            in full — no middleman, no platform cut, no ghosting.
          </p>

          {/* Two portal doors */}
          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Client */}
            <Link
              href="/client"
              className="group relative flex flex-col items-start gap-3 bg-amber-950/60 hover:bg-amber-950/80 border border-amber-700/50 hover:border-amber-500 rounded-2xl p-7 text-left transition-all duration-200 shadow-xl"
            >
              <span className="text-xs text-amber-500 font-bold uppercase tracking-widest">Client Portal</span>
              <h2 className="text-2xl font-bold text-stone-100">I&apos;m Hiring</h2>
              <p className="text-sm text-stone-400 leading-relaxed">
                Lock ETH for a milestone. Release payment when you approve the work.
                Auto-protected against disputes.
              </p>
              <div className="mt-auto flex items-center gap-1.5 text-amber-400 font-semibold text-sm">
                Fund a Milestone <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* Freelancer */}
            <Link
              href="/freelancer"
              className="group relative flex flex-col items-start gap-3 bg-orange-950/60 hover:bg-orange-950/80 border border-orange-700/50 hover:border-orange-500 rounded-2xl p-7 text-left transition-all duration-200 shadow-xl"
            >
              <span className="text-xs text-orange-500 font-bold uppercase tracking-widest">Freelancer Portal</span>
              <h2 className="text-2xl font-bold text-stone-100">I&apos;m Working</h2>
              <p className="text-sm text-stone-400 leading-relaxed">
                Enter your Milestone ID, view locked funds, submit work, and collect
                100% of the payout — protected from ghosting.
              </p>
              <div className="mt-auto flex items-center gap-1.5 text-orange-400 font-semibold text-sm">
                View My Work <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMPARE TEASER ── pinned at bottom */}
      <div className="bg-stone-800 border-t border-stone-700 px-4 py-5 text-center">
        <Link
          href="/compare"
          className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          <BarChart2 className="h-4 w-4" />
          See benchmark comparison — fees, gas costs &amp; latency vs. existing platforms
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
