"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useSignMessage } from "wagmi";
import { ESCROW_ABI, ESCROW_CONTRACT_ADDRESS } from "@/config/contract";
import { formatEther } from "viem";
import { getOrRequestAuthToken } from "@/lib/authClient";
import {
  getPushPermissionState,
  checkCurrentSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  getDetailedPushStatus,
  type PushPermissionState,
  type PushStatusState,
} from "@/lib/pushClient";
import {
  Send,
  DollarSign,
  Clock,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
  Zap,
  Bell,
  BellOff,
  User,
  Briefcase,
  Sparkles,
  FileText,
  Tag,
  ArrowRight,
} from "lucide-react";

function CountdownTimer({ deadline }: { deadline: number }) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    const update = () => setTimeLeft(Math.max(0, deadline - Math.floor(Date.now() / 1000)));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [deadline]);

  if (timeLeft === 0)
    return <span className="text-red-400 font-semibold">⚠ Deadline passed — auto-release available</span>;
  const d = Math.floor(timeLeft / 86400);
  const h = Math.floor((timeLeft % 86400) / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  return (
    <span className="font-mono text-amber-400">
      {d > 0 ? `${d}d ` : ""}
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

function MilestoneView({ milestoneId }: { milestoneId: bigint }) {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const { data, refetch, isLoading } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "milestones",
    args: [milestoneId],
  });

  if (isLoading) return <div className="text-stone-400 text-sm p-6">Loading milestone data…</div>;
  if (!data) return <div className="text-red-400 text-sm p-6">Milestone not found.</div>;

  const [client, freelancer, amount, state, deadline, description] = data;
  const isFreelancer = address?.toLowerCase() === freelancer.toLowerCase();
  const stateLabel = ["Uninitialized", "🔒 Locked", "📋 Work Submitted", "⚠️ Disputed", "✅ Completed"][state] ?? "Unknown";
  const isLocked = state === 1;
  const isSubmitted = state === 2;
  const deadlinePassed = Math.floor(Date.now() / 1000) > Number(deadline);

  const submit = () =>
    writeContract(
      {
        address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "submitWork",
        args: [milestoneId],
        maxFeePerGas: 1000000000n,
        maxPriorityFeePerGas: 100000000n,
      },
      { onSuccess: () => refetch() }
    );

  const autoRelease = () =>
    writeContract(
      {
        address: ESCROW_CONTRACT_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "claimDefaultPayout",
        args: [milestoneId],
        maxFeePerGas: 1000000000n,
        maxPriorityFeePerGas: 100000000n,
      },
      { onSuccess: () => refetch() }
    );

  return (
    <div className="bg-stone-800/60 border border-orange-900/40 rounded-2xl overflow-hidden shadow-xl">
      <div className="bg-orange-950/60 border-b border-orange-900/40 px-6 py-4 flex justify-between items-start">
        <div>
          <p className="text-xs text-orange-500 uppercase tracking-wider font-semibold">
            Milestone #{milestoneId.toString()}
          </p>
          <p className="text-lg font-semibold text-stone-100 mt-0.5">{description}</p>
        </div>
        <span className="text-xs bg-stone-700 text-stone-200 px-3 py-1 rounded-full font-medium">
          {stateLabel}
        </span>
      </div>

      <div className="px-6 py-5 grid sm:grid-cols-2 gap-4 border-b border-stone-700">
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-wider font-medium">Your Payout</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{formatEther(amount)} ETH</p>
          <p className="text-xs text-emerald-600 mt-0.5">100% — Zero platform cut</p>
        </div>
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-wider font-medium">Auto-Release Countdown</p>
          <p className="text-sm mt-1">
            <CountdownTimer deadline={Number(deadline)} />
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-stone-500 uppercase tracking-wider font-medium">Client Address</p>
          <p className="font-mono text-xs text-stone-400 mt-1">{client}</p>
        </div>
      </div>

      {!address && <div className="px-6 py-4 text-stone-500 text-sm">Connect wallet to take actions.</div>}
      {address && !isFreelancer && (
        <div className="px-6 py-4 text-amber-500/80 text-sm bg-amber-950/20 border-t border-amber-900/30">
          Notice: Your connected wallet ({address.slice(0, 6)}…{address.slice(-4)}) is not the designated freelancer for this milestone.
        </div>
      )}
      {isFreelancer && (
        <div className="px-6 py-5 space-y-3">
          <button
            onClick={submit}
            disabled={!isLocked || isPending}
            className="btn-freelancer w-full flex items-center justify-center gap-2 h-11 text-sm font-bold"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit Work Deliverable
          </button>
          <p className="text-xs text-stone-500">Call submitWork on Arbitrum Sepolia to begin client review.</p>

          <button
            onClick={autoRelease}
            disabled={!(isSubmitted && deadlinePassed) || isPending}
            className="btn-success w-full flex items-center justify-center gap-2 h-11 text-sm font-bold"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Claim Auto-Release (Ghosting Protection)
          </button>
          <p className="text-xs text-stone-500">Available if client does not approve submitted work before the deadline.</p>
        </div>
      )}
      {state === 4 && (
        <div className="px-6 py-4 bg-emerald-950/20">
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="h-4 w-4" /> This milestone is completed and funds have been released to the freelancer.
          </div>
        </div>
      )}
    </div>
  );
}

export default function FreelancerPage() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [activeTab, setActiveTab] = useState<"available" | "applications" | "deliver" | "profile">("available");

  // Milestone Lookup State
  const [inputId, setInputId] = useState("");
  const [activeId, setActiveId] = useState<bigint | null>(null);
  const [error, setError] = useState("");

  // Freelancer Profile & Notification State
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [pushStatus, setPushStatus] = useState<PushStatusState>("checking");
  const [pushErrorMessage, setPushErrorMessage] = useState<string>("");
  const [pushToggling, setPushToggling] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // Applications list
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Available jobs preview
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  // Function to refresh push status accurately
  const refreshPushStatus = async (userAddress?: string) => {
    try {
      const res = await getDetailedPushStatus(userAddress);
      setPushStatus(res.status);
      if (res.errorMessage) {
        setPushErrorMessage(res.errorMessage);
      } else {
        setPushErrorMessage("");
      }
    } catch {
      setPushStatus("error");
      setPushErrorMessage("Failed to check push notification status.");
    }
  };

  useEffect(() => {
    // Initial check on mount
    refreshPushStatus(address);

    // Load recent available jobs
    fetch("/api/jobs?status=open")
      .then((res) => res.json())
      .then((data) => setRecentJobs((data.jobs || []).slice(0, 5)))
      .catch(() => {});
  }, []);

  // Sync push status and profile whenever address changes
  useEffect(() => {
    if (!address) {
      refreshPushStatus();
      return;
    }

    refreshPushStatus(address);

    fetch(`/api/freelancers/profile?address=${address.toLowerCase()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setName(data.profile.name || "");
          setBio(data.profile.bio || "");
          setSkills((data.profile.skills || []).join(", "));
          setHourlyRate(data.profile.hourly_rate || "");
        }
      })
      .catch(() => {});
  }, [address]);

  const lookup = () => {
    const n = parseInt(inputId);
    if (!inputId || isNaN(n) || n < 1) {
      setError("Please enter a valid milestone ID (e.g. 1)");
      return;
    }
    setError("");
    setActiveId(BigInt(n));
  };

  // Push notification toggle handler
  const handleTogglePush = async () => {
    if (!address) {
      alert("Please connect your wallet first.");
      return;
    }

    setPushToggling(true);
    setPushErrorMessage("");

    try {
      if (pushStatus === "enabled") {
        const res = await unsubscribeFromPush(address);
        if (res.success) {
          setPushStatus("disabled");
        } else {
          setPushErrorMessage("Failed to remove push subscription on server.");
        }
      } else {
        const res = await subscribeToPush(address);
        if (res.success) {
          setPushStatus("enabled");
        } else {
          setPushStatus(Notification.permission === "denied" ? "denied" : "error");
          setPushErrorMessage(res.error || "Could not enable push notifications.");
        }
      }
    } catch (err: any) {
      setPushStatus("error");
      setPushErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setPushToggling(false);
    }
  };

  // Save profile handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    setProfileSaving(true);
    setProfileMessage("");

    try {
      const token = await getOrRequestAuthToken(address, signMessageAsync);
      if (!token) throw new Error("Could not verify wallet signature.");

      const skillsArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/freelancers/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          bio,
          skills: skillsArray,
          hourly_rate: hourlyRate,
          notify_push: pushStatus === "enabled",
          notify_in_app: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to save profile");
      setProfileMessage("Profile and notification preferences saved successfully!");
    } catch (err: any) {
      setProfileMessage(err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200">
      {/* Header */}
      <div className="bg-orange-950/40 border-b border-orange-900/40 px-4 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" /> Freelancer Command Center
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-100">Freelancer Portal</h1>
            <p className="text-stone-400 text-sm mt-1 max-w-xl">
              Browse work opportunities, track your applications, deliver work with automated ghosting protection, and manage browser push alerts.
            </p>
          </div>

          {/* Web Push Notification Indicator */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 flex items-center justify-between gap-4 min-w-[270px]">
            <div className="flex items-center gap-2.5">
              {pushStatus === "enabled" ? (
                <div className="p-2 bg-emerald-500/15 rounded-lg text-emerald-400 border border-emerald-500/30">
                  <Bell className="h-4 w-4" />
                </div>
              ) : pushStatus === "checking" ? (
                <div className="p-2 bg-stone-800 rounded-lg text-stone-400 border border-stone-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : pushStatus === "denied" ? (
                <div className="p-2 bg-red-950/40 rounded-lg text-red-400 border border-red-800/50">
                  <BellOff className="h-4 w-4" />
                </div>
              ) : pushStatus === "error" ? (
                <div className="p-2 bg-amber-950/40 rounded-lg text-amber-400 border border-amber-800/50">
                  <AlertCircle className="h-4 w-4" />
                </div>
              ) : (
                <div className="p-2 bg-stone-800 rounded-lg text-stone-500 border border-stone-700">
                  <BellOff className="h-4 w-4" />
                </div>
              )}
              <div>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">Job Push Alerts</span>
                <span
                  className={`text-xs font-bold ${
                    pushStatus === "enabled"
                      ? "text-emerald-400"
                      : pushStatus === "denied"
                      ? "text-red-400"
                      : pushStatus === "setup_required"
                      ? "text-amber-400"
                      : pushStatus === "error"
                      ? "text-rose-400"
                      : pushStatus === "checking"
                      ? "text-stone-400"
                      : "text-stone-400"
                  }`}
                >
                  {pushStatus === "enabled" && "Enabled"}
                  {pushStatus === "disabled" && "Disabled"}
                  {pushStatus === "denied" && "Permission denied"}
                  {pushStatus === "setup_required" && "Setup required"}
                  {pushStatus === "error" && "Error"}
                  {pushStatus === "checking" && "Checking…"}
                </span>
                {pushErrorMessage && (
                  <span className="text-[10px] text-stone-400 block max-w-[150px] truncate" title={pushErrorMessage}>
                    {pushErrorMessage}
                  </span>
                )}
              </div>
            </div>

            {pushStatus === "denied" ? (
              <span className="text-[11px] text-stone-500 italic max-w-[90px] text-right" title="Unblock in your browser address bar site settings">
                Unblock in browser
              </span>
            ) : pushStatus === "setup_required" ? (
              <button
                onClick={() => refreshPushStatus(address)}
                className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
              >
                Retry
              </button>
            ) : (
              <button
                onClick={handleTogglePush}
                disabled={pushToggling || pushStatus === "checking" || !address}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  pushStatus === "enabled"
                    ? "bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
                    : "bg-orange-600 hover:bg-orange-500 text-stone-100 disabled:opacity-50"
                }`}
              >
                {pushToggling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : pushStatus === "enabled" ? (
                  "Disable"
                ) : pushStatus === "error" ? (
                  "Retry"
                ) : (
                  "Enable"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-5xl mx-auto mt-8 flex flex-wrap gap-2 border-b border-stone-800 pb-px">
          <button
            onClick={() => setActiveTab("available")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all ${
              activeTab === "available"
                ? "bg-stone-900 text-orange-400 border-t-2 border-orange-500 border-x border-stone-800"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
            }`}
          >
            <Sparkles className="h-4 w-4" /> Open Opportunities
          </button>
          <button
            onClick={() => setActiveTab("deliver")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all ${
              activeTab === "deliver"
                ? "bg-stone-900 text-orange-400 border-t-2 border-orange-500 border-x border-stone-800"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
            }`}
          >
            <Send className="h-4 w-4" /> Deliver Work &amp; Escrow
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all ${
              activeTab === "profile"
                ? "bg-stone-900 text-orange-400 border-t-2 border-orange-500 border-x border-stone-800"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
            }`}
          >
            <User className="h-4 w-4" /> Profile &amp; Preferences
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ── TAB 1: AVAILABLE WORK PREVIEW & MARKETPLACE LINK ── */}
        {activeTab === "available" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-stone-100">Recent Marketplace Postings</h2>
                <p className="text-xs text-stone-400 mt-0.5">Explore open work opportunities with locked escrow budgets.</p>
              </div>
              <Link href="/jobs" className="btn-freelancer text-xs px-4 py-2 flex items-center gap-1.5 font-bold">
                View All Available Jobs <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentJobs.length === 0 ? (
              <div className="p-12 text-center bg-stone-900 border border-stone-800 rounded-2xl">
                <Briefcase className="h-10 w-10 text-stone-600 mx-auto mb-3" />
                <p className="text-stone-400 text-sm">No open jobs found right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-stone-900 border border-stone-800 hover:border-orange-500/40 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                          {job.status}
                        </span>
                        <span className="text-xs text-stone-500">#{job.id}</span>
                      </div>
                      <Link href={`/jobs/${job.id}`}>
                        <h3 className="text-base font-bold text-stone-100 hover:text-orange-400 transition-colors">
                          {job.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-stone-400 line-clamp-1">{job.description}</p>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-xs text-stone-500 block">Payout</span>
                        <span className="text-lg font-bold text-emerald-400">{job.budget} ETH</span>
                      </div>
                      <Link href={`/jobs/${job.id}`} className="btn-freelancer text-xs px-3.5 py-1.5 font-bold">
                        Apply
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: DELIVER WORK & MILESTONE LOOKUP ── */}
        {activeTab === "deliver" && (
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-6">
              <h2 className="text-base font-bold text-orange-400">Milestone Deliverable Flow</h2>
              {[
                { icon: Search, title: "Enter Milestone ID", body: "Paste the ID created on Arbitrum Sepolia by your client." },
                { icon: DollarSign, title: "Verify Locked Payout", body: "Check the locked funds and deadline before starting." },
                { icon: Send, title: "Submit Work", body: "Call submitWork on-chain when your deliverable is ready." },
                { icon: Shield, title: "Ghosting Protection", body: "If client is inactive after deadline, trigger auto-release for 100% payout." },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="mt-0.5 flex-shrink-0 bg-orange-600/10 border border-orange-600/20 p-2 rounded-lg h-fit">
                      <Icon className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-stone-200 text-sm">{s.title}</p>
                      <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">{s.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="md:col-span-3 space-y-5">
              <div className="bg-stone-800/60 border border-orange-900/40 rounded-2xl p-6">
                <h3 className="font-bold text-orange-400 text-base mb-1">Look Up Milestone</h3>
                <p className="text-xs text-stone-500 mb-4">Enter the on-chain milestone counter ID</p>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={inputId}
                    onChange={(e) => setInputId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && lookup()}
                    placeholder="e.g. 1"
                    className="input flex-1 font-mono text-sm"
                    min="1"
                  />
                  <button onClick={lookup} className="btn-freelancer px-6 flex items-center gap-2 text-sm font-bold">
                    <Search className="h-4 w-4" /> View
                  </button>
                </div>
                {error && (
                  <div className="flex items-center gap-2 mt-3 text-red-300 text-xs">
                    <AlertCircle className="h-4 w-4" /> {error}
                  </div>
                )}
              </div>

              {activeId !== null && <MilestoneView milestoneId={activeId} />}
            </div>
          </div>
        )}

        {/* ── TAB 3: PROFILE & NOTIFICATION PREFERENCES ── */}
        {activeTab === "profile" && (
          <div className="max-w-2xl mx-auto bg-stone-800/60 border border-stone-800 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-stone-100 mb-1">Freelancer Identity &amp; Preferences</h2>
            <p className="text-xs text-stone-500 mb-6">
              Your profile is verified with your MetaMask wallet signature. No arbitrary wallet spoofing is permitted.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="label block mb-1 text-xs uppercase tracking-wider">Display Name or Handle</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Satoshi Dev"
                  className="input w-full text-sm"
                  required
                />
              </div>

              <div>
                <label className="label block mb-1 text-xs uppercase tracking-wider">Bio &amp; Technical Focus</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Senior Smart Contract Auditor & Full-Stack Web3 Developer with 5 years experience..."
                  rows={3}
                  className="input w-full resize-none text-sm"
                />
              </div>

              <div>
                <label className="label block mb-1 text-xs uppercase tracking-wider">Skills Tags (comma separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Solidity, React, Next.js, Security, Hardhat"
                  className="input w-full text-sm"
                />
              </div>

              <div>
                <label className="label block mb-1 text-xs uppercase tracking-wider">Hourly / Base Rate Estimate</label>
                <input
                  type="text"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="e.g. 0.05 ETH/hr"
                  className="input w-full text-sm"
                />
              </div>

              {/* Web Push Subscription Control */}
              <div className="bg-stone-900 p-4 rounded-xl border border-stone-700/70 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-stone-200 block">Web Push Notifications</span>
                  <span className="text-[11px] text-stone-400">
                    Receive instant push alerts on new client work matching your skills.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePush}
                  disabled={pushToggling || pushStatus === "checking" || !address || pushStatus === "denied"}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    pushStatus === "enabled"
                      ? "bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-700"
                      : "bg-orange-600 text-stone-100 hover:bg-orange-500 disabled:opacity-50"
                  }`}
                >
                  {pushToggling ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : pushStatus === "enabled" ? (
                    "Unsubscribe"
                  ) : (
                    "Opt In to Push"
                  )}
                </button>
              </div>

              {profileMessage && (
                <div className="p-3 bg-stone-900 border border-stone-700 rounded-lg text-xs text-amber-400">
                  {profileMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={profileSaving || !address}
                className="btn-freelancer w-full h-11 flex items-center justify-center gap-2 text-sm font-bold mt-2"
              >
                {profileSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying Signature &amp; Saving…
                  </>
                ) : (
                  "Save Profile & Preferences"
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
