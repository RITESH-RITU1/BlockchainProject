"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Briefcase,
  DollarSign,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle,
  AlertCircle,
  Tag,
  Calendar,
} from "lucide-react";

interface Job {
  id: number;
  client_address: string;
  title: string;
  description: string;
  skills: string[];
  budget: number;
  currency: string;
  application_deadline: number;
  completion_deadline: number;
  status: string;
  application_count: number;
  created_at: number;
}

const COMMON_SKILLS = [
  "All",
  "Solidity",
  "React",
  "Next.js",
  "TypeScript",
  "Smart Contracts",
  "UI/UX Design",
  "Security Audit",
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("All");

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let url = "/api/jobs";
      const params = new URLSearchParams();
      if (selectedSkill && selectedSkill !== "All") {
        params.append("skill", selectedSkill);
      }
      if (searchQuery.trim()) {
        params.append("q", searchQuery.trim());
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Failed to load jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedSkill]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const formatDeadline = (timestampSec: number) => {
    const date = new Date(timestampSec * 1000);
    const nowSec = Math.floor(Date.now() / 1000);
    const diffSec = timestampSec - nowSec;
    if (diffSec <= 0) return "Deadline passed";
    const days = Math.floor(diffSec / 86400);
    if (days > 0) return `${days}d left (${date.toLocaleDateString()})`;
    const hours = Math.floor(diffSec / 3600);
    return `${hours}h left`;
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200">
      {/* Header Banner */}
      <div className="bg-stone-950/70 border-b border-stone-800 px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold uppercase tracking-widest mb-2">
            <Sparkles className="h-4 w-4" /> Freelancer Marketplace
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-100 mb-3">
            Available Work Opportunities
          </h1>
          <p className="text-stone-400 max-w-2xl text-sm sm:text-base leading-relaxed">
            Browse verified client opportunities. Apply with your proposal and estimated turnaround.
            When selected, client funds are locked in decentralized escrow on Arbitrum Sepolia.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by keywords, deliverables, or skills..."
                className="input w-full pl-10 bg-stone-900/90 border-stone-700 text-sm h-11"
              />
            </div>
            <button
              type="submit"
              className="btn-client px-6 h-11 flex items-center justify-center gap-2 text-sm font-semibold whitespace-nowrap"
            >
              <Search className="h-4 w-4" /> Search Jobs
            </button>
          </form>

          {/* Skill Filter Pills */}
          <div className="mt-5 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-stone-500 font-medium mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filter:
            </span>
            {COMMON_SKILLS.map((skill) => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(skill)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  selectedSkill === skill
                    ? "bg-amber-500 text-stone-950 font-bold shadow-sm"
                    : "bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700 border border-stone-700/60"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Jobs Listing */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 border-stone-800 animate-pulse bg-stone-800/30 rounded-xl h-36" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 bg-stone-900 border border-stone-800 rounded-2xl p-8 max-w-xl mx-auto">
            <Briefcase className="h-12 w-12 text-stone-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-stone-300 mb-2">No Open Opportunities Found</h3>
            <p className="text-stone-500 text-xs sm:text-sm mb-6 leading-relaxed">
              {searchQuery || selectedSkill !== "All"
                ? "Try clearing your filters or search keywords to view all postings."
                : "No clients have posted jobs yet. Be the first to post work as a client!"}
            </p>
            <Link href="/client" className="btn-client inline-flex items-center gap-2 text-sm font-semibold px-5 py-2">
              Post a Work Opportunity
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-stone-500 mb-2 px-1">
              <span>Showing {jobs.length} work opportunities</span>
              <span>Updated in real-time</span>
            </div>

            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-stone-900 border border-stone-800 hover:border-amber-500/40 rounded-xl p-5 sm:p-6 transition-all duration-200 hover:shadow-xl hover:shadow-black/20 group"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Column: Job Info */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          job.status === "open"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                            : "bg-stone-800 text-stone-400"
                        }`}
                      >
                        {job.status}
                      </span>
                      <span className="text-xs text-stone-500">
                        Posted by <span className="font-mono text-stone-400">{job.client_address.slice(0, 6)}…{job.client_address.slice(-4)}</span>
                      </span>
                    </div>

                    <Link href={`/jobs/${job.id}`}>
                      <h2 className="text-xl font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
                        {job.title}
                      </h2>
                    </Link>

                    <p className="text-sm text-stone-400 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Skill Badges */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] bg-stone-800/80 text-stone-300 border border-stone-700/60 px-2.5 py-0.5 rounded-md"
                          >
                            <Tag className="h-2.5 w-2.5 text-amber-500/70" />
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Economics & Apply CTA */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-stone-800 md:min-w-[190px]">
                    <div className="text-left md:text-right">
                      <span className="text-xs text-stone-500 block">Agreed Budget</span>
                      <span className="text-2xl font-bold text-emerald-400">
                        {job.budget} <span className="text-sm font-medium text-emerald-500">{job.currency}</span>
                      </span>
                      <span className="text-[11px] text-stone-500 block mt-0.5 flex items-center md:justify-end gap-1">
                        <Clock className="h-3 w-3" /> {formatDeadline(job.application_deadline)}
                      </span>
                    </div>

                    <Link
                      href={`/jobs/${job.id}`}
                      className="btn-freelancer flex items-center gap-1.5 text-xs sm:text-sm font-bold px-4 py-2"
                    >
                      View &amp; Apply <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
