import { getSql, json, method } from '../../../_db.js';
import { currentUser } from '../../../_auth.js';

export default async function handler(req, res) {
  if (!method(req, res, ['GET'])) return;
  try {
    const sql = getSql();
    const user = await currentUser(req, sql);
    if (!user) return json(res, 401, { error: '请先登录。' });
    const problemId = req.query.problemId;
    const attachmentId = req.query.attachmentId;
    const rows = await sql`SELECT a.file_name, a.mime_type, a.content FROM public.userproblem_attachment a JOIN public.userproblem p ON p.id = a.problem_id WHERE a.id = ${attachmentId} AND p.id = ${problemId} AND (p.user_id = ${user.id} OR ${user.role} = 'admin') LIMIT 1`;
    if (!rows.length) return json(res, 404, { error: '附件不存在。' });
    const file = rows[0];
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.file_name)}`);
    return res.status(200).send(file.content);
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: '附件暂时无法读取。' });
  }
}
