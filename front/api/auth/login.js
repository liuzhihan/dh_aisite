import { getSql, json, method } from '../_db.js';
import { createSession, verifyPassword } from '../_auth.js';

export default async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) return json(res, 400, { error: '请输入邮箱或用户名，以及密码。' });
    const sql = getSql();
    const rows = await sql`SELECT id, email, username, password_hash, display_name AS "displayName", role, status FROM public."user" WHERE lower(email) = lower(${identifier}) OR lower(username) = lower(${identifier}) LIMIT 1`;
    const user = rows[0];
    if (!user || user.status !== 'active' || !(await verifyPassword(password, user.password_hash))) return json(res, 401, { error: '账号或密码不正确。' });
    await sql`UPDATE public."user" SET last_login_at = CURRENT_TIMESTAMP WHERE id = ${user.id}`;
    await createSession(sql, res, user.id);
    const { password_hash: ignored, ...safeUser } = user;
    return json(res, 200, { user: safeUser });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: '登录暂时不可用，请稍后再试。' });
  }
}
