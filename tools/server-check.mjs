import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { WORDS } from '../apps/user-h5/data/word2-words.js';
import { buildImagePrompt, isGeneratedImageUrl, isRetryableAnalysisError, resolveApiKeys } from '../server/image-generation.js';

assert.equal(WORDS.length, 114);
assert.ok(WORDS.every(word => word.word && word.phonetic && word.meaning));
assert.ok(WORDS.every(word => existsSync(path.join('apps/user-h5', word.imageUrl))), '重命名后的图片必须全部存在');
assert.equal(readdirSync('apps/user-h5/data/word/2/1').some(name => /^[0-9a-f]{32}\./.test(name)), false);
assert.equal(readdirSync('apps/user-h5/data/word/1/1').some(name => /^[0-9a-f]{32}\./.test(name)), false);
assert.deepEqual(resolveApiKeys({ OPENAI_API_KEY: 'shared' }), { text: 'shared', image: 'shared' });
assert.deepEqual(resolveApiKeys({ OPENAI_API_KEY: 'shared', TEXT_API_KEY: 'text', IMAGE_API_KEY: 'image' }), { text: 'text', image: 'image' });
assert.equal(isGeneratedImageUrl('/generated/order-123456.png'), true);
assert.equal(isGeneratedImageUrl('/data/word/1/1/order.png'), false);
assert.equal(isGeneratedImageUrl('/generated/../order-123.png'), false);
assert.equal(isRetryableAnalysisError(new Error('谐音字母分组没有完整覆盖单词')), true);
assert.equal(isRetryableAnalysisError(new Error('AI 服务暂时不可用')), false);

const simplePrompt = buildImagePrompt(WORDS[0], { category: 'simple_or_compound' });
assert.ok(simplePrompt.includes(WORDS[0].word));
assert.ok(simplePrompt.includes('自由词素'));
assert.ok(simplePrompt.includes('4:3 横版'));

const divide = { word: 'divide', phonetic: '/dɪˈvaɪd/', partOfSpeech: 'v.', meaning: '分开，划分；除以' };
const complexPrompt = buildImagePrompt(divide, {
  category: 'complex_root_affix',
  word: 'divide', phonetic: '/dɪˈvaɪd/', partOfSpeech: 'v.', meaning: '分开，划分；除以',
  homophoneChinese: ['弟', '外', '的'], homophoneSegments: ['di', 'vi', 'de'],
  rootsAffixes: [{ segment: 'di-/dis-', type: 'prefix', meaning: '分开/偏离' }, { segment: 'vid/vis', type: 'root', meaning: '看/分开' }],
  mnemonic: '弟弟跑到外面的空地上，把蛋糕分开。'
});
assert.ok(complexPrompt.includes('谐音对应：弟 外 的（对应 di - vi - de）'));
assert.ok(complexPrompt.includes('词根词缀：di-/dis-（前缀：分开/偏离） + vid/vis（词根：看/分开）'));
assert.ok(complexPrompt.includes('这是谐音对应关系，不是词根词缀拆分。'));

console.log('server-check passed');
