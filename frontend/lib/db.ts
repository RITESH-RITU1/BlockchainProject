import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

// Global database singleton to prevent multiple open handles during Next.js hot reloading
declare global {
  // eslint-disable-next-line no-var
  var __clearescrow_db: DatabaseSync | undefined;
}

function getDatabase(): DatabaseSync {
  if (global.__clearescrow_db) {
    return global.__clearescrow_db;
  }

  // Ensure data directory exists inside frontend
  const dataDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "marketplace.db");
  const db = new DatabaseSync(dbPath);

  // Enable WAL mode for high performance concurrent access and enforce foreign keys
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  // Initialize schema
  db.exec(`
    -- Registered Freelancer Profiles
    CREATE TABLE IF NOT EXISTS freelancers (
      address TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      bio TEXT,
      skills TEXT NOT NULL, -- JSON array of strings
      hourly_rate TEXT,
      notify_push INTEGER DEFAULT 1,
      notify_in_app INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Marketplace Job Postings
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_address TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      skills TEXT NOT NULL, -- JSON array of strings
      budget REAL NOT NULL,
      currency TEXT DEFAULT 'ETH',
      application_deadline INTEGER NOT NULL,
      completion_deadline INTEGER NOT NULL,
      milestones_json TEXT, -- Optional JSON breakdown
      status TEXT DEFAULT 'open', -- 'open', 'assigned', 'completed', 'cancelled'
      selected_freelancer_address TEXT,
      escrow_milestone_id INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Job Applications
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      freelancer_address TEXT NOT NULL,
      proposal TEXT NOT NULL,
      bid_amount REAL NOT NULL,
      estimated_days INTEGER NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(job_id, freelancer_address)
    );

    -- Web Push Subscriptions
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL,
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    -- Persistent In-App Notifications
    CREATE TABLE IF NOT EXISTS in_app_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_address TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT NOT NULL,
      type TEXT NOT NULL, -- 'new_job', 'app_received', 'app_accepted', 'app_rejected', 'escrow_update'
      is_read INTEGER DEFAULT 0,
      idempotency_key TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL
    );

    -- Authentication Nonces for Wallet Verification
    CREATE TABLE IF NOT EXISTS auth_nonces (
      address TEXT PRIMARY KEY,
      nonce TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);

  global.__clearescrow_db = db;
  return db;
}

export const db = getDatabase();
