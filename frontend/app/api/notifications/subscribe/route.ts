import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAddress } from "viem";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { address, subscription } = body;

    if (!address || !isAddress(address)) {
      return NextResponse.json(
        { error: "A valid wallet address is required to register push subscriptions" },
        { status: 400 }
      );
    }

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json(
        { error: "A valid PushSubscription object with keys is required" },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO push_subscriptions (address, endpoint, p256dh, auth, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        address = excluded.address,
        p256dh = excluded.p256dh,
        auth = excluded.auth
    `);

    stmt.run(
      normalizedAddress,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth,
      now
    );

    // Also ensure freelancer record has notify_push = 1 if exists
    db.prepare("UPDATE freelancers SET notify_push = 1 WHERE LOWER(address) = ?").run(normalizedAddress);

    return NextResponse.json({
      success: true,
      message: "Browser push subscription registered successfully",
    });
  } catch (err: any) {
    console.error("Error registering push subscription:", err);
    return NextResponse.json(
      { error: err.message || "Failed to register push subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { endpoint, address } = body;

    if (endpoint) {
      db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(endpoint);
    } else if (address && isAddress(address)) {
      db.prepare("DELETE FROM push_subscriptions WHERE LOWER(address) = ?").run(address.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      message: "Push subscription removed successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to remove subscription" },
      { status: 500 }
    );
  }
}
