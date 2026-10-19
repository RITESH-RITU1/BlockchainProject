import { db } from "./db";

export interface InAppNotification {
  id: number;
  recipient_address: string;
  title: string;
  message: string;
  link: string;
  type: string;
  is_read: number;
  idempotency_key: string;
  created_at: number;
}

export function createInAppNotification(params: {
  recipientAddress: string;
  title: string;
  message: string;
  link: string;
  type: "new_job" | "app_received" | "app_accepted" | "app_rejected" | "escrow_update";
  idempotencyKey: string;
}): boolean {
  const normalizedRecipient = params.recipientAddress.toLowerCase();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO in_app_notifications (
        recipient_address, title, message, link, type, idempotency_key, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `);
    const result = stmt.run(
      normalizedRecipient,
      params.title,
      params.message,
      params.link,
      params.type,
      params.idempotencyKey,
      now
    );
    return Number(result.changes) > 0;
  } catch (err) {
    console.error("Error creating in-app notification:", err);
    return false;
  }
}

export function getUserNotifications(address: string, limit = 50): InAppNotification[] {
  const normalizedAddress = address.toLowerCase();
  const stmt = db.prepare(`
    SELECT * FROM in_app_notifications
    WHERE LOWER(recipient_address) = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(normalizedAddress, limit) as InAppNotification[];
}

export function getUnreadNotificationCount(address: string): number {
  const normalizedAddress = address.toLowerCase();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM in_app_notifications
    WHERE LOWER(recipient_address) = ? AND is_read = 0
  `);
  const row = stmt.get(normalizedAddress) as { count: number } | undefined;
  return row?.count || 0;
}

export function markNotificationsAsRead(address: string, notificationIds?: number[]): void {
  const normalizedAddress = address.toLowerCase();
  if (notificationIds && notificationIds.length > 0) {
    const placeholders = notificationIds.map(() => "?").join(",");
    db.prepare(`
      UPDATE in_app_notifications
      SET is_read = 1
      WHERE LOWER(recipient_address) = ? AND id IN (${placeholders})
    `).run(normalizedAddress, ...notificationIds);
  } else {
    db.prepare(`
      UPDATE in_app_notifications
      SET is_read = 1
      WHERE LOWER(recipient_address) = ?
    `).run(normalizedAddress);
  }
}
