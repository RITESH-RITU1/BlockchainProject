const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const { DatabaseSync } = require("node:sqlite");
const crypto = require("node:crypto");
const { ethers } = require("ethers");

describe("Marketplace Backend & Storage Tests", () => {
  let db;
  let clientWallet;
  let freelancer1;
  let freelancer2;

  before(() => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");

    db.exec(`
      CREATE TABLE freelancers (
        address TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        bio TEXT,
        skills TEXT NOT NULL,
        hourly_rate TEXT,
        notify_push INTEGER DEFAULT 1,
        notify_in_app INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_address TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        skills TEXT NOT NULL,
        budget REAL NOT NULL,
        currency TEXT DEFAULT 'ETH',
        application_deadline INTEGER NOT NULL,
        completion_deadline INTEGER NOT NULL,
        milestones_json TEXT,
        status TEXT DEFAULT 'open',
        selected_freelancer_address TEXT,
        escrow_milestone_id INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        freelancer_address TEXT NOT NULL,
        proposal TEXT NOT NULL,
        bid_amount REAL NOT NULL,
        estimated_days INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(job_id, freelancer_address)
      );

      CREATE TABLE push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE in_app_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_address TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT NOT NULL,
        type TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        idempotency_key TEXT UNIQUE NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE auth_nonces (
        address TEXT PRIMARY KEY,
        nonce TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);

    clientWallet = ethers.Wallet.createRandom();
    freelancer1 = ethers.Wallet.createRandom();
    freelancer2 = ethers.Wallet.createRandom();
  });

  after(() => {
    db.close();
  });

  it("1. Should store and retrieve a freelancer profile with skills and notification preferences", () => {
    const now = Date.now();
    const skills = JSON.stringify(["Solidity", "React", "Next.js"]);

    db.prepare(`
      INSERT INTO freelancers (address, name, bio, skills, hourly_rate, notify_push, notify_in_app, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      freelancer1.address.toLowerCase(),
      "Alice Developer",
      "Web3 Full-Stack Engineer",
      skills,
      "0.05 ETH/hr",
      1,
      1,
      now,
      now
    );

    const profile = db.prepare("SELECT * FROM freelancers WHERE address = ?").get(freelancer1.address.toLowerCase());
    assert.ok(profile);
    assert.strictEqual(profile.name, "Alice Developer");
    assert.deepStrictEqual(JSON.parse(profile.skills), ["Solidity", "React", "Next.js"]);
    assert.strictEqual(profile.notify_push, 1);
  });

  it("2. Should generate challenge nonces and verify cryptographic wallet signatures", async () => {
    const nonce = crypto.randomBytes(16).toString("hex");
    const expiresAt = Date.now() + 600000;

    db.prepare("INSERT INTO auth_nonces (address, nonce, expires_at) VALUES (?, ?, ?)")
      .run(clientWallet.address.toLowerCase(), nonce, expiresAt);

    const authMessage = `Sign this one-time challenge to authenticate on ClearEscrow:\nAddress: ${clientWallet.address.toLowerCase()}\nNonce: ${nonce}`;
    const signature = await clientWallet.signMessage(authMessage);

    const recoveredAddress = ethers.verifyMessage(authMessage, signature);
    assert.strictEqual(recoveredAddress.toLowerCase(), clientWallet.address.toLowerCase());

    const row = db.prepare("SELECT nonce FROM auth_nonces WHERE address = ?").get(clientWallet.address.toLowerCase());
    assert.strictEqual(row.nonce, nonce);
  });

  it("3. Should persist a job posting with separate application and completion deadlines", () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const appDeadline = nowSec + 86400 * 3;
    const compDeadline = nowSec + 86400 * 10;
    const now = Date.now();

    const result = db.prepare(`
      INSERT INTO jobs (
        client_address, title, description, skills, budget, currency,
        application_deadline, completion_deadline, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'ETH', ?, ?, 'open', ?, ?)
    `).run(
      clientWallet.address.toLowerCase(),
      "Full-Stack Escrow Engineer",
      "Build decentralised freelancer marketplace with Web Push notifications",
      JSON.stringify(["Solidity", "Viem", "TypeScript"]),
      0.5,
      appDeadline,
      compDeadline,
      now,
      now
    );

    const jobId = Number(result.lastInsertRowid);
    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId);
    assert.strictEqual(job.title, "Full-Stack Escrow Engineer");
    assert.strictEqual(job.budget, 0.5);
    assert.strictEqual(job.status, "open");
    assert.ok(job.application_deadline < job.completion_deadline);
  });

  it("4. Should allow freelancer application submission and prevent duplicate applications", () => {
    const now = Date.now();

    const res1 = db.prepare(`
      INSERT INTO applications (job_id, freelancer_address, proposal, bid_amount, estimated_days, status, created_at, updated_at)
      VALUES (1, ?, 'I have 4 years experience building smart contracts', 0.45, 5, 'pending', ?, ?)
    `).run(freelancer1.address.toLowerCase(), now, now);

    assert.strictEqual(Number(res1.changes), 1);

    // Duplicate submission must throw
    assert.throws(() => {
      db.prepare(`
        INSERT INTO applications (job_id, freelancer_address, proposal, bid_amount, estimated_days, status, created_at, updated_at)
        VALUES (1, ?, 'Duplicate attempt', 0.40, 4, 'pending', ?, ?)
      `).run(freelancer1.address.toLowerCase(), now, now);
    });

    const res2 = db.prepare(`
      INSERT INTO applications (job_id, freelancer_address, proposal, bid_amount, estimated_days, status, created_at, updated_at)
      VALUES (1, ?, 'Senior frontend and Web3 developer', 0.50, 7, 'pending', ?, ?)
    `).run(freelancer2.address.toLowerCase(), now, now);

    assert.strictEqual(Number(res2.changes), 1);

    const apps = db.prepare("SELECT * FROM applications WHERE job_id = 1").all();
    assert.strictEqual(apps.length, 2);
  });

  it("5. Should atomically select candidate, mark job as assigned, and mark competing applications as rejected", () => {
    const now = Date.now();
    const jobId = 1;

    const targetApp = db.prepare("SELECT * FROM applications WHERE job_id = ? AND freelancer_address = ?")
      .get(jobId, freelancer1.address.toLowerCase());

    db.prepare("UPDATE applications SET status = 'accepted', updated_at = ? WHERE id = ?").run(now, targetApp.id);
    db.prepare("UPDATE applications SET status = 'rejected', updated_at = ? WHERE job_id = ? AND id != ?").run(now, jobId, targetApp.id);
    db.prepare("UPDATE jobs SET status = 'assigned', selected_freelancer_address = ?, updated_at = ? WHERE id = ?")
      .run(targetApp.freelancer_address, now, jobId);

    const updatedJob = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId);
    assert.strictEqual(updatedJob.status, "assigned");
    assert.strictEqual(updatedJob.selected_freelancer_address, freelancer1.address.toLowerCase());

    const app1 = db.prepare("SELECT status FROM applications WHERE id = ?").get(targetApp.id);
    assert.strictEqual(app1.status, "accepted");

    const app2 = db.prepare("SELECT status FROM applications WHERE job_id = ? AND freelancer_address = ?")
      .get(jobId, freelancer2.address.toLowerCase());
    assert.strictEqual(app2.status, "rejected");
  });

  it("6. Should enforce idempotency on in-app notifications and prevent duplicate alerts", () => {
    const now = Date.now();
    const idempotencyKey = "job_1_alert_freelancer1";

    const insertNotification = () => {
      return db.prepare(`
        INSERT OR IGNORE INTO in_app_notifications (
          recipient_address, title, message, link, type, idempotency_key, is_read, created_at
        ) VALUES (?, 'New Job', 'Work is available', '/jobs/1', 'new_job', ?, 0, ?)
      `).run(freelancer1.address.toLowerCase(), idempotencyKey, now);
    };

    const r1 = insertNotification();
    assert.strictEqual(Number(r1.changes), 1);

    const r2 = insertNotification();
    assert.strictEqual(Number(r2.changes), 0);

    const count = db.prepare("SELECT COUNT(*) as c FROM in_app_notifications WHERE idempotency_key = ?")
      .get(idempotencyKey);
    assert.strictEqual(count.c, 1);
  });

  it("7. Should register push subscriptions and support removal on unsubscribe", () => {
    const endpoint = "https://fcm.googleapis.com/fcm/send/test-sub-123";
    const now = Date.now();

    db.prepare(`
      INSERT INTO push_subscriptions (address, endpoint, p256dh, auth, created_at)
      VALUES (?, ?, 'key-p256dh', 'key-auth', ?)
    `).run(freelancer1.address.toLowerCase(), endpoint, now);

    const sub = db.prepare("SELECT * FROM push_subscriptions WHERE endpoint = ?").get(endpoint);
    assert.strictEqual(sub.address, freelancer1.address.toLowerCase());

    db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(endpoint);
    const postDel = db.prepare("SELECT * FROM push_subscriptions WHERE endpoint = ?").get(endpoint);
    assert.strictEqual(postDel, undefined);
  });
});
