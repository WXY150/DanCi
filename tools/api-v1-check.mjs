import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 4184;
const child = spawn(process.execPath, ['server/index.js'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port), DB_REQUIRED: 'false' },
  stdio: ['ignore', 'pipe', 'pipe']
});

try {
  const origin = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 30 && !ready; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      const response = await fetch(`${origin}/api/v1/health`);
      ready = response.ok;
    } catch {}
  }
  assert.equal(ready, true, 'v1 server should start');

  const health = await fetch(`${origin}/api/v1/health`).then(response => response.json());
  assert.equal(health.ok, true);

  const wordsResponse = await fetch(`${origin}/api/v1/words`);
  const words = await wordsResponse.json();
  assert.equal(wordsResponse.status, 200);
  assert.equal(words.words.length, 114);
  assert.ok(words.words.every(word => !('candidateImages' in word) && !('imageHistory' in word)));

  const meResponse = await fetch(`${origin}/api/v1/auth/me`);
  const me = await meResponse.json();
  assert.equal(meResponse.status, 401);
  assert.equal(me.error.code, 'unauthorized');

  const missingResponse = await fetch(`${origin}/api/v1/unknown`);
  const missing = await missingResponse.json();
  assert.equal(missingResponse.status, 404);
  assert.equal(missing.error.code, 'not_found');
  console.log('api-v1-check passed');
} finally {
  child.kill();
}
