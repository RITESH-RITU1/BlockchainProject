import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { isAddress } from "viem";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address || !isAddress(address)) {
    return NextResponse.json(
      { error: "A valid address parameter is required" },
      { status: 400 }
    );
  }

  const normalizedAddress = address.toLowerCase();
  const row = db
    .prepare("SELECT * FROM freelancers WHERE LOWER(address) = ?")
    .get(normalizedAddress) as any;

  if (!row) {
    return NextResponse.json({ profile: null });
  }

  return NextResponse.json({
    profile: {
      address: row.address,
      name: row.name,
      bio: row.bio,
      skills: JSON.parse(row.skills || "[]"),
      hourly_rate: row.hourly_rate,
      notify_push: Boolean(row.notify_push),
      notify_in_app: Boolean(row.notify_in_app),
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  });
}

export async function POST(req: Request) {
  const authUser = getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json(
      { error: "Unauthorized: Valid wallet authentication signature required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { name, bio, skills, hourly_rate, notify_push, notify_in_app } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Profile name is required" }, { status: 400 });
    }

    const skillsArray = Array.isArray(skills)
      ? skills.map((s: string) => String(s).trim()).filter(Boolean)
      : [];

    const now = Date.now();
    const pushOpt = notify_push !== false ? 1 : 0;
    const inAppOpt = notify_in_app !== false ? 1 : 0;

    const stmt = db.prepare(`
      INSERT INTO freelancers (
        address, name, bio, skills, hourly_rate, notify_push, notify_in_app, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(address) DO UPDATE SET
        name = excluded.name,
        bio = excluded.bio,
        skills = excluded.skills,
        hourly_rate = excluded.hourly_rate,
        notify_push = excluded.notify_push,
        notify_in_app = excluded.notify_in_app,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      authUser.address,
      name.trim(),
      bio ? String(bio).trim() : "",
      JSON.stringify(skillsArray),
      hourly_rate ? String(hourly_rate).trim() : "",
      pushOpt,
      inAppOpt,
      now,
      now
    );

    return NextResponse.json({
      success: true,
      profile: {
        address: authUser.address,
        name: name.trim(),
        bio: bio ? String(bio).trim() : "",
        skills: skillsArray,
        hourly_rate: hourly_rate ? String(hourly_rate).trim() : "",
        notify_push: Boolean(pushOpt),
        notify_in_app: Boolean(inAppOpt),
        updated_at: now,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
