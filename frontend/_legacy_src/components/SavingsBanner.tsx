export function SavingsBanner() {
  return (
    <div className="bg-stone-800 border-b border-stone-700 py-3 px-4 shadow-md">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm font-semibold gap-4">
        <div className="flex flex-col items-center">
          <span className="text-stone-400">Platform Fee</span>
          <span className="text-emerald-500">0% (Keep 100%) <span className="text-stone-500 line-through text-xs ml-1">Fiverr 20%</span></span>
        </div>
        <div className="hidden md:block w-px h-8 bg-stone-700"></div>
        <div className="flex flex-col items-center">
          <span className="text-stone-400">Gas Costs</span>
          <span className="text-emerald-500">~$0.03 (Arbitrum) <span className="text-stone-500 line-through text-xs ml-1">L1 $15.50</span></span>
        </div>
        <div className="hidden md:block w-px h-8 bg-stone-700"></div>
        <div className="flex flex-col items-center">
          <span className="text-stone-400">Finality Latency</span>
          <span className="text-emerald-500">~0.25s <span className="text-stone-500 line-through text-xs ml-1">L1 12.0s</span></span>
        </div>
      </div>
    </div>
  );
}
