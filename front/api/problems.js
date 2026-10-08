import Busboy from 'busboy';
import { getSql, json, method } from './_db.js';
import { currentUser } from './_auth.js';

export const config = { api: { bodyParser: false } };
const allowedExtensions = /\.(txt|doc|docx|pdf|xls|xlsx)$/i;
const maxFileSize = 10 * 1024 * 1024;
const maxFiles = 5;

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.startsWith('multipart/form-data')) return reject(new Error('请使用文件上传表单提交。'));
    const parser = Busboy({ headers: req.headers, limits: { files: maxFiles, fileSize: maxFileSize } });
    const fields = {};
    const files = [];
    let tooManyFiles = false;
    parser.on('field', (name, value) => { fields[name] = value; });
    parser.on('filesLimit', () => { tooManyFiles = true; });
    parser.on('file', (name, file, info) => {
      if (name !== 'attachments') { file.resume(); return; }
      const chunks = [];
      let size = 0;
      let tooLarge = false;
      file.on('data', (chunk) => { size += chunk.length; chunks.push(chunk); });
      file.on('limit', () => { tooLarge = true; });
      file.on('end', () => { files.push({ fileName: info.filename, mimeType: info.mimeType || 'application/octet-stream', size, content: Buffer.concat(chunks), tooLarge }); });
    });
    parser.on('error', reject);
    parser.on('finish', () => resolve({ fields, files, tooManyFiles }));
    req.pipe(parser);
  });
}

function safeFileName(name) {
  return String(name || '').replace(/[\\/\0]/g, '').slice(0, 255) || 'attachment';
}

function serializeProblem(row) {
  return { id: row.id, question: row.question, purpose: row.purpose, status: row.status, other: row.other, createdAt: row.created_at, updatedAt: row.updated_at, attachments: row.attachments || [] };
}

export default async function handler(req, res) {
  if (!method(req, res, ['GET', 'POST'])) return;
  try {
    const sql = getSql();
    const user = await currentUser(req, sql);
    if (!user) return json(res, 401, { error: '请先登录。' });
    if (req.method === 'GET') {
      const rows = await sql`SELECT p.id, p.question, p.purpose, p.status, p.other, p.created_at, p.updated_at, COALESCE((SELECT json_agg(json_build_object('id', a.id, 'fileName', a.file_name) ORDER BY a.id) FROM public.userproblem_attachment a WHERE a.problem_id = p.id), '[]'::json) AS attachments FROM public.userproblem p WHERE p.user_id = ${user.id} ORDER BY p.created_at DESC LIMIT 20`;
      return json(res, 200, { items: rows.map(serializeProblem) });
    }
    const { fields, files, tooManyFiles } = await parseMultipart(req);
    if (tooManyFiles || files.length > maxFiles) return json(res, 400, { error: '每个任务最多上传 5 个附件。' });
    if (!String(fields.question || '').trim() || !String(fields.purpose || '').trim()) return json(res, 400, { error: '问题和目的不能为空。' });
    if (files.some((file) => file.tooLarge || file.size > maxFileSize)) return json(res, 400, { error: '单个附件不能超过 10MB。' });
    if (files.some((file) => !allowedExtensions.test(file.fileName))) return json(res, 400, { error: '仅支持 TXT、DOC、DOCX、PDF、XLS、XLSX 文件。' });
    const problemRows = await sql`INSERT INTO public.userproblem (user_id, question, purpose, other, status) VALUES (${user.id}, ${String(fields.question).trim()}, ${String(fields.purpose).trim()}, ${String(fields.other || '').trim() || null}, 1) RETURNING id, question, purpose, status, other, created_at, updated_at`;
    const problem = problemRows[0];
    for (const file of files) {
      await sql`INSERT INTO public.userproblem_attachment (problem_id, file_name, mime_type, size_bytes, content) VALUES (${problem.id}, ${safeFileName(file.fileName)}, ${file.mimeType}, ${file.size}, ${file.content})`;
    }
    return json(res, 201, { item: serializeProblem({ ...problem, attachments: files.map((file) => ({ fileName: safeFileName(file.fileName) })) }) });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: '任务服务暂时不可用，请稍后再试。' });
  }
}
