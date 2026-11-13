import { WORDS as LOCAL_WORDS, WORD_BANK_META } from '../data/word2-words.js';
import { analyzeWordStructure } from '../data/word-roots.js';
import { findConfusableGroup } from '../data/confusable-words.js';

// 后续可把本地实现替换为小程序云函数或后端 API，页面只依赖这个契约。
const DAILY_WORD_COUNT = 20;
const WORDS = [...LOCAL_WORDS];

function dayOfYear(date) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((current - start) / 86400000);
}

function clampCount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(5, Math.round(parsed))) : DAILY_WORD_COUNT;
}

function sliceRound(offset, count) {
  const size = Math.min(clampCount(count), WORDS.length);
  const start = ((Number(offset) || 0) % WORDS.length + WORDS.length) % WORDS.length;
  return Array.from({ length: size }, (_, index) => WORDS[(start + index) % WORDS.length]);
}

function hasBeenStudied(progress = {}, id) {
  const item = progress[id] || progress[String(id)] || {};
  return Number(item.known) > 0 || Number(item.unknown) > 0 || Number(item.stage) > 0;
}

function nextNewWords(progress = {}, offset = 0, count = DAILY_WORD_COUNT) {
  const size = Math.min(clampCount(count), WORDS.length);
  const start = ((Number(offset) || 0) % WORDS.length + WORDS.length) % WORDS.length;
  const unseenIds = new Set(WORDS.filter(word => !hasBeenStudied(progress, word.id)).map(word => word.id));
  const selected = [];
  let nextOffset = start;

  for (let step = 0; step < WORDS.length && selected.length < size; step += 1) {
    const index = (start + step) % WORDS.length;
    const word = WORDS[index];
    if (!unseenIds.size || unseenIds.has(word.id)) {
      selected.push(word);
      nextOffset = (index + 1) % WORDS.length;
    }
  }

  return { words: selected, nextOffset };
}

export const contentProvider = {
  getDailyOffset(date = new Date(), count = DAILY_WORD_COUNT) {
    return (dayOfYear(date) * clampCount(count)) % WORDS.length;
  },

  listTodayWords(date = new Date(), count = DAILY_WORD_COUNT) {
    return sliceRound(this.getDailyOffset(date, count), count);
  },

  listRoundWords(offset = 0, count = DAILY_WORD_COUNT) {
    return sliceRound(offset, count);
  },

  listNextNewWords(progress = {}, offset = 0, count = DAILY_WORD_COUNT) {
    return nextNewWords(progress, offset, count);
  },

  listWordsByIds(ids = []) {
    const wanted = new Set(ids.map(Number));
    return WORDS.filter(word => wanted.has(word.id));
  },

  async listWordBank() {
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/words');
        if (response.ok) {
          const payload = await response.json();
          if (Array.isArray(payload.words) && payload.words.length) WORDS.splice(0, WORDS.length, ...payload.words);
        }
      } catch {
        // 静态预览或后端未启动时继续使用同一批本地演示数据。
      }
    }
    return WORDS;
  },

  getMeta() {
    return WORD_BANK_META;
  },

  // 获取单词的词根词缀分析
  getWordAnalysis(word) {
    return analyzeWordStructure(word);
  },

  // 获取单词的形近词组
  getConfusableWords(word) {
    return findConfusableGroup(word);
  }
};
