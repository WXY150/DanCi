import { createReadStream, existsSync, statSync } from 'node:fs';
import { unlink, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { WORDS as FALLBACK_WORDS } from '../data/word2-words.js';
import { checkDatabase, connectDatabase, findWord, listWords, saveGeneratedImage, ensureDefaultAdmin, getUserProgress, upsertUserProgress, deleteUserProgress, listAllUsers, deleteUserById, updateUserRole, findUserById, recordWordImage, listWordImages, findWordImage, activateWordImage, deleteWordImage, createWord, findWordByText } from './db.js';
import { generateWordImage, imageGenerationConfigured, isGeneratedImageUrl } from './image-generation.js';
import { registerUser, loginUser, verifySession, logout, cleanupExpiredSessions } from './auth.js';

try { process.loadEnvFile?.(); } catch {}

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = Number(process.env.PORT) || 4173;
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml'
};
const PUBLIC_FILES = new Set(['index.html', 'app.js', 'styles.css', 'admin.html', 'admin.js', 'admin.css', 'login.html', 'login.js', 'login.css']);
const PUBLIC_DIRS = ['data/', 'services/', 'images/', 'generated/'];
let databaseReady = false;

// 解析 Cookie
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const [key, ...rest] = cookie.split('=');
    if (key && rest.length) {
      cookies[key.trim()] = decodeURIComponent(rest.join('=').trim());
    }
  });
  return cookies;
}

// 获取认证token
function getAuthToken(request) {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookies = parseCookies(request.headers.cookie);
  return cookies.token || null;
}

// 设置Cookie
function setCookie(response, name, value, options = {}) {
  const maxAge = options.maxAge || 7 * 24 * 60 * 60; // 默认7天
  const cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Strict`;
  response.setHeader('Set-Cookie', cookie);
}

// 清除Cookie
function clearCookie(response, name) {
  const cookie = `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict`;
  response.setHeader('Set-Cookie', cookie);
}

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

async function readJson(request, maxBytes = 4096) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > maxBytes) {
      const error = new Error('请求内容过大');
      error.statusCode = 413;
      throw error;
    }
  }
  try {
    return JSON.parse(body || '{}');
  } catch {
    const error = new Error('请求内容不是有效 JSON');
    error.statusCode = 400;
    throw error;
  }
}

const UPLOAD_DIR = path.join(ROOT, 'generated');
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
const UPLOAD_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp' };

// 解析 multipart/form-data 上传并把图片写入 generated 目录，返回可访问的 URL
async function saveUploadedImage(request, word) {
  const contentType = request.headers['content-type'] || '';
  const match = contentType.match(/multipart\/form-data;\s*boundary=(.+)$/i);
  if (!match) throw new Error('请使用 multipart/form-data 上传');
  const boundary = `--${match[1].trim().replace(/^"|"$/g, '')}`;

  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_UPLOAD_BYTES) throw new Error('图片不能超过 5MB');
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  // 定位第一个文件部分
  const boundaryBuf = Buffer.from(boundary);
  const start = buffer.indexOf(boundaryBuf);
  if (start === -1) throw new Error('未找到上传内容');
  const headerStart = start + boundaryBuf.length + 2; // 跳过 \r\n
  const headerEnd = buffer.indexOf('\r\n\r\n', headerStart);
  if (headerEnd === -1) throw new Error('上传内容格式错误');
  const header = buffer.slice(headerStart, headerEnd).toString('utf8');

  const typeMatch = header.match(/Content-Type:\s*([^\r\n]+)/i);
  const mime = typeMatch ? typeMatch[1].trim().toLowerCase() : '';
  const ext = UPLOAD_EXT[mime];
  if (!ext) throw new Error('仅支持 JPG / PNG / GIF / WEBP 图片');

  const dataStart = headerEnd + 4;
  const dataEnd = buffer.indexOf(`\r\n${boundary}`, dataStart);
  if (dataEnd === -1) throw new Error('上传内容格式错误');
  const fileData = buffer.slice(dataStart, dataEnd);
  if (fileData.length === 0) throw new Error('上传的图片为空');

  await mkdir(UPLOAD_DIR, { recursive: true });
  const safeWord = String(word.word || 'image').toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const filename = `${safeWord}-upload-${Date.now()}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), fileData);
  return `/generated/${filename}`;
}

function serveStatic(response, pathname) {
  const relative = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  if (!PUBLIC_FILES.has(relative) && !PUBLIC_DIRS.some(directory => relative.startsWith(directory))) {
    return json(response, 403, { error: '禁止访问' });
  }
  const filename = path.resolve(ROOT, relative);
  if (filename !== ROOT && !filename.startsWith(`${ROOT}${path.sep}`)) return json(response, 403, { error: '禁止访问' });
  try {
    const stat = statSync(filename);
    if (!stat.isFile()) throw new Error('not a file');
    response.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(filename).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    createReadStream(filename).pipe(response);
  } catch {
    json(response, 404, { error: '资源不存在' });
  }
}

async function handler(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  
  // ==================== 认证相关API ====================
  
  // 注册（仅限管理员创建新管理员）
  if (request.method === 'POST' && url.pathname === '/api/auth/register') {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    const { username, password, role } = await readJson(request);
    
    // 验证管理员权限
    const token = getAuthToken(request);
    const session = await verifySession(token);
    if (!session || session.role !== 'admin') {
      return json(response, 403, { error: '仅管理员可以创建新用户' });
    }
    
    try {
      const user = await registerUser(username, password, role || 'user');
      return json(response, 201, { success: true, user: { id: user.userId, username: user.username, role: user.role } });
    } catch (error) {
      return json(response, 400, { error: error.message });
    }
  }
  
  // 登录
  if (request.method === 'POST' && url.pathname === '/api/auth/login') {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    const { username, password } = await readJson(request);
    
    try {
      const result = await loginUser(username, password);
      setCookie(response, 'token', result.token);
      return json(response, 200, { success: true, user: result.user, token: result.token });
    } catch (error) {
      return json(response, 401, { error: error.message });
    }
  }
  
  // 登出
  if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
    const token = getAuthToken(request);
    if (token) {
      await logout(token);
      clearCookie(response, 'token');
    }
    return json(response, 200, { success: true });
  }
  
  // 获取当前用户状态
  if (request.method === 'GET' && url.pathname === '/api/auth/status') {
    const token = getAuthToken(request);
    const session = await verifySession(token);
    
    if (!session) {
      return json(response, 200, { authenticated: false, user: null });
    }
    
    return json(response, 200, { 
      authenticated: true, 
      user: { 
        id: session.userId, 
        username: session.username, 
        role: session.role 
      } 
    });
  }
  
  // 公开注册（创建普通用户账号）
  if (request.method === 'POST' && url.pathname === '/api/auth/signup') {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    const { username, password } = await readJson(request);
    try {
      const user = await registerUser(username, password, 'user');
      return json(response, 201, { success: true, user: { id: user.userId, username: user.username, role: user.role } });
    } catch (error) {
      return json(response, 400, { error: error.message });
    }
  }
  
  // 读取当前用户云端进度
  if (request.method === 'GET' && url.pathname === '/api/progress') {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    const session = await verifySession(getAuthToken(request));
    if (!session) return json(response, 401, { error: '未登录' });
    const raw = await getUserProgress(session.userId);
    let state = null;
    if (raw) { try { state = JSON.parse(raw); } catch { state = null; } }
    return json(response, 200, { state });
  }
  
  // 保存当前用户云端进度
  if (request.method === 'PUT' && url.pathname === '/api/progress') {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    const session = await verifySession(getAuthToken(request));
    if (!session) return json(response, 401, { error: '未登录' });
    const { state } = await readJson(request, 2 * 1024 * 1024);
    if (!state || typeof state !== 'object') return json(response, 400, { error: '进度数据无效' });
    await upsertUserProgress(session.userId, JSON.stringify(state));
    return json(response, 200, { success: true });
  }
  
  // ==================== 原有API ====================
  
  if (request.method === 'GET' && url.pathname === '/api/health') {
    if (databaseReady) await checkDatabase();
    return json(response, 200, { ok: true, storage: databaseReady ? 'mysql' : 'local-fallback', imageGeneration: imageGenerationConfigured() });
  }
  if (request.method === 'GET' && url.pathname === '/api/words') {
    return json(response, 200, { words: databaseReady ? await listWords() : FALLBACK_WORDS });
  }
  // ==================== 管理端：账户管理 ====================
  
  // 用户列表
  if (request.method === 'GET' && url.pathname === '/api/admin/users') {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    const session = await verifySession(getAuthToken(request));
    if (!session || session.role !== 'admin') return json(response, 403, { error: '仅管理员可访问' });
    const users = await listAllUsers();
    return json(response, 200, { users });
  }
  
  // 单个用户详情 + 进度
  const userDetailMatch = request.method === 'GET' && url.pathname.match(/^\/api\/admin\/users\/(\d+)$/);
  if (userDetailMatch) {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    const session = await verifySession(getAuthToken(request));
    if (!session || session.role !== 'admin') return json(response, 403, { error: '仅管理员可访问' });
    const id = Number(userDetailMatch[1]);
    const user = await findUserById(id);
    if (!user) return json(response, 404, { error: '用户不存在' });
    const raw = await getUserProgress(id);
    let state = null;
    if (raw) { try { state = JSON.parse(raw); } catch { state = null; } }
    return json(response, 200, { user: { id: user.id, username: user.username, role: user.role, created_at: user.created_at, last_login_at: user.last_login_at }, state });
  }
  
  // 重置某用户进度
  const resetMatch = request.method === 'POST' && url.pathname.match(/^\/api\/admin\/users\/(\d+)\/reset-progress$/);
  if (resetMatch) {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    const session = await verifySession(getAuthToken(request));
    if (!session || session.role !== 'admin') return json(response, 403, { error: '仅管理员可访问' });
    const id = Number(resetMatch[1]);
    const user = await findUserById(id);
    if (!user) return json(response, 404, { error: '用户不存在' });
    await deleteUserProgress(id);
    return json(response, 200, { success: true });
  }
  
  // 删除用户（级联删除其会话与进度）
  const deleteMatch = request.method === 'POST' && url.pathname.match(/^\/api\/admin\/users\/(\d+)\/delete$/);
  if (deleteMatch) {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    const session = await verifySession(getAuthToken(request));
    if (!session || session.role !== 'admin') return json(response, 403, { error: '仅管理员可访问' });
    const id = Number(deleteMatch[1]);
    if (id === session.userId) return json(response, 400, { error: '不能删除当前登录的管理员账号' });
    const user = await findUserById(id);
    if (!user) return json(response, 404, { error: '用户不存在' });
    await deleteUserById(id);
    return json(response, 200, { success: true });
  }
  
  // 调整用户角色
  const roleMatch = request.method === 'POST' && url.pathname.match(/^\/api\/admin\/users\/(\d+)\/role$/);
  if (roleMatch) {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    const session = await verifySession(getAuthToken(request));
    if (!session || session.role !== 'admin') return json(response, 403, { error: '仅管理员可访问' });
    const id = Number(roleMatch[1]);
    const { role } = await readJson(request);
    if (!['user', 'admin'].includes(role)) return json(response, 400, { error: '角色无效' });
    const user = await findUserById(id);
    if (!user) return json(response, 404, { error: '用户不存在' });
    if (id === session.userId && role !== 'admin') return json(response, 400, { error: '不能取消当前登录管理员的管理员身份' });
    await updateUserRole(id, role);
    return json(response, 200, { success: true, role });
  }
  
  // 新增单词（仅限管理员）
  if (request.method === 'POST' && url.pathname === '/api/admin/words') {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    const session = await verifySession(getAuthToken(request));
    if (!session || session.role !== 'admin') return json(response, 403, { error: '仅管理员可新增单词' });
    const body = await readJson(request);
    const word = String(body.word || '').trim();
    if (!word) return json(response, 400, { error: '请填写单词' });
    const existing = await findWordByText(word);
    if (existing) return json(response, 409, { error: '该单词已存在' });
    const created = await createWord({
      word,
      phonetic: String(body.phonetic || '').trim(),
      partOfSpeech: String(body.partOfSpeech || '').trim(),
      meaning: String(body.meaning || '').trim(),
      mnemonic: String(body.mnemonic || '').trim()
    });
    return json(response, 201, { word: created });
  }

  // 上传图片（仅限管理员）
  const uploadMatch = request.method === 'POST' && url.pathname.match(/^\/api\/admin\/words\/(\d+)\/upload-image$/);
  if (uploadMatch) {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    const session = await verifySession(getAuthToken(request));
    if (!session || session.role !== 'admin') return json(response, 403, { error: '仅管理员可上传图片' });
    const id = Number(uploadMatch[1]);
    const word = await findWord(id);
    if (!word) return json(response, 404, { error: '单词不存在' });
    try {
      const imageUrl = await saveUploadedImage(request, word);
      await recordWordImage(id, imageUrl);
      return json(response, 200, { candidateImageUrl: imageUrl });
    } catch (err) {
      return json(response, 400, { error: err.message || '上传失败' });
    }
  }

  // 图片生成和替换功能（仅限管理员）
  const regenerateMatch = request.method === 'POST' && url.pathname.match(/^\/api\/admin\/words\/(\d+)\/regenerate-image$/);
  if (regenerateMatch) {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    
    // 验证管理员权限
    const token = getAuthToken(request);
    const session = await verifySession(token);
    if (!session || session.role !== 'admin') {
      return json(response, 403, { error: '仅管理员可以生成图片' });
    }
    
    const id = Number(regenerateMatch[1]);
    const word = await findWord(id);
    if (!word) return json(response, 404, { error: '单词不存在' });
    const candidateImageUrl = await generateWordImage(word);
    // 候选图片记录进历史表（未启用），供稍后挑选
    await recordWordImage(id, candidateImageUrl);
    return json(response, 200, { currentImageUrl: word.imageUrl, candidateImageUrl });
  }

  // 列出某单词的所有历史图片
  const imageHistoryMatch = request.method === 'GET' && url.pathname.match(/^\/api\/admin\/words\/(\d+)\/images$/);
  if (imageHistoryMatch) {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    const session = await verifySession(getAuthToken(request));
    if (!session || session.role !== 'admin') return json(response, 403, { error: '仅管理员可访问' });
    const id = Number(imageHistoryMatch[1]);
    const word = await findWord(id);
    if (!word) return json(response, 404, { error: '单词不存在' });
    const images = await listWordImages(id);
    return json(response, 200, { word, images });
  }

  // 启用某张历史图片作为当前图片
  const activateImageMatch = request.method === 'POST' && url.pathname.match(/^\/api\/admin\/words\/(\d+)\/images\/(\d+)\/activate$/);
  if (activateImageMatch) {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    const session = await verifySession(getAuthToken(request));
    if (!session || session.role !== 'admin') return json(response, 403, { error: '仅管理员可访问' });
    const wordId = Number(activateImageMatch[1]);
    const imageId = Number(activateImageMatch[2]);
    const image = await findWordImage(imageId);
    if (!image || image.wordId !== wordId) return json(response, 404, { error: '图片不存在' });
    const updated = await activateWordImage(wordId, image.imageUrl);
    return json(response, 200, { word: updated });
  }

  // 删除某张历史图片
  const deleteImageMatch = request.method === 'POST' && url.pathname.match(/^\/api\/admin\/words\/(\d+)\/images\/(\d+)\/delete$/);
  if (deleteImageMatch) {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    const session = await verifySession(getAuthToken(request));
    if (!session || session.role !== 'admin') return json(response, 403, { error: '仅管理员可访问' });
    const wordId = Number(deleteImageMatch[1]);
    const imageId = Number(deleteImageMatch[2]);
    const image = await findWordImage(imageId);
    if (!image || image.wordId !== wordId) return json(response, 404, { error: '图片不存在' });
    if (image.isActive) return json(response, 400, { error: '不能删除当前正在使用的图片，请先切换到其他图片' });
    await deleteWordImage(imageId);
    // 若是生成的本地文件，顺便从磁盘删除
    if (isGeneratedImageUrl(image.imageUrl)) {
      const filename = path.resolve(ROOT, image.imageUrl.replace(/^\/+/, ''));
      if (filename.startsWith(`${ROOT}${path.sep}`) && existsSync(filename)) {
        try { await unlink(filename); } catch { /* 忽略磁盘删除失败 */ }
      }
    }
    return json(response, 200, { success: true });
  }
  
  const selectImageMatch = request.method === 'POST' && url.pathname.match(/^\/api\/admin\/words\/(\d+)\/select-image$/);
  if (selectImageMatch) {
    if (!databaseReady) return json(response, 503, { error: '数据库未就绪' });
    
    // 验证管理员权限
    const token = getAuthToken(request);
    const session = await verifySession(token);
    if (!session || session.role !== 'admin') {
      return json(response, 403, { error: '仅管理员可以替换图片' });
    }
    
    const id = Number(selectImageMatch[1]);
    const word = await findWord(id);
    if (!word) return json(response, 404, { error: '单词不存在' });
    const { imageUrl } = await readJson(request);
    const filename = typeof imageUrl === 'string' ? path.resolve(ROOT, imageUrl.replace(/^\/+/, '')) : '';
    if (!isGeneratedImageUrl(imageUrl) || !existsSync(filename)) return json(response, 400, { error: '候选图片无效或已失效' });
    const updated = await saveGeneratedImage(id, imageUrl);
    return json(response, 200, { word: updated });
  }
  if (request.method === 'GET' || request.method === 'HEAD') return serveStatic(response, url.pathname);
  json(response, 404, { error: '接口不存在' });
}

try {
  await connectDatabase();
  await ensureDefaultAdmin();
  databaseReady = true;
  console.log(`MySQL connected and ${FALLBACK_WORDS.length} demo words seeded.`);
  console.log('Starting session cleanup interval...');
  // 每小时清理过期会话
  setInterval(() => cleanupExpiredSessions().catch(console.error), 60 * 60 * 1000);
} catch (error) {
  if (process.env.DB_REQUIRED === 'true') throw error;
  console.warn(`MySQL unavailable, using local fallback: ${error.message}`);
}

createServer((request, response) => {
  handler(request, response).catch(error => {
    console.error(error);
    json(response, error.statusCode || 500, { error: error.message || '服务器内部错误' });
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`DanCi server: http://127.0.0.1:${PORT}`);
});
