import { getSql, json, method } from '../_db.js';
import { createSession, hashPassword } from '../_auth.js';

export default async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    const { username, email, password, confirmPassword } = req.body || {};
    if (!username || !email || !password || password !== confirmPassword) return json(res, 400, { error: '请完整填写注册信息，并确认两次密码一致。' });
    if (!/^.{2,64}$/.test(username) || !/^\S+@\S+\.\S+$/.test(email)) return json(res, 400, { error: '用户名或邮箱格式不正确。' });
    if (password.length < 8) return json(res, 400, { error: '密码至少需要 8 位。' });
    const sql = getSql();
    const existing = await sql`SELECT id FROM public."user" WHERE lower(email) = lower(${email}) OR lower(username) = lower(${username}) LIMIT 1`;
    if (existing.length) return json(res, 409, { error: '邮箱或用户名已被注册。' });
    const passwordHash = await hashPassword(password);
    const rows = await sql`INSERT INTO public."user" (email, password_hash, username, display_name, status) VALUES (${email.trim()}, ${passwordHash}, ${username.trim()}, ${username.trim()}, 'active') RETURNING id, email, username, display_name AS "displayName", role`;
    await createSession(sql, res, rows[0].id);
    return json(res, 201, { user: rows[0] });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: '注册暂时不可用，请稍后再试。' });
  }
}
