"use client";

import Link from "next/link";
import { ArrowRight, Zap, BarChart2, Briefcase, ShieldCheck, Sparkles, PlusCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-900 text-stone-200 flex flex-col selection:bg-amber-500 selection:text-stone-950">

      {/* ── HERO SECTION ── */}
      <section className="relative flex-1 flex flex-col items-center justify-center overflow-hidden min-h-[90vh] py-16 px-4">
        {/* Mountain Landscape Background with Layered Gradients for Readability */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80&auto=format&fit=crop"
            alt="Mountain landscape"
            className="w-full h-full object-cover scale-105 filter brightness-[0.75] contrast-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/85 via-stone-900/75 to-stone-900" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
          {/* Network & Value Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-md shadow-lg shadow-black/20">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Arbitrum Sepolia Layer-2 · 0% Take-Rate · Ghosting Protection</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6 drop-shadow-md">
            Freelance Payments,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500">
              Guaranteed On-Chain.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-stone-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal drop-shadow">
            A decentralized escrow and talent marketplace where clients post work with locked funds,
            and verified freelancers collect 100% of their earnings with zero middlemen and automated ghosting protection.
          </p>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-all shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4" /> Browse Open Opportunities
            </Link>
            <Link
              href="/client"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-200 border border-stone-700 text-sm font-semibold transition-all hover:-translate-y-0.5"
            >
              <PlusCircle className="h-4 w-4 text-amber-400" /> Post a Job
            </Link>
          </div>

          {/* Two Portal Cards */}
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
            {/* Client Portal Card */}
            <Link
              href="/client"
              className="group relative flex flex-col justify-between bg-stone-900/80 hover:bg-stone-900/95 border border-amber-500/20 hover:border-amber-500/60 rounded-2xl p-7 transition-all duration-300 shadow-xl shadow-black/30 hover:shadow-2xl hover:shadow-amber-950/20 hover:-translate-y-1.5 backdrop-blur-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-500 font-bold uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                    Client Portal
                  </span>
                  <ShieldCheck className="h-5 w-5 text-amber-500/60 group-hover:text-amber-500 transition-colors" />
                </div>
                <h2 className="text-2xl font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
                  I&apos;m Hiring
                </h2>
                <p className="text-sm text-stone-400 leading-relaxed">
                  Post new work opportunities, review verified freelancer proposals, or lock ETH directly into milestone escrow contracts.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between text-amber-400 font-semibold text-sm">
                <span>Manage Jobs &amp; Escrows</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
              </div>
            </Link>

            {/* Freelancer Portal Card */}
            <Link
              href="/freelancer"
              className="group relative flex flex-col justify-between bg-stone-900/80 hover:bg-stone-900/95 border border-orange-500/20 hover:border-orange-500/60 rounded-2xl p-7 transition-all duration-300 shadow-xl shadow-black/30 hover:shadow-2xl hover:shadow-orange-950/20 hover:-translate-y-1.5 backdrop-blur-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-orange-500 font-bold uppercase tracking-widest bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-500/20">
                    Freelancer Portal
                  </span>
                  <Briefcase className="h-5 w-5 text-orange-500/60 group-hover:text-orange-500 transition-colors" />
                </div>
                <h2 className="text-2xl font-bold text-stone-100 group-hover:text-orange-400 transition-colors">
                  I&apos;m Working
                </h2>
                <p className="text-sm text-stone-400 leading-relaxed">
                  Discover client work, submit proposals, manage Web Push job alerts, and submit deliverables with automatic ghosting protection.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between text-orange-400 font-semibold text-sm">
                <span>Browse Work &amp; Deliverables</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMPARE TEASER ── */}
      <div className="bg-stone-950 border-t border-stone-800 px-4 py-4 text-center">
        <Link
          href="/compare"
          className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors group"
        >
          <BarChart2 className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>See benchmark comparison — fees, gas costs &amp; latency vs. existing Web2 platforms</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
