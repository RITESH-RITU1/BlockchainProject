import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { notifyFreelancersOfNewJob } from "@/lib/push";
import { createInAppNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const client = searchParams.get("client");
  const skill = searchParams.get("skill");
  const query = searchParams.get("q");

  let sql = `
    SELECT j.*, 
      (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
    FROM jobs j
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== "all") {
    sql += " AND j.status = ?";
    params.push(status);
  }

  if (client) {
    sql += " AND LOWER(j.client_address) = ?";
    params.push(client.toLowerCase());
  }

  if (skill) {
    sql += " AND j.skills LIKE ?";
    params.push(`%"${skill}"%`);
  }

  if (query) {
    sql += " AND (j.title LIKE ? OR j.description LIKE ?)";
    const wildcard = `%${query}%`;
    params.push(wildcard, wildcard);
  }

  sql += " ORDER BY j.created_at DESC";

  const rows = db.prepare(sql).all(...params) as any[];

  const jobs = rows.map((r) => ({
    id: r.id,
    client_address: r.client_address,
    title: r.title,
    description: r.description,
    skills: JSON.parse(r.skills || "[]"),
    budget: r.budget,
    currency: r.currency || "ETH",
    application_deadline: r.application_deadline,
    completion_deadline: r.completion_deadline,
    milestones: r.milestones_json ? JSON.parse(r.milestones_json) : [],
    status: r.status,
    selected_freelancer_address: r.selected_freelancer_address,
    escrow_milestone_id: r.escrow_milestone_id,
    application_count: Number(r.application_count || 0),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
  const authUser = getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json(
      { error: "Unauthorized: Wallet signature authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      skills,
      budget,
      currency = "ETH",
      application_deadline,
      completion_deadline,
      milestones = [],
    } = body;

    // Strict validation
    if (!title || typeof title !== "string" || title.trim().length < 5) {
      return NextResponse.json(
        { error: "Job title must be at least 5 characters long." },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || description.trim().length < 15) {
      return NextResponse.json(
        { error: "Job description must be at least 15 characters long." },
        { status: 400 }
      );
    }

    const numBudget = Number(budget);
    if (isNaN(numBudget) || numBudget <= 0) {
      return NextResponse.json(
        { error: "Budget must be a positive number." },
        { status: 400 }
      );
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const appDeadlineSec = Number(application_deadline);
    const compDeadlineSec = Number(completion_deadline);

    if (isNaN(appDeadlineSec) || appDeadlineSec <= nowSec) {
      return NextResponse.json(
        { error: "Application deadline must be a future timestamp." },
        { status: 400 }
      );
    }

    if (isNaN(compDeadlineSec) || compDeadlineSec < appDeadlineSec) {
      return NextResponse.json(
        { error: "Completion deadline must be greater than or equal to the application deadline." },
        { status: 400 }
      );
    }

    const skillsArray = Array.isArray(skills)
      ? skills.map((s: string) => String(s).trim()).filter(Boolean)
      : [];

    const now = Date.now();

    // 1. Commit successfully to persistent server storage FIRST
    const insertStmt = db.prepare(`
      INSERT INTO jobs (
        client_address, title, description, skills, budget, currency,
        application_deadline, completion_deadline, milestones_json,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
    `);

    const result = insertStmt.run(
      authUser.address,
      title.trim(),
      description.trim(),
      JSON.stringify(skillsArray),
      numBudget,
      currency,
      appDeadlineSec,
      compDeadlineSec,
      JSON.stringify(milestones),
      now,
      now
    );

    const jobId = Number(result.lastInsertRowid);

    const createdJob = {
      id: jobId,
      client_address: authUser.address,
      title: title.trim(),
      description: description.trim(),
      skills: skillsArray,
      budget: numBudget,
      currency,
      application_deadline: appDeadlineSec,
      completion_deadline: compDeadlineSec,
      milestones,
      status: "open",
      created_at: now,
      updated_at: now,
    };

    // 2. Distribute Push Notifications to opted-in registered freelancers
    // Non-blocking so notification failure never fails the job creation
    notifyFreelancersOfNewJob(createdJob).catch((err) => {
      console.error("Push dispatch error for job", jobId, err);
    });

    // 3. Create persistent In-App Notifications for registered freelancers
    const freelancers = db.prepare("SELECT address FROM freelancers WHERE notify_in_app = 1").all() as any[];
    for (const fl of freelancers) {
      if (fl.address.toLowerCase() !== authUser.address) {
        createInAppNotification({
          recipientAddress: fl.address,
          title: "New Job Opportunity",
          message: `${createdJob.title} (${numBudget} ${currency})`,
          link: `/jobs/${jobId}`,
          type: "new_job",
          idempotencyKey: `new_job_${jobId}_${fl.address.toLowerCase()}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      job: createdJob,
    });
  } catch (err: any) {
    console.error("Error creating job:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create job posting" },
      { status: 500 }
    );
  }
}
