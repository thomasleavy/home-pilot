import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.SQLITE_PATH || path.join(__dirname, '../../data/app.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    createTables(db);
  }
  return db;
}

function createTables(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS user_device_state (
      user_id INTEGER NOT NULL,
      device_id TEXT NOT NULL,
      state_json TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, device_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS user_heating_minutes (
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      minutes REAL NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, date),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS user_hot_water_minutes (
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      minutes REAL NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, date),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

export function createUser(username: string, email: string, passwordHash: string): { id: number; username: string; email: string } {
  const database = getDb();
  const stmt = database.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
  const result = stmt.run(username, email.toLowerCase(), passwordHash);
  const id = result.lastInsertRowid as number;
  return { id, username, email: email.toLowerCase() };
}

export function findUserByEmail(email: string): { id: number; username: string; email: string; password_hash: string } | undefined {
  const database = getDb();
  return database.prepare('SELECT id, username, email, password_hash FROM users WHERE email = ?').get(email.toLowerCase()) as any;
}

export function findUserByUsername(username: string): { id: number; username: string; email: string; password_hash: string } | undefined {
  const database = getDb();
  return database.prepare('SELECT id, username, email, password_hash FROM users WHERE username = ?').get(username) as any;
}

export function findUserById(userId: number): { id: number; username: string; email: string; password_hash: string } | undefined {
  const database = getDb();
  return database.prepare('SELECT id, username, email, password_hash FROM users WHERE id = ?').get(userId) as any;
}

export function updateUser(
  userId: number,
  updates: { username?: string; email?: string }
): { id: number; username: string; email: string } | null {
  const database = getDb();
  const user = findUserById(userId);
  if (!user) return null;
  const username = updates.username !== undefined ? updates.username.trim() : user.username;
  const email = updates.email !== undefined ? updates.email.trim().toLowerCase() : user.email;
  if (username.length < 2) return null;
  if (username !== user.username && findUserByUsername(username)) return null;
  if (email !== user.email && findUserByEmail(email)) return null;
  database.prepare('UPDATE users SET username = ?, email = ? WHERE id = ?').run(username, email, userId);
  return { id: userId, username, email };
}

export function updateUserPassword(userId: number, newPasswordHash: string): boolean {
  const database = getDb();
  const result = database.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, userId);
  return result.changes > 0;
}

export function getUserDeviceState(userId: number): Record<string, string> {
  const database = getDb();
  const rows = database.prepare('SELECT device_id, state_json FROM user_device_state WHERE user_id = ?').all(userId) as { device_id: string; state_json: string }[];
  const out: Record<string, string> = {};
  rows.forEach((r) => { out[r.device_id] = r.state_json; });
  return out;
}

export function setUserDeviceState(userId: number, deviceId: string, state: Record<string, unknown>): void {
  const database = getDb();
  const stateJson = JSON.stringify(state);
  database.prepare(
    `INSERT INTO user_device_state (user_id, device_id, state_json, updated_at) VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, device_id) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at`
  ).run(userId, deviceId, stateJson);
}

/** Heating history is read from SQLite; it persists across backend restarts. Only todayExtraSeconds (live timer) is in-memory. */
export function getUserHeatingHistory(userId: number, todayExtraSeconds: number = 0): { date: string; minutesOn: number }[] {
  const database = getDb();
  const now = new Date();
  const todayKey = dateKey(now);
  const out: { date: string; minutesOn: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const row = database.prepare('SELECT minutes FROM user_heating_minutes WHERE user_id = ? AND date = ?').get(userId, key) as { minutes: number } | undefined;
    let minutes = row ? row.minutes : 0;
    if (key === todayKey && todayExtraSeconds > 0) minutes += todayExtraSeconds / 60;
    out.push({ date: key, minutesOn: Math.round(minutes * 10) / 10 });
  }
  return out;
}

/** Hot water history is read from SQLite; it persists across backend restarts. Only todayExtraSeconds (live timer) is in-memory. */
export function getUserHotWaterHistory(userId: number, todayExtraSeconds: number = 0): { date: string; minutesOn: number }[] {
  const database = getDb();
  const now = new Date();
  const todayKey = dateKey(now);
  const out: { date: string; minutesOn: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const row = database.prepare('SELECT minutes FROM user_hot_water_minutes WHERE user_id = ? AND date = ?').get(userId, key) as { minutes: number } | undefined;
    let minutes = row ? row.minutes : 0;
    if (key === todayKey && todayExtraSeconds > 0) minutes += todayExtraSeconds / 60;
    out.push({ date: key, minutesOn: Math.round(minutes * 10) / 10 });
  }
  return out;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const userLastHeating: Record<number, { on: boolean; ts: number }> = {};
const userLastHotWater: Record<number, { on: boolean; ts: number }> = {};

export function recordUserHeatingCommand(userId: number, payload: Record<string, unknown>): void {
  if (!payload || !('heatingOn' in payload)) return;
  const now = Date.now() / 1000;
  const on = payload.heatingOn !== false;
  const last = userLastHeating[userId] ?? { on: false, ts: 0 };
  if (last.on && last.ts > 0) {
    const elapsed = Math.max(0, now - last.ts);
    const today = dateKey(new Date(now * 1000));
    const database = getDb();
    const row = database.prepare('SELECT minutes FROM user_heating_minutes WHERE user_id = ? AND date = ?').get(userId, today) as { minutes: number } | undefined;
    const current = row ? row.minutes * 60 : 0;
    const newSeconds = current + elapsed;
    database.prepare(
      `INSERT INTO user_heating_minutes (user_id, date, minutes) VALUES (?, ?, ?)
       ON CONFLICT(user_id, date) DO UPDATE SET minutes = excluded.minutes`
    ).run(userId, today, Math.round((newSeconds / 60) * 100) / 100);
  }
  userLastHeating[userId] = { on, ts: now };
}

export function recordUserHotWaterCommand(userId: number, payload: Record<string, unknown>): void {
  if (!payload || !('on' in payload)) return;
  const now = Date.now() / 1000;
  const on = payload.on !== false;
  const last = userLastHotWater[userId] ?? { on: false, ts: 0 };
  if (last.on && last.ts > 0) {
    const elapsed = Math.max(0, now - last.ts);
    const today = dateKey(new Date(now * 1000));
    const database = getDb();
    const row = database.prepare('SELECT minutes FROM user_hot_water_minutes WHERE user_id = ? AND date = ?').get(userId, today) as { minutes: number } | undefined;
    const current = row ? row.minutes * 60 : 0;
    const newSeconds = current + elapsed;
    database.prepare(
      `INSERT INTO user_hot_water_minutes (user_id, date, minutes) VALUES (?, ?, ?)
       ON CONFLICT(user_id, date) DO UPDATE SET minutes = excluded.minutes`
    ).run(userId, today, Math.round((newSeconds / 60) * 100) / 100);
  }
  userLastHotWater[userId] = { on, ts: now };
}

export function getHotWaterTodayExtraSeconds(userId: number): number {
  const last = userLastHotWater[userId];
  if (!last?.on || last.ts <= 0) return 0;
  return Math.max(0, Date.now() / 1000 - last.ts);
}

/** Same logic as getHotWaterTodayExtraSeconds: in-memory only, per user. */
export function getHeatingTodayExtraSeconds(userId: number): number {
  const last = userLastHeating[userId];
  if (!last?.on || last.ts <= 0) return 0;
  return Math.max(0, Date.now() / 1000 - last.ts);
}

/** Permanently remove the user and all their data from the SQLite database (profile, device state, heating/hot-water history). */
export function deleteUser(userId: number): void {
  const database = getDb();
  database.prepare('DELETE FROM user_device_state WHERE user_id = ?').run(userId);
  database.prepare('DELETE FROM user_heating_minutes WHERE user_id = ?').run(userId);
  database.prepare('DELETE FROM user_hot_water_minutes WHERE user_id = ?').run(userId);
  database.prepare('DELETE FROM users WHERE id = ?').run(userId);
}
