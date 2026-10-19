"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useSignMessage } from "wagmi";
import { getOrRequestAuthToken } from "@/lib/authClient";
import {
  Briefcase,
  DollarSign,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Send,
  Loader2,
  User,
  ShieldCheck,
  Tag,
  Award,
} from "lucide-react";

interface JobDetail {
  id: number;
  client_address: string;
  title: string;
  description: string;
  skills: string[];
  budget: number;
  currency: string;
  application_deadline: number;
  completion_deadline: number;
  milestones: any[];
  status: string;
  selected_freelancer_address?: string;
  escrow_milestone_id?: number;
  created_at: number;
}

interface Application {
  id: number;
  freelancer_address: string;
  freelancer_name: string;
  freelancer_bio: string;
  freelancer_skills: string[];
  proposal: string;
  bid_amount: number;
  estimated_days: number;
  status: "pending" | "accepted" | "rejected";
  created_at: number;
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const jobId = parseInt(id);

  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [userApp, setUserApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Application form states
  const [proposal, setProposal] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("5");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Client candidate selection state
  const [selectingId, setSelectingId] = useState<number | null>(null);

  const fetchJobDetails = async () => {
    try {
      let headers: HeadersInit = {};
      if (address) {
        const cacheKey = `clearescrow_token_${address.toLowerCase()}`;
        const cachedToken = typeof window !== "undefined" ? sessionStorage.getItem(cacheKey) : null;
        if (cachedToken) {
          headers = { Authorization: `Bearer ${cachedToken}` };
        }
      }

      const res = await fetch(`/api/jobs/${jobId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setJob(data.job);
        setIsOwner(Boolean(data.isOwner));
        setApplications(data.applications || []);
        setUserApp(data.userApplication || null);
        if (data.job?.budget && !bidAmount) {
          setBidAmount(String(data.job.budget));
        }
      }
    } catch (err) {
      console.error("Error loading job:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [jobId, address]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setFormError("Please connect your MetaMask wallet first.");
      return;
    }

    if (!proposal.trim() || proposal.trim().length < 10) {
      setFormError("Please provide a proposal with at least 10 characters.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      // 1. Ensure user has a verified authentication session
      const token = await getOrRequestAuthToken(address, signMessageAsync);
      if (!token) throw new Error("Could not authenticate wallet signature.");

      // 2. Submit application proposal
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proposal: proposal.trim(),
          bid_amount: Number(bidAmount),
          estimated_days: parseInt(estimatedDays),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application.");
      }

      setFormSuccess("Application submitted successfully!");
      setUserApp({
        proposal,
        bid_amount: Number(bidAmount),
        estimated_days: parseInt(estimatedDays),
        status: "pending",
      });
      fetchJobDetails();
    } catch (err: any) {
      setFormError(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectFreelancer = async (applicationId: number) => {
    if (!address) return;
    setSelectingId(applicationId);

    try {
      const token = await getOrRequestAuthToken(address, signMessageAsync);
      if (!token) throw new Error("Could not authenticate wallet signature.");

      const res = await fetch(`/api/jobs/${jobId}/select`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ applicationId }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to select freelancer.");
      } else {
        alert("Candidate selected! You can now proceed to fund the milestone escrow.");
        fetchJobDetails();
      }
    } catch (err: any) {
      alert(err.message || "Error selecting candidate.");
    } finally {
      setSelectingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-200 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-200 p-8 max-w-xl mx-auto text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
        <p className="text-stone-400 text-sm mb-6">This job posting may have been removed or does not exist.</p>
        <Link href="/jobs" className="btn-client inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </Link>
      </div>
    );
  }

  const isClosed = job.status !== "open";
  const deadlinePassed = Math.floor(Date.now() / 1000) > job.application_deadline;

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Available Work
          </Link>
        </div>

        {/* Job Header Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                    job.status === "open"
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                      : "bg-stone-800 text-stone-400"
                  }`}
                >
                  Status: {job.status}
                </span>
                <span className="text-xs text-stone-500">Job #{job.id}</span>
              </div>
              <h1 className="text-3xl font-extrabold text-stone-100">{job.title}</h1>
              <p className="text-xs text-stone-500 mt-1">
                Client Address:{" "}
                <span className="font-mono text-stone-400">{job.client_address}</span>
              </p>
            </div>

            {/* Economics Highlight */}
            <div className="bg-stone-800/80 border border-stone-700/80 rounded-xl p-4 text-left sm:text-right min-w-[200px]">
              <span className="text-xs text-stone-400 block font-medium">Budget (Escrow Locked)</span>
              <span className="text-3xl font-bold text-emerald-400">
                {job.budget} <span className="text-base text-emerald-500">{job.currency}</span>
              </span>
              <span className="text-[11px] text-emerald-600 block mt-0.5">0% Platform Fee · 100% Payout</span>
            </div>
          </div>

          {/* Job Description */}
          <div className="border-t border-stone-800 pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-500 mb-2">
              Deliverable Specifications
            </h3>
            <p className="text-stone-300 whitespace-pre-line text-sm sm:text-base leading-relaxed">
              {job.description}
            </p>
          </div>

          {/* Skills Required */}
          {job.skills && job.skills.length > 0 && (
            <div className="border-t border-stone-800 pt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2.5">
                Required Technical Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs bg-stone-800 text-stone-200 border border-stone-700 px-3 py-1 rounded-lg"
                  >
                    <Tag className="h-3 w-3 text-amber-500" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Deadlines */}
          <div className="border-t border-stone-800 pt-5 grid sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2.5 bg-stone-800/40 p-3 rounded-lg border border-stone-800">
              <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-stone-400 font-medium">Application Deadline</p>
                <p className="text-stone-200 font-semibold mt-0.5">
                  {new Date(job.application_deadline * 1000).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-stone-800/40 p-3 rounded-lg border border-stone-800">
              <Calendar className="h-4 w-4 text-orange-400 flex-shrink-0" />
              <div>
                <p className="text-stone-400 font-medium">Expected Completion</p>
                <p className="text-stone-200 font-semibold mt-0.5">
                  {new Date(job.completion_deadline * 1000).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CLIENT OWNER VIEW: REVIEW APPLICANTS ── */}
        {isOwner && (
          <div className="bg-stone-900 border border-amber-900/40 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-amber-400">
                  Applicant Proposals ({applications.length})
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Review competing candidate proposals and select one freelancer to assign this job.
                </p>
              </div>
            </div>

            {applications.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-sm">
                No freelancers have applied for this position yet. Subscribed freelancers have been notified.
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className={`p-5 rounded-xl border transition-all ${
                      app.status === "accepted"
                        ? "bg-amber-950/20 border-amber-500/60"
                        : "bg-stone-800/50 border-stone-700/70"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-100 text-base">{app.freelancer_name}</span>
                          <span className="font-mono text-xs text-stone-400">
                            ({app.freelancer_address.slice(0, 6)}…{app.freelancer_address.slice(-4)})
                          </span>
                        </div>
                        {app.freelancer_bio && (
                          <p className="text-xs text-stone-400 mt-0.5">{app.freelancer_bio}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs text-stone-400 block">Proposed Bid</span>
                          <span className="text-lg font-bold text-emerald-400">
                            {app.bid_amount} {job.currency}
                          </span>
                        </div>
                        <span
                          className={`text-xs uppercase font-bold px-2.5 py-1 rounded-md ${
                            app.status === "accepted"
                              ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700"
                              : app.status === "rejected"
                              ? "bg-red-950/40 text-red-400 border border-red-900"
                              : "bg-stone-700 text-stone-300"
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                    </div>

                    {/* Proposal Text */}
                    <div className="bg-stone-900/80 p-3.5 rounded-lg border border-stone-800 text-sm text-stone-300 leading-relaxed mb-3">
                      <p className="text-xs text-stone-500 uppercase tracking-wider mb-1 font-semibold">Proposal Statement:</p>
                      {app.proposal}
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-400">
                      <span>Turnaround estimate: <strong className="text-stone-200">{app.estimated_days} days</strong></span>

                      {job.status === "open" && app.status === "pending" && (
                        <button
                          onClick={() => handleSelectFreelancer(app.id)}
                          disabled={selectingId === app.id}
                          className="btn-client flex items-center gap-1.5 text-xs px-3.5 py-1.5 font-bold"
                        >
                          {selectingId === app.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3.5 w-3.5" />
                          )}
                          Select Candidate
                        </button>
                      )}

                      {app.status === "accepted" && (
                        <Link
                          href={`/client?prefillAddress=${app.freelancer_address}&prefillAmount=${app.bid_amount}&prefillDesc=${encodeURIComponent(job.title)}`}
                          className="btn-client flex items-center gap-1.5 text-xs px-4 py-1.5 font-bold"
                        >
                          <Award className="h-3.5 w-3.5" /> Fund Escrow for Candidate
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FREELANCER VIEW: APPLICATION FORM OR STATUS ── */}
        {!isOwner && (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8">
            {userApp ? (
              /* Already applied view */
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                  <CheckCircle className="h-5 w-5" /> Your Application Has Been Submitted
                </div>
                <div className="bg-stone-800/60 p-5 rounded-xl border border-stone-700 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-400">Status</span>
                    <span
                      className={`uppercase text-xs font-bold px-2.5 py-1 rounded-md ${
                        userApp.status === "accepted"
                          ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700"
                          : userApp.status === "rejected"
                          ? "bg-red-950/40 text-red-400 border border-red-900"
                          : "bg-amber-950/40 text-amber-300 border border-amber-800"
                      }`}
                    >
                      {userApp.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-400">Your Proposed Bid</span>
                    <span className="font-bold text-stone-100">{userApp.bid_amount} {job.currency}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-stone-400 block mb-1">Your Proposal:</span>
                    <p className="text-stone-300 bg-stone-900 p-3 rounded-lg border border-stone-800 text-xs leading-relaxed">
                      {userApp.proposal}
                    </p>
                  </div>
                </div>
              </div>
            ) : isClosed || deadlinePassed ? (
              /* Closed or expired banner */
              <div className="text-center py-6 text-stone-500 text-sm">
                <Clock className="h-8 w-8 text-stone-600 mx-auto mb-2" />
                This work opportunity is no longer accepting new proposals.
              </div>
            ) : (
              /* Submit Application Form */
              <form onSubmit={handleApply} className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-orange-400 mb-1">Apply for this Opportunity</h3>
                  <p className="text-xs text-stone-500">
                    Submit your proposal message and proposed fee. Duplicate applications are prevented.
                  </p>
                </div>

                <div>
                  <label className="label block mb-1.5 text-xs uppercase tracking-wider">
                    Proposal Statement &amp; Methodology
                  </label>
                  <textarea
                    value={proposal}
                    onChange={(e) => setProposal(e.target.value)}
                    placeholder="Describe how you will deliver this work, your relevant experience with smart contracts / full-stack, and why you are the best fit..."
                    rows={4}
                    className="input w-full resize-none text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label block mb-1.5 text-xs uppercase tracking-wider">
                      Proposed Bid ({job.currency})
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.0001"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="label block mb-1.5 text-xs uppercase tracking-wider">
                      Estimated Turnaround (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={estimatedDays}
                      onChange={(e) => setEstimatedDays(e.target.value)}
                      className="input w-full"
                      required
                    />
                  </div>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 bg-red-950/40 border border-red-900 text-red-300 p-3 rounded-lg text-xs">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800 text-emerald-400 p-3 rounded-lg text-xs">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-freelancer w-full h-12 flex items-center justify-center gap-2 text-sm font-bold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting &amp; Verifying Signature…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Submit Proposal
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
