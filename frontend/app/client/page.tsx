"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useWriteContract, useSignMessage } from "wagmi";
import { parseEther, isAddress } from "viem";
import { ESCROW_ABI, ESCROW_CONTRACT_ADDRESS } from "@/config/contract";
import { getOrRequestAuthToken } from "@/lib/authClient";
import {
  Lock,
  CheckCircle,
  Shield,
  ArrowRight,
  Loader2,
  AlertCircle,
  DollarSign,
  Clock,
  Info,
  PlusCircle,
  Briefcase,
  Users,
  Calendar,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { arbitrumSepolia } from "wagmi/chains";

function ClientDashboardContent() {
  const searchParams = useSearchParams();
  const prefillAddress = searchParams.get("prefillAddress") || "";
  const prefillAmount = searchParams.get("prefillAmount") || "";
  const prefillDesc = searchParams.get("prefillDesc") || "";

  const { address, chainId } = useAccount();
  const { writeContract, isPending: isEscrowPending } = useWriteContract();
  const { signMessageAsync } = useSignMessage();

  // Active view tab
  const [activeTab, setActiveTab] = useState<"post_job" | "my_jobs" | "fund_escrow">(
    prefillAddress ? "fund_escrow" : "post_job"
  );

  // ── ON-CHAIN ESCROW FORM STATE ──
  const [freelancer, setFreelancer] = useState(prefillAddress);
  const [amount, setAmount] = useState(prefillAmount);
  const [description, setDescription] = useState(prefillDesc);
  const [durationDays, setDurationDays] = useState("7");
  const [escrowStatus, setEscrowStatus] = useState<"idle" | "success" | "error">("idle");
  const [escrowError, setEscrowError] = useState("");

  useEffect(() => {
    if (prefillAddress) {
      setFreelancer(prefillAddress);
      setActiveTab("fund_escrow");
    }
    if (prefillAmount) setAmount(prefillAmount);
    if (prefillDesc) setDescription(decodeURIComponent(prefillDesc));
  }, [prefillAddress, prefillAmount, prefillDesc]);

  // ── MARKETPLACE JOB POSTING FORM STATE ──
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobSkills, setJobSkills] = useState("");
  const [jobBudget, setJobBudget] = useState("");
  const [appDeadlineDays, setAppDeadlineDays] = useState("3");
  const [compDeadlineDays, setCompDeadlineDays] = useState("10");
  const [postingJob, setPostingJob] = useState(false);
  const [jobStatus, setJobStatus] = useState<"idle" | "success" | "error">("idle");
  const [jobMessage, setJobMessage] = useState("");

  // ── CLIENT'S POSTED JOBS ──
  const [clientJobs, setClientJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const fetchClientJobs = async () => {
    if (!address) return;
    setLoadingJobs(true);
    try {
      const res = await fetch(`/api/jobs?client=${address.toLowerCase()}`);
      if (res.ok) {
        const data = await res.json();
        setClientJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Failed to load client jobs:", err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (address && activeTab === "my_jobs") {
      fetchClientJobs();
    }
  }, [address, activeTab]);

  // Handler: Fund On-Chain Milestone Escrow
  const handleCreateEscrow = () => {
    if (!freelancer || !amount || !description) {
      setEscrowStatus("error");
      setEscrowError("Please fill in all fields.");
      return;
    }
    if (!isAddress(freelancer)) {
      setEscrowStatus("error");
      setEscrowError("Freelancer address is not a valid Ethereum address.");
      return;
    }
    if (chainId !== arbitrumSepolia.id) {
      setEscrowStatus("error");
      setEscrowError("Switch your wallet to Arbitrum Sepolia first.");
      return;
    }

    writeContract(
      {
        address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "createMilestone",
        args: [freelancer as `0x${string}`, BigInt(parseInt(durationDays) * 86400), description],
        value: parseEther(amount),
        maxFeePerGas: 1000000000n, // 1 gwei
        maxPriorityFeePerGas: 100000000n, // 0.1 gwei
      },
      {
        onSuccess: () => {
          setEscrowStatus("success");
          setFreelancer("");
          setAmount("");
          setDescription("");
        },
        onError: (err) => {
          setEscrowStatus("error");
          setEscrowError(err.message?.slice(0, 180) ?? "Transaction failed.");
        },
      }
    );
  };

  // Handler: Post New Job to Marketplace
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setJobStatus("error");
      setJobMessage("Please connect MetaMask wallet first.");
      return;
    }

    setPostingJob(true);
    setJobStatus("idle");
    setJobMessage("");

    try {
      const token = await getOrRequestAuthToken(address, signMessageAsync);
      if (!token) throw new Error("Could not authenticate wallet signature.");

      const nowSec = Math.floor(Date.now() / 1000);
      const appDeadline = nowSec + parseInt(appDeadlineDays) * 86400;
      const compDeadline = nowSec + parseInt(compDeadlineDays) * 86400;

      const skillsArray = jobSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: jobTitle,
          description: jobDescription,
          skills: skillsArray,
          budget: Number(jobBudget),
          currency: "ETH",
          application_deadline: appDeadline,
          completion_deadline: compDeadline,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create job.");
      }

      setJobStatus("success");
      setJobMessage(`Job "${jobTitle}" published! Subscribed freelancers were notified via Web Push.`);
      setJobTitle("");
      setJobDescription("");
      setJobSkills("");
      setJobBudget("");
      fetchClientJobs();
    } catch (err: any) {
      setJobStatus("error");
      setJobMessage(err.message || "Failed to post job");
    } finally {
      setPostingJob(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200">
      {/* Page Header */}
      <div className="bg-amber-950/40 border-b border-amber-900/40 px-4 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> Client Command Center
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-100">Client Portal</h1>
            <p className="text-stone-400 text-sm mt-1 max-w-xl">
              Post new work opportunities, review competing freelancer proposals, and fund on-chain milestone escrows with 0% platform fees.
            </p>
          </div>

          {/* Quick Stats Pill */}
          {address && (
            <div className="bg-stone-900/90 border border-stone-800 rounded-xl px-4 py-3 flex items-center gap-6">
              <div>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">My Jobs</span>
                <span className="text-xl font-bold text-amber-400">{clientJobs.length}</span>
              </div>
              <div className="border-l border-stone-800 pl-6">
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">Take-Rate</span>
                <span className="text-xl font-bold text-emerald-400">0%</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-5xl mx-auto mt-8 flex flex-wrap gap-2 border-b border-stone-800 pb-px">
          <button
            onClick={() => setActiveTab("post_job")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all ${
              activeTab === "post_job"
                ? "bg-stone-900 text-amber-400 border-t-2 border-amber-500 border-x border-stone-800"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
            }`}
          >
            <PlusCircle className="h-4 w-4" /> Post New Job
          </button>
          <button
            onClick={() => setActiveTab("my_jobs")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all ${
              activeTab === "my_jobs"
                ? "bg-stone-900 text-amber-400 border-t-2 border-amber-500 border-x border-stone-800"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
            }`}
          >
            <Briefcase className="h-4 w-4" /> My Posted Jobs &amp; Applicants
          </button>
          <button
            onClick={() => setActiveTab("fund_escrow")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all ${
              activeTab === "fund_escrow"
                ? "bg-stone-900 text-amber-400 border-t-2 border-amber-500 border-x border-stone-800"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
            }`}
          >
            <Lock className="h-4 w-4" /> Direct Milestone Escrow
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ── TAB 1: POST NEW JOB ── */}
        {activeTab === "post_job" && (
          <div className="grid md:grid-cols-5 gap-8">
            {/* Left Column: Guidelines */}
            <div className="md:col-span-2 space-y-5">
              <h3 className="text-base font-bold text-amber-400">Marketplace Work Posting</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                When you publish a job opportunity, it is saved persistently on the server and immediately broadcasted to all registered freelancers who have enabled browser push notifications.
              </p>

              <div className="bg-stone-800/50 border border-stone-800 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex gap-2.5">
                  <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-200 block">Instant Web Push Delivery</strong>
                    <span className="text-stone-400">Freelancers receive background desktop &amp; mobile alerts with your job details.</span>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <Users className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-200 block">Candidate Selection</strong>
                    <span className="text-stone-400">Review multiple applicant bids and proposals before locking funds into escrow.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="md:col-span-3">
              <div className="bg-stone-800/60 border border-stone-800 rounded-2xl p-6 sm:p-7">
                <h2 className="text-xl font-bold text-stone-100 mb-1">Create Work Opportunity</h2>
                <p className="text-xs text-stone-500 mb-6">All required fields are validated on the server.</p>

                <form onSubmit={handlePostJob} className="space-y-4">
                  <div>
                    <label className="label block mb-1 text-xs uppercase tracking-wider">Job Title</label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Full-Stack Developer for Escrow Smart Contract Integration"
                      className="input w-full text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="label block mb-1 text-xs uppercase tracking-wider">Deliverable Description</label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Detail the deliverables, architecture, requirements, and milestones..."
                      rows={4}
                      className="input w-full resize-none text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="label block mb-1 text-xs uppercase tracking-wider">
                      Required Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      value={jobSkills}
                      onChange={(e) => setJobSkills(e.target.value)}
                      placeholder="e.g. Solidity, Next.js, React, Viem, TypeScript"
                      className="input w-full text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label block mb-1 text-xs uppercase tracking-wider">Budget (ETH)</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={jobBudget}
                        onChange={(e) => setJobBudget(e.target.value)}
                        placeholder="0.15"
                        className="input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="label block mb-1 text-xs uppercase tracking-wider">Apply Window</label>
                      <input
                        type="number"
                        min="1"
                        value={appDeadlineDays}
                        onChange={(e) => setAppDeadlineDays(e.target.value)}
                        className="input w-full"
                        placeholder="3 days"
                        required
                      />
                    </div>
                    <div>
                      <label className="label block mb-1 text-xs uppercase tracking-wider">Completion</label>
                      <input
                        type="number"
                        min="1"
                        value={compDeadlineDays}
                        onChange={(e) => setCompDeadlineDays(e.target.value)}
                        className="input w-full"
                        placeholder="10 days"
                        required
                      />
                    </div>
                  </div>

                  {jobStatus === "success" && (
                    <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800 text-emerald-400 p-3 rounded-lg text-xs">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{jobMessage}</span>
                    </div>
                  )}

                  {jobStatus === "error" && (
                    <div className="flex items-center gap-2 bg-red-950/40 border border-red-900 text-red-300 p-3 rounded-lg text-xs">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{jobMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={postingJob || !address}
                    className="btn-client w-full h-11 flex items-center justify-center gap-2 text-sm font-bold mt-2"
                  >
                    {postingJob ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Verifying Signature &amp; Publishing…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Publish Job &amp; Alert Freelancers
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: MY POSTED JOBS & APPLICANTS ── */}
        {activeTab === "my_jobs" && (
          <div className="space-y-6">
            {!address ? (
              <div className="p-8 text-center text-stone-500 bg-stone-900 border border-stone-800 rounded-xl">
                Please connect your wallet to view your posted jobs and applicant proposals.
              </div>
            ) : loadingJobs ? (
              <div className="p-12 text-center text-stone-400">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-500" />
                Loading your posted opportunities…
              </div>
            ) : clientJobs.length === 0 ? (
              <div className="p-12 text-center bg-stone-900 border border-stone-800 rounded-2xl max-w-lg mx-auto">
                <Briefcase className="h-10 w-10 text-stone-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-200 mb-1">No Jobs Posted Yet</h3>
                <p className="text-stone-500 text-xs mb-4">
                  Publish a new work opportunity to start receiving applicant bids and proposals.
                </p>
                <button onClick={() => setActiveTab("post_job")} className="btn-client text-xs px-4 py-2">
                  Create First Job Posting
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {clientJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-stone-900 border border-stone-800 hover:border-amber-500/40 rounded-xl p-5 sm:p-6 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              job.status === "open"
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                                : "bg-stone-800 text-stone-400"
                            }`}
                          >
                            {job.status}
                          </span>
                          <span className="text-xs text-stone-500">Job #{job.id}</span>
                        </div>
                        <h3 className="text-xl font-bold text-stone-100">{job.title}</h3>
                        <p className="text-xs text-stone-400 line-clamp-2">{job.description}</p>
                      </div>

                      <div className="text-right flex flex-col items-end gap-2">
                        <div>
                          <span className="text-xs text-stone-500 block">Agreed Budget</span>
                          <span className="text-xl font-bold text-emerald-400">
                            {job.budget} {job.currency}
                          </span>
                        </div>
                        <Link
                          href={`/jobs/${job.id}`}
                          className="btn-client text-xs px-3.5 py-1.5 flex items-center gap-1.5 font-bold"
                        >
                          <Users className="h-3.5 w-3.5" />
                          Review Applicants ({job.application_count})
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: DIRECT MILESTONE ESCROW ── */}
        {activeTab === "fund_escrow" && (
          <div className="grid md:grid-cols-5 gap-8">
            {/* Left: How it works */}
            <div className="md:col-span-2 space-y-6">
              <h3 className="text-base font-bold text-amber-400">On-Chain Milestone Escrow</h3>
              {[
                { icon: Lock, title: "Lock Funds", body: "ETH is locked directly in the Arbitrum Sepolia smart contract." },
                { icon: CheckCircle, title: "Freelancer Submits", body: "The freelancer performs the work and calls submitWork on-chain." },
                { icon: DollarSign, title: "100% Payout on Approval", body: "When you approve, 100% of the funds are transferred with zero platform cut." },
                { icon: Clock, title: "Ghosting Protection", body: "If you don't respond before the deadline, freelancer can auto-claim." },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="mt-0.5 flex-shrink-0 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg h-fit">
                      <Icon className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-medium text-stone-200 text-sm">{s.title}</p>
                      <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">{s.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Funding Form */}
            <div className="md:col-span-3">
              <div className="bg-stone-800/60 border border-amber-900/40 rounded-2xl p-6 sm:p-7 space-y-4">
                <div className="border-b border-stone-800 pb-3">
                  <h2 className="font-bold text-amber-400 text-lg">Fund Milestone Contract</h2>
                  <p className="text-xs text-stone-500">Arbitrum Sepolia Contract: {ESCROW_CONTRACT_ADDRESS.slice(0, 10)}…</p>
                </div>

                <div>
                  <label className="label block mb-1 text-xs uppercase tracking-wider">Freelancer Wallet Address</label>
                  <input
                    type="text"
                    value={freelancer}
                    onChange={(e) => setFreelancer(e.target.value)}
                    placeholder="0x..."
                    className="input w-full font-mono text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="label block mb-1 text-xs uppercase tracking-wider">Milestone Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Deliverable: Responsive web interface and escrow API integration..."
                    rows={3}
                    className="input w-full resize-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label block mb-1 text-xs uppercase tracking-wider">Amount (ETH)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.05"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="label block mb-1 text-xs uppercase tracking-wider">Deadline (Days)</label>
                    <input
                      type="number"
                      min="1"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      className="input w-full"
                    />
                  </div>
                </div>

                {escrowStatus === "success" && (
                  <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800 text-emerald-400 p-3 rounded-lg text-xs">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    <span>Milestone funded successfully! The freelancer can now view and submit work on-chain.</span>
                  </div>
                )}

                {escrowStatus === "error" && (
                  <div className="flex items-center gap-2 bg-red-950/40 border border-red-900 text-red-300 p-3 rounded-lg text-xs">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{escrowError}</span>
                  </div>
                )}

                <button
                  onClick={handleCreateEscrow}
                  disabled={isEscrowPending || !address}
                  className="btn-client w-full h-11 flex items-center justify-center gap-2 text-sm font-bold mt-2"
                >
                  {isEscrowPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Confirming on Arbitrum Sepolia…
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" /> Lock ETH in Escrow
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-900 text-stone-200 p-8 text-center">Loading Client Dashboard…</div>}>
      <ClientDashboardContent />
    </Suspense>
  );
}
