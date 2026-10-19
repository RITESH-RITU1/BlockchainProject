import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobId = parseInt(id);

  if (isNaN(jobId)) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  const jobRow = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId) as any;
  if (!jobRow) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const authUser = getAuthenticatedUser(req);
  const isOwner = authUser && authUser.address === jobRow.client_address.toLowerCase();

  const job = {
    id: jobRow.id,
    client_address: jobRow.client_address,
    title: jobRow.title,
    description: jobRow.description,
    skills: JSON.parse(jobRow.skills || "[]"),
    budget: jobRow.budget,
    currency: jobRow.currency || "ETH",
    application_deadline: jobRow.application_deadline,
    completion_deadline: jobRow.completion_deadline,
    milestones: jobRow.milestones_json ? JSON.parse(jobRow.milestones_json) : [],
    status: jobRow.status,
    selected_freelancer_address: jobRow.selected_freelancer_address,
    escrow_milestone_id: jobRow.escrow_milestone_id,
    created_at: jobRow.created_at,
    updated_at: jobRow.updated_at,
  };

  // If the requester is the job's client, provide all applications and freelancer profile details
  let applications: any[] = [];
  if (isOwner) {
    const appRows = db.prepare(`
      SELECT a.*, f.name as freelancer_name, f.bio as freelancer_bio, f.skills as freelancer_skills
      FROM applications a
      LEFT JOIN freelancers f ON LOWER(f.address) = LOWER(a.freelancer_address)
      WHERE a.job_id = ?
      ORDER BY a.created_at DESC
    `).all(jobId) as any[];

    applications = appRows.map((a) => ({
      id: a.id,
      freelancer_address: a.freelancer_address,
      freelancer_name: a.freelancer_name || "Anonymous Freelancer",
      freelancer_bio: a.freelancer_bio || "",
      freelancer_skills: a.freelancer_skills ? JSON.parse(a.freelancer_skills) : [],
      proposal: a.proposal,
      bid_amount: a.bid_amount,
      estimated_days: a.estimated_days,
      status: a.status,
      created_at: a.created_at,
      updated_at: a.updated_at,
    }));
  }

  // If the requester is an applicant freelancer, return their personal application status
  let userApplication: any = null;
  if (authUser && !isOwner) {
    const userApp = db.prepare(`
      SELECT * FROM applications WHERE job_id = ? AND LOWER(freelancer_address) = ?
    `).get(jobId, authUser.address) as any;

    if (userApp) {
      userApplication = {
        id: userApp.id,
        proposal: userApp.proposal,
        bid_amount: userApp.bid_amount,
        estimated_days: userApp.estimated_days,
        status: userApp.status,
        created_at: userApp.created_at,
      };
    }
  }

  return NextResponse.json({
    job,
    isOwner,
    applications: isOwner ? applications : undefined,
    userApplication,
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const jobId = parseInt(id);
  const jobRow = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId) as any;

  if (!jobRow) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (jobRow.client_address.toLowerCase() !== authUser.address) {
    return NextResponse.json(
      { error: "Forbidden: You are not the owner of this job posting" },
      { status: 403 }
    );
  }

  if (jobRow.status === "assigned" || jobRow.status === "completed") {
    return NextResponse.json(
      { error: "Cannot delete a job that has already been assigned or completed" },
      { status: 400 }
    );
  }

  db.prepare("UPDATE jobs SET status = 'cancelled', updated_at = ? WHERE id = ?").run(
    Date.now(),
    jobId
  );

  return NextResponse.json({ success: true, message: "Job cancelled successfully" });
}
