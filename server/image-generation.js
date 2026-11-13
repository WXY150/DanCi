import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_DIR = path.join(import.meta.dirname, 'generated');
const SIMPLE_PROMPT = readFileSync(path.join(import.meta.dirname, 'prompts', 'simple-or-compound.txt'), 'utf8');
const COMPLEX_PROMPT = readFileSync(path.join(import.meta.dirname, 'prompts', 'complex-root-affix.txt'), 'utf8');

const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['category', 'classificationReason', 'word', 'phonetic', 'partOfSpeech', 'meaning', 'homophoneChinese', 'homophoneSegments', 'rootsAffixes', 'mnemonic'],
  properties: {
    category: { type: 'string', enum: ['simple_or_compound', 'complex_root_affix'] },
    classificationReason: { type: 'string' },
    word: { type: 'string' },
    phonetic: { type: 'string' },
    partOfSpeech: { type: 'string' },
    meaning: { type: 'string' },
    homophoneChinese: { type: 'array', items: { type: 'string' } },
    homophoneSegments: { type: 'array', items: { type: 'string' } },
    rootsAffixes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['segment', 'type', 'meaning'],
        properties: {
          segment: { type: 'string' },
          type: { type: 'string', enum: ['prefix', 'root', 'suffix'] },
          meaning: { type: 'string' }
        }
      }
    },
    mnemonic: { type: 'string' }
  }
};

function outputText(payload) {
  if (payload.output_text) return payload.output_text;
  return payload.output?.flatMap(item => item.content || []).find(item => item.type === 'output_text')?.text || '';
}

function apiError(payload, status, fallback) {
  if (status === 429) return 'AI 请求较多，请稍后重试';
  if (status >= 500) return 'AI 服务暂时不可用，请稍后重试';
  return payload.error?.message || fallback;
}

export function resolveApiKeys(env = process.env) {
  return {
    text: env.TEXT_API_KEY || env.OPENAI_API_KEY,
    image: env.IMAGE_API_KEY || env.OPENAI_API_KEY
  };
}

export function isGeneratedImageUrl(value) {
  return typeof value === 'string' && /^\/generated\/[a-z0-9-]+-\d+\.png$/.test(value);
}

export function isRetryableAnalysisError(error) {
  return ['复杂词缺少可靠的词根词缀分析', '谐音字母分组没有完整覆盖单词', '中文谐音与字母分组数量不一致'].includes(error?.message);
}

async function openaiFetch(url, options) {
  let response;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(url, options);
    if (response.status !== 429 && response.status < 500) return response;
    if (attempt < 2) {
      await response.arrayBuffer();
      await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1)));
    }
  }
  return response;
}

export async function analyzeWord(word) {
  const { text: apiKey } = resolveApiKeys();
  if (!apiKey) throw new Error('文本分析服务尚未配置，请先设置 TEXT_API_KEY 或 OPENAI_API_KEY');
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const response = await openaiFetch(`${baseUrl}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.TEXT_MODEL || 'gpt-5.4',
      instructions: `你是考研英语构词分析员。请先分类，再为复杂词生成准确的谐音记忆模板。

分类规则：
1. simple_or_compound：没有可靠、适合教学的词根词缀拆分的简单词；或者可完整拆成两个及以上现代英语独立单词的自由词素复合词。
2. complex_root_affix：存在可靠词根、前缀或后缀拆分，且这些构词单位不是独立现代英语单词。
3. 不得按单词长度判断，不得假拆；自由词素复合词优先归入 simple_or_compound。

复杂词必须给出：准确 IPA、词性与核心释义；中文谐音及覆盖原词全部连续字母且不重叠的字母分组；真实词根词缀；一句自然的中文拆解联想。谐音对应不是词根词缀拆分。简单词的 rootsAffixes 返回空数组，其余字段仍返回便于校验。`,
      input: `请分析这个单词：${word.word}\n现有词性：${word.partOfSpeech || '未提供'}\n现有释义：${word.meaning || '未提供'}\n现有音标：${word.phonetic || '未提供'}`,
      reasoning: { effort: 'low' },
      text: {
        format: {
          type: 'json_schema',
          name: 'word_card_analysis',
          strict: true,
          schema: ANALYSIS_SCHEMA
        }
      },
      store: false
    }),
    signal: AbortSignal.timeout(90000)
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(apiError(payload, response.status, '单词分类失败'));
    error.statusCode = response.status;
    throw error;
  }
  const text = outputText(payload);
  if (!text) throw new Error('单词分类结果为空');
  const analysis = JSON.parse(text);
  const segments = analysis.homophoneSegments.map(segment => segment.trim().toLowerCase());
  if (analysis.category === 'complex_root_affix') {
    if (!analysis.rootsAffixes.length) throw new Error('复杂词缺少可靠的词根词缀分析');
    if (segments.join('') !== word.word.toLowerCase()) throw new Error('谐音字母分组没有完整覆盖单词');
    if (analysis.homophoneChinese.length !== segments.length) throw new Error('中文谐音与字母分组数量不一致');
  }
  return analysis;
}

function complexWordTemplate(word, analysis) {
  const roots = analysis.rootsAffixes
    .map(item => `${item.segment}（${item.type === 'prefix' ? '前缀' : item.type === 'suffix' ? '后缀' : '词根'}：${item.meaning}）`)
    .join(' + ');
  return `${analysis.word || word.word} ${analysis.partOfSpeech || word.partOfSpeech} ${analysis.meaning || word.meaning}
音标：${analysis.phonetic || word.phonetic}
谐音对应：${analysis.homophoneChinese.join(' ')}（对应 ${analysis.homophoneSegments.join(' - ')}）
词根词缀：${roots}
拆解联想：${analysis.mnemonic}
这是谐音对应关系，不是词根词缀拆分。`;
}

export function buildImagePrompt(word, analysis) {
  if (analysis.category === 'complex_root_affix') {
    return `${COMPLEX_PROMPT.replaceAll('{WORD}', word.word)}\n\n本次必须使用以下单词模板：\n${complexWordTemplate(word, analysis)}\n\n不要输出分析，直接生成最终 4:3 图片。`;
  }
  return `${SIMPLE_PROMPT}\n\n${word.word}\n\n不要输出分析，直接生成最终 4:3 图片。`;
}

export function imageGenerationConfigured() {
  return Boolean(resolveApiKeys().image);
}

export async function generateWordImage(word) {
  const { image: apiKey } = resolveApiKeys();
  if (!apiKey) {
    const error = new Error('图片生成服务尚未配置，请先设置 IMAGE_API_KEY 或 OPENAI_API_KEY');
    error.statusCode = 503;
    throw error;
  }

  let analysis;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      analysis = await analyzeWord(word);
      break;
    } catch (error) {
      if (attempt || !isRetryableAnalysisError(error)) throw error;
    }
  }
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const response = await openaiFetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.IMAGE_MODEL || 'gpt-image-2',
      prompt: buildImagePrompt(word, analysis),
      size: process.env.IMAGE_SIZE || '1536x1152'
    }),
    signal: AbortSignal.timeout(150000)
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(apiError(payload, response.status, 'AI 图片生成失败'));
    error.statusCode = response.status;
    throw error;
  }

  const base64 = payload.data?.[0]?.b64_json;
  if (!base64) throw new Error('AI 图片生成结果为空');
  await mkdir(OUTPUT_DIR, { recursive: true });
  const safeWord = word.word.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const filename = `${safeWord}-${Date.now()}.png`;
  await writeFile(path.join(OUTPUT_DIR, filename), Buffer.from(base64, 'base64'));
  return `/generated/${filename}`;
}
