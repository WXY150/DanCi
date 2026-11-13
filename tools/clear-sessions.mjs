// 一次性运维脚本：清空所有登录会话，使所有残留登录态失效（用于"强制下线"）。
import { loadEnvFile } from 'node:process';
loadEnvFile?.();
import mysql from 'mysql2/promise';

const options = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'danci'
};

try {
  const pool = mysql.createPool(options);
  const [result] = await pool.execute('DELETE FROM sessions');
  console.log(`Cleared ${result.affectedRows} session(s). All logins are now logged out.`);
  await pool.end();
} catch (error) {
  console.error('Failed to clear sessions:', error.message);
  process.exitCode = 1;
}
