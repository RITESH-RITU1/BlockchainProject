import webpush from "web-push";
import { db } from "./db";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@clearescrow.local";

let vapidConfigured = false;

function ensureVapidConfig() {
  if (vapidConfigured) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("VAPID keys not configured in environment. Web Push delivery disabled.");
    return false;
  }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
    return true;
  } catch (err) {
    console.error("Failed to configure VAPID:", err);
    return false;
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushNotificationPayload
): Promise<boolean> {
  if (!ensureVapidConfig()) return false;

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const payloadString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/",
    icon: payload.icon || "/icon-192.png",
    data: payload.data || {},
  });

  try {
    await webpush.sendNotification(pushSubscription, payloadString);
    return true;
  } catch (err: any) {
    // 404 or 410 indicates the subscription has expired or unsubscribed
    if (err.statusCode === 404 || err.statusCode === 410) {
      db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(subscription.endpoint);
    } else {
      console.error(`Error sending push notification to ${subscription.endpoint.slice(0, 30)}...:`, err.message);
    }
    return false;
  }
}

export async function notifyFreelancersOfNewJob(job: {
  id: number;
  title: string;
  description: string;
  budget: number;
  currency: string;
  skills: string[];
}): Promise<{ notifiedCount: number }> {
  // Query registered freelancers who have enabled push notifications
  const query = `
    SELECT ps.endpoint, ps.p256dh, ps.auth
    FROM push_subscriptions ps
    JOIN freelancers f ON LOWER(f.address) = LOWER(ps.address)
    WHERE f.notify_push = 1
  `;
  const subscriptions = db.prepare(query).all() as Array<{ endpoint: string; p256dh: string; auth: string }>;

  const payload: PushNotificationPayload = {
    title: "New Freelance Opportunity",
    body: `${job.title} — Budget: ${job.budget} ${job.currency}`,
    url: `/jobs/${job.id}`,
    data: { jobId: job.id },
  };

  let count = 0;
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const sent = await sendPushNotification(sub, payload);
      if (sent) count++;
    })
  );

  return { notifiedCount: count };
}

export async function notifyUserPush(
  address: string,
  payload: PushNotificationPayload
): Promise<boolean> {
  const normalizedAddress = address.toLowerCase();
  const subs = db
    .prepare("SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE LOWER(address) = ?")
    .all(normalizedAddress) as Array<{ endpoint: string; p256dh: string; auth: string }>;

  if (subs.length === 0) return false;

  let anySent = false;
  await Promise.allSettled(
    subs.map(async (sub) => {
      const sent = await sendPushNotification(sub, payload);
      if (sent) anySent = true;
    })
  );

  return anySent;
}
