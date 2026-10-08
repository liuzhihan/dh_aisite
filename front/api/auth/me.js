import { getSql, json, method } from '../_db.js';
import { currentUser } from '../_auth.js';

export default async function handler(req, res) {
  if (!method(req, res, ['GET'])) return;
  try {
    const user = await currentUser(req, getSql());
    return json(res, 200, { user });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: '无法读取登录状态。' });
  }
}
