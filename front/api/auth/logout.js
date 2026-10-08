import { getSql, clearSessionCookie, cookieValue, json, method } from '../_db.js';
import { hashToken } from '../_auth.js';

export default async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    const token = cookieValue(req, 'dahan_session');
    if (token) {
      const sql = getSql();
      await sql`DELETE FROM public.user_session WHERE token_hash = ${hashToken(token)}`;
    }
    clearSessionCookie(res);
    return json(res, 200, { ok: true });
  } catch (error) {
    console.error(error);
    clearSessionCookie(res);
    return json(res, 200, { ok: true });
  }
}
