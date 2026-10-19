import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { createInAppNotification } from "@/lib/notifications";
import { notifyUserPush } from "@/lib/push";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json(
      { error: "Unauthorized: Wallet authentication signature required" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const jobId = parseInt(id);

  if (isNaN(jobId)) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  try {
    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId) as any;
    if (!job) {
      return NextResponse.json({ error: "Job opportunity not found" }, { status: 404 });
    }

    if (job.status !== "open") {
      return NextResponse.json(
        { error: `This job is ${job.status} and is no longer accepting applications.` },
        { status: 400 }
      );
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec > job.application_deadline) {
      return NextResponse.json(
        { error: "The application deadline for this job has passed." },
        { status: 400 }
      );
    }

    if (job.client_address.toLowerCase() === authUser.address) {
      return NextResponse.json(
        { error: "You cannot apply to your own job posting." },
        { status: 400 }
      );
    }

    // Check for existing application (server-side duplicate check)
    const existing = db
      .prepare("SELECT id FROM applications WHERE job_id = ? AND LOWER(freelancer_address) = ?")
      .get(jobId, authUser.address);

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted an application for this job opportunity." },
        { status: 409 }
      );
    }

    const body = await req.json();
    const { proposal, bid_amount, estimated_days } = body;

    if (!proposal || typeof proposal !== "string" || proposal.trim().length < 10) {
      return NextResponse.json(
        { error: "Your application proposal must be at least 10 characters long." },
        { status: 400 }
      );
    }

    const numBid = Number(bid_amount);
    if (isNaN(numBid) || numBid <= 0) {
      return NextResponse.json(
        { error: "Please provide a valid positive bid amount." },
        { status: 400 }
      );
    }

    const numDays = parseInt(estimated_days);
    if (isNaN(numDays) || numDays < 1) {
      return NextResponse.json(
        { error: "Please provide a valid estimated turnaround time in days (at least 1 day)." },
        { status: 400 }
      );
    }

    const now = Date.now();
    const insertStmt = db.prepare(`
      INSERT INTO applications (
        job_id, freelancer_address, proposal, bid_amount, estimated_days, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `);

    const result = insertStmt.run(
      jobId,
      authUser.address,
      proposal.trim(),
      numBid,
      numDays,
      now,
      now
    );

    const applicationId = Number(result.lastInsertRowid);

    // Notify the client about this application
    createInAppNotification({
      recipientAddress: job.client_address,
      title: "New Job Application",
      message: `A freelancer applied for "${job.title}" with a proposal of ${numBid} ${job.currency}.`,
      link: `/client`,
      type: "app_received",
      idempotencyKey: `app_recv_${applicationId}_${job.client_address.toLowerCase()}`,
    });

    notifyUserPush(job.client_address, {
      title: "New Proposal Received",
      body: `New application for "${job.title}" (${numBid} ${job.currency})`,
      url: `/client`,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      applicationId,
      status: "pending",
      message: "Application submitted successfully!",
    });
  } catch (err: any) {
    if (err.message && err.message.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { error: "Duplicate application: You have already applied to this job." },
        { status: 409 }
      );
    }
    console.error("Error submitting application:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit application" },
      { status: 500 }
    );
  }
}
