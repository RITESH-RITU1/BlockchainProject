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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    if (job.client_address.toLowerCase() !== authUser.address) {
      return NextResponse.json(
        { error: "Forbidden: Only the job owner can select an applicant" },
        { status: 403 }
      );
    }

    if (job.status !== "open") {
      return NextResponse.json(
        { error: `Job is currently ${job.status} and cannot accept new selections` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
    }

    const targetApp = db
      .prepare("SELECT * FROM applications WHERE id = ? AND job_id = ?")
      .get(applicationId, jobId) as any;

    if (!targetApp) {
      return NextResponse.json(
        { error: "Application not found for this job" },
        { status: 404 }
      );
    }

    const now = Date.now();

    // Perform atomic transaction:
    // 1. Accept target application
    db.prepare("UPDATE applications SET status = 'accepted', updated_at = ? WHERE id = ?").run(
      now,
      targetApp.id
    );

    // 2. Reject all other applications for this job
    db.prepare(`
      UPDATE applications SET status = 'rejected', updated_at = ?
      WHERE job_id = ? AND id != ?
    `).run(now, jobId, targetApp.id);

    // 3. Mark job as assigned and record selected freelancer
    db.prepare(`
      UPDATE jobs SET status = 'assigned', selected_freelancer_address = ?, updated_at = ?
      WHERE id = ?
    `).run(targetApp.freelancer_address, now, jobId);

    // 4. Notify selected freelancer
    createInAppNotification({
      recipientAddress: targetApp.freelancer_address,
      title: "Proposal Accepted! 🎉",
      message: `Your application for "${job.title}" has been accepted! The client will now fund the on-chain milestone escrow.`,
      link: `/freelancer`,
      type: "app_accepted",
      idempotencyKey: `app_acc_${targetApp.id}_${targetApp.freelancer_address.toLowerCase()}`,
    });

    notifyUserPush(targetApp.freelancer_address, {
      title: "Proposal Accepted! 🎉",
      body: `You were selected for "${job.title}"! Payout: ${targetApp.bid_amount} ${job.currency}`,
      url: `/freelancer`,
    }).catch(() => {});

    // 5. Notify other rejected applicants
    const otherApps = db
      .prepare("SELECT freelancer_address, id FROM applications WHERE job_id = ? AND id != ?")
      .all(jobId, targetApp.id) as any[];

    for (const other of otherApps) {
      createInAppNotification({
        recipientAddress: other.freelancer_address,
        title: "Application Status Update",
        message: `Another candidate was selected for "${job.title}". Thank you for your submission.`,
        link: `/freelancer`,
        type: "app_rejected",
        idempotencyKey: `app_rej_${other.id}_${other.freelancer_address.toLowerCase()}`,
      });
    }

    return NextResponse.json({
      success: true,
      selectedFreelancer: targetApp.freelancer_address,
      bidAmount: targetApp.bid_amount,
      message: "Freelancer selected successfully. You can now proceed to fund the escrow milestone.",
    });
  } catch (err: any) {
    console.error("Error selecting freelancer:", err);
    return NextResponse.json(
      { error: err.message || "Failed to select freelancer" },
      { status: 500 }
    );
  }
}
