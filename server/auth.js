import crypto from 'node:crypto';
import { createUser, findUserByUsername, findUserById, findUserByWechatOpenid, createWechatUser, updateLastLogin, createSession, findSessionByToken, deleteSession, deleteExpiredSessions } from './db.js';
import { readConfig, validateConfig } from './config.js';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7天

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 使用 Node.js 内置的 scrypt 替代 bcrypt
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}

export async function registerUser(username, password, role = 'user') {
  // 验证用户名格式
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    throw new Error('用户名只能包含字母、数字和下划线，长度3-20个字符');
  }
  
  // 验证密码强度
  if (password.length < 6) {
    throw new Error('密码至少需要6个字符');
  }
  
  // 检查用户名是否已存在
  const existing = await findUserByUsername(username);
  if (existing) {
    throw new Error('用户名已存在');
  }
  
  // 哈希密码
  const hash = await hashPassword(password);
  
  // 创建用户
  const userId = await createUser(username, hash, role);
  
  return { userId, username, role };
}

export async function loginUser(username, password) {
  // 查找用户
  const user = await findUserByUsername(username);
  if (!user) {
    throw new Error('用户名或密码错误');
  }
  
  // 验证密码
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    throw new Error('用户名或密码错误');
  }
  
  // 更新最后登录时间
  await updateLastLogin(user.id);
  
  // 创建会话
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  await createSession(user.id, token, expiresAt);
  
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
}

export async function wechatLogin(code) {
  if (typeof code !== 'string' || !code.trim()) {
    const error = new Error('微信登录 code 无效');
    error.statusCode = 400;
    throw error;
  }
  const config = validateConfig(readConfig(), { requireWechat: true });
  const endpoint = new URL('https://api.weixin.qq.com/sns/jscode2session');
  endpoint.search = new URLSearchParams({
    appid: config.wechat.appId,
    secret: config.wechat.appSecret,
    js_code: code.trim(),
    grant_type: 'authorization_code'
  });
  let response;
  try {
    response = await fetch(endpoint, { signal: AbortSignal.timeout(10000) });
  } catch {
    const error = new Error('微信登录服务暂时不可用');
    error.statusCode = 503;
    throw error;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.errcode || !payload.openid) {
    const error = new Error(payload.errmsg || '微信登录失败，请重试');
    error.statusCode = response.ok ? 401 : 503;
    throw error;
  }

  let user = await findUserByWechatOpenid(payload.openid);
  if (!user) user = await createWechatUser(payload.openid);
  await updateLastLogin(user.id);
  const token = generateToken();
  await createSession(user.id, token, new Date(Date.now() + SESSION_DURATION));
  return {
    token,
    user: { id: user.id, username: user.username, role: user.role }
  };
}

export async function verifySession(token) {
  if (!token) return null;
  
  const session = await findSessionByToken(token);
  if (!session) return null;
  
  return {
    userId: session.user_id,
    username: session.username,
    role: session.role
  };
}

export async function logout(token) {
  if (token) {
    await deleteSession(token);
  }
}

export async function cleanupExpiredSessions() {
  await deleteExpiredSessions();
}

// 权限检查中间件
export function requireAuth(requiredRole = null) {
  return async (request) => {
    const token = request.headers.authorization?.replace('Bearer ', '') || request.cookies?.token;
    const session = await verifySession(token);
    
    if (!session) {
      const error = new Error('未登录或会话已过期');
      error.statusCode = 401;
      throw error;
    }
    
    if (requiredRole && session.role !== requiredRole) {
      const error = new Error('权限不足');
      error.statusCode = 403;
      throw error;
    }
    
    return session;
  };
}
