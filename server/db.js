import mysql from 'mysql2/promise';
import crypto from 'node:crypto';
import { WORDS } from '../data/word2-words.js';

let pool;

// 密码哈希函数
export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

function config() {
  const database = process.env.MYSQL_DATABASE || 'danci';
  if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error('MYSQL_DATABASE 只能包含字母、数字和下划线');
  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database
  };
}

export async function connectDatabase() {
  const options = config();
  const bootstrap = await mysql.createConnection({ ...options, database: undefined });
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${options.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await bootstrap.end();

  pool = mysql.createPool({ ...options, waitForConnections: true, connectionLimit: 5 });
  
  // 创建用户表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login_at TIMESTAMP NULL DEFAULT NULL,
      INDEX idx_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // 创建会话表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      token VARCHAR(64) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_token (token),
      INDEX idx_user_id (user_id),
      INDEX idx_expires_at (expires_at),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // 创建单词表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS words (
      id INT UNSIGNED PRIMARY KEY,
      word VARCHAR(100) NOT NULL UNIQUE,
      phonetic VARCHAR(255) NOT NULL DEFAULT '',
      part_of_speech VARCHAR(80) NOT NULL DEFAULT '',
      meaning TEXT NOT NULL,
      mnemonic TEXT NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      image_version INT UNSIGNED NOT NULL DEFAULT 1,
      source VARCHAR(100) NOT NULL DEFAULT 'word2-demo',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 创建用户进度表（按用户云端保存学习进度）
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_progress (
      user_id INT UNSIGNED PRIMARY KEY,
      state_json MEDIUMTEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 创建单词图片历史表（记录每个单词用过的所有图片）
  await pool.query(`
    CREATE TABLE IF NOT EXISTS word_images (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      word_id INT UNSIGNED NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_word_image (word_id, image_url),
      INDEX idx_word_id (word_id),
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const sql = `
    INSERT INTO words (id, word, phonetic, part_of_speech, meaning, mnemonic, image_url, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'word2-demo')
    ON DUPLICATE KEY UPDATE
      phonetic = VALUES(phonetic),
      part_of_speech = VALUES(part_of_speech),
      meaning = VALUES(meaning),
      mnemonic = VALUES(mnemonic)
  `;
  for (const word of WORDS) {
    await pool.execute(sql, [word.id, word.word, word.phonetic, word.partOfSpeech, word.meaning, word.mnemonic, word.imageUrl]);
  }

  // 将每个单词当前的图片补录进历史表（若尚未记录），并标记为启用
  await pool.query(`
    INSERT IGNORE INTO word_images (word_id, image_url, is_active)
    SELECT id, image_url, 1 FROM words WHERE image_url <> ''
  `);
  return pool;
}

function mapWord(row) {
  return {
    id: row.id,
    word: row.word,
    phonetic: row.phonetic,
    partOfSpeech: row.part_of_speech,
    meaning: row.meaning,
    mnemonic: row.mnemonic,
    imageUrl: row.image_url,
    imageVersion: row.image_version
  };
}

export async function listWords() {
  const [rows] = await pool.query('SELECT * FROM words ORDER BY id');
  return rows.map(mapWord);
}

export async function findWord(id) {
  const [rows] = await pool.execute('SELECT * FROM words WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? mapWord(rows[0]) : null;
}

// 按拼写查单词（用于新增时查重）
export async function findWordByText(word) {
  const [rows] = await pool.execute('SELECT * FROM words WHERE word = ? LIMIT 1', [word]);
  return rows[0] ? mapWord(rows[0]) : null;
}

// 新增单词（后台界面创建），返回新单词
export async function createWord({ word, phonetic = '', partOfSpeech = '', meaning = '', mnemonic = '', imageUrl = '' }) {
  const [[{ maxId }]] = await pool.query('SELECT COALESCE(MAX(id), 200000) AS maxId FROM words');
  const id = Number(maxId) + 1;
  await pool.execute(
    `INSERT INTO words (id, word, phonetic, part_of_speech, meaning, mnemonic, image_url, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'admin-added')`,
    [id, word, phonetic, partOfSpeech, meaning, mnemonic, imageUrl]
  );
  if (imageUrl) {
    await pool.execute(
      'INSERT IGNORE INTO word_images (word_id, image_url, is_active) VALUES (?, ?, 1)',
      [id, imageUrl]
    );
  }
  return findWord(id);
}

export async function saveGeneratedImage(id, imageUrl) {
  // 记录到历史表（去重），并把它设为当前启用图片
  await pool.execute(
    'INSERT INTO word_images (word_id, image_url, is_active) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE is_active = 1',
    [id, imageUrl]
  );
  await pool.execute('UPDATE word_images SET is_active = 0 WHERE word_id = ? AND image_url <> ?', [id, imageUrl]);
  await pool.execute('UPDATE words SET image_url = ?, image_version = image_version + 1 WHERE id = ?', [imageUrl, id]);
  return findWord(id);
}

// ==================== 单词图片历史 ====================

// 记录一张新生成的候选图片（尚未启用）
export async function recordWordImage(wordId, imageUrl) {
  await pool.execute(
    'INSERT INTO word_images (word_id, image_url, is_active) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE image_url = image_url',
    [wordId, imageUrl]
  );
}

// 列出某个单词的所有历史图片（启用的排在最前，其余按时间倒序）
export async function listWordImages(wordId) {
  const [rows] = await pool.execute(
    'SELECT id, image_url, is_active, created_at FROM word_images WHERE word_id = ? ORDER BY is_active DESC, created_at DESC',
    [wordId]
  );
  return rows.map(row => ({
    id: row.id,
    imageUrl: row.image_url,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at
  }));
}

// 查询单条历史图片
export async function findWordImage(imageId) {
  const [rows] = await pool.execute('SELECT id, word_id, image_url, is_active FROM word_images WHERE id = ? LIMIT 1', [imageId]);
  if (!rows[0]) return null;
  return { id: rows[0].id, wordId: rows[0].word_id, imageUrl: rows[0].image_url, isActive: Boolean(rows[0].is_active) };
}

// 启用某张历史图片作为当前图片
export async function activateWordImage(wordId, imageUrl) {
  await pool.execute('UPDATE word_images SET is_active = 0 WHERE word_id = ?', [wordId]);
  await pool.execute(
    'INSERT INTO word_images (word_id, image_url, is_active) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE is_active = 1',
    [wordId, imageUrl]
  );
  await pool.execute('UPDATE words SET image_url = ?, image_version = image_version + 1 WHERE id = ?', [imageUrl, wordId]);
  return findWord(wordId);
}

// 删除一张历史图片
export async function deleteWordImage(imageId) {
  await pool.execute('DELETE FROM word_images WHERE id = ?', [imageId]);
}

export async function checkDatabase() {
  await pool.query('SELECT 1');
}

// ==================== 用户认证相关 ====================

export async function createUser(username, passwordHash, role = 'user') {
  const [result] = await pool.execute(
    'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
    [username, passwordHash, role]
  );
  return result.insertId;
}

export async function findUserByUsername(username) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function updateLastLogin(userId) {
  await pool.execute('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
}

export async function createSession(userId, token, expiresAt) {
  await pool.execute(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
}

export async function findSessionByToken(token) {
  const [rows] = await pool.execute(
    'SELECT s.*, u.username, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > NOW() LIMIT 1',
    [token]
  );
  return rows[0] || null;
}

export async function deleteSession(token) {
  await pool.execute('DELETE FROM sessions WHERE token = ?', [token]);
}

export async function deleteExpiredSessions() {
  await pool.execute('DELETE FROM sessions WHERE expires_at <= NOW()');
}

export async function ensureDefaultAdmin() {
  const adminExists = await findUserByUsername('admin');
  if (!adminExists) {
    // 默认管理员密码：admin123（生产环境应立即修改）
    const hash = await hashPassword('admin123');
    await createUser('admin', hash, 'admin');
    console.log('Created default admin user (username: admin, password: admin123)');
  }
}

// ==================== 用户进度云端存储 ====================

export async function upsertUserProgress(userId, stateJson) {
  await pool.execute(
    'INSERT INTO user_progress (user_id, state_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE state_json = VALUES(state_json), updated_at = CURRENT_TIMESTAMP',
    [userId, stateJson]
  );
}

export async function getUserProgress(userId) {
  const [rows] = await pool.execute('SELECT state_json FROM user_progress WHERE user_id = ? LIMIT 1', [userId]);
  return rows[0] ? rows[0].state_json : null;
}

export async function deleteUserProgress(userId) {
  await pool.execute('DELETE FROM user_progress WHERE user_id = ?', [userId]);
}

// ==================== 管理端：账户管理 ====================

export async function listAllUsers() {
  const [rows] = await pool.query(`
    SELECT u.id, u.username, u.role, u.created_at, u.last_login_at,
      (up.state_json IS NOT NULL) AS has_progress,
      COALESCE(JSON_LENGTH(JSON_EXTRACT(up.state_json, '$.completedIds')), 0) AS completed_words
    FROM users u
    LEFT JOIN user_progress up ON up.user_id = u.id
    ORDER BY u.id
  `);
  return rows;
}

export async function deleteUserById(userId) {
  // sessions 与 user_progress 通过外键 ON DELETE CASCADE 一并删除
  await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
}

export async function updateUserRole(userId, role) {
  await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
}
