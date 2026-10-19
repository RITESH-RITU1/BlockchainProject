import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationsAsRead,
} from "@/lib/notifications";
import { isAddress } from "viem";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paramAddress = searchParams.get("address");
  const authUser = getAuthenticatedUser(req);

  const targetAddress = authUser?.address || (paramAddress && isAddress(paramAddress) ? paramAddress.toLowerCase() : null);

  if (!targetAddress) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  const notifications = getUserNotifications(targetAddress);
  const unreadCount = getUnreadNotificationCount(targetAddress);

  return NextResponse.json({
    notifications,
    unreadCount,
  });
}

export async function PATCH(req: Request) {
  const authUser = getAuthenticatedUser(req);
  const body = await req.json().catch(() => ({}));
  const targetAddress = authUser?.address || (body.address && isAddress(body.address) ? body.address.toLowerCase() : null);

  if (!targetAddress) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  const { ids } = body;
  markNotificationsAsRead(targetAddress, Array.isArray(ids) ? ids : undefined);

  return NextResponse.json({ success: true });
}
