import path from 'node:path';

function optionalNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function readConfig(env = process.env) {
  return {
    port: optionalNumber(env.PORT, 4173),
    publicOrigin: String(env.PUBLIC_ORIGIN || '').replace(/\/$/, ''),
    corsOrigins: String(env.CORS_ORIGINS || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean),
    sessionSecret: env.SESSION_SECRET || '',
    wechat: {
      appId: env.WECHAT_APP_ID || '',
      appSecret: env.WECHAT_APP_SECRET || ''
    },
    imageDir: path.resolve(env.IMAGE_DIR || path.join(import.meta.dirname, '..', 'generated')),
    databaseRequired: env.DB_REQUIRED === 'true'
  };
}

export function validateConfig(config = readConfig(), { requireWechat = false, requireSessionSecret = false } = {}) {
  const errors = [];
  if (requireWechat && (!config.wechat.appId || !config.wechat.appSecret)) {
    errors.push('WECHAT_APP_ID 和 WECHAT_APP_SECRET 必须同时配置');
  }
  if (requireSessionSecret && config.sessionSecret.length < 32) {
    errors.push('SESSION_SECRET 必须至少包含 32 个字符');
  }
  if (errors.length) throw new Error(errors.join('；'));
  return config;
}

export function isAllowedOrigin(origin, config = readConfig()) {
  if (!origin) return true;
  return config.corsOrigins.includes(origin) || origin === config.publicOrigin;
}
