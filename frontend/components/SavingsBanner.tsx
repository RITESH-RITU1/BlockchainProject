import React from 'react';

export default function SavingsBanner() {
  return (
    <div className="bg-amber-950/40 text-stone-200 p-3 text-sm border-b border-amber-900/50 flex flex-col md:flex-row justify-center items-center gap-4">
      <div className="font-semibold text-amber-500">Decentralized Escrow</div>
      <div className="flex gap-4">
        <span><span className="text-stone-400">Fee:</span> 10-20% <span className="text-emerald-500 font-bold">→ 0%</span></span>
        <span><span className="text-stone-400">Gas:</span> $15.50 <span className="text-emerald-500 font-bold">→ ~$0.03</span></span>
        <span><span className="text-stone-400">Latency:</span> 12s <span className="text-emerald-500 font-bold">→ ~0.25s</span></span>
      </div>
    </div>
  );
}
