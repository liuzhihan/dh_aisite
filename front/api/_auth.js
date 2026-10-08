import { createHash, randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { cookieValue, setSessionCookie } from './_db.js';

const scrypt = promisify(scryptCallback);
const SESSION_DAYS = 30;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${Buffer.from(derived).toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [algorithm, salt, digest] = String(stored || '').split(':');
  if (algorithm !== 'scrypt' || !salt || !digest) return false;
  const derived = await scrypt(password, salt, 64);
  return Buffer.from(derived).toString('hex') === digest;
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(sql, res, userId) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  await sql`INSERT INTO public.user_session (user_id, token_hash, expires_at) VALUES (${userId}, ${tokenHash}, CURRENT_TIMESTAMP + INTERVAL '30 days')`;
  setSessionCookie(res, token);
}

export async function currentUser(req, sql) {
  const token = cookieValue(req, 'dahan_session');
  if (!token) return null;
  const tokenHash = hashToken(token);
  const rows = await sql`SELECT u.id, u.email, u.username, u.display_name AS "displayName", u.role, u.status FROM public.user_session s JOIN public."user" u ON u.id = s.user_id WHERE s.token_hash = ${tokenHash} AND s.expires_at > CURRENT_TIMESTAMP AND u.status = 'active' LIMIT 1`;
  return rows[0] || null;
}
