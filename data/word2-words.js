import { WORDS as NETEM_WORDS } from './words.js';
import { WORD_DETAILS } from './demo-word-details.js';

// 修改全部单词的默认记忆提示，或在 WORD_MEMORY_HINTS 中按单词单独覆盖。
export const DEFAULT_MEMORY_HINT = '结合词义和词形进行回忆。AI并不绝对准确，如有冲突，请以图片以外的文字为准';
export const WORD_MEMORY_HINTS = {};

const IMAGE_FILES = [
  ['conservative', 'png'], ['associate', 'png'], ['publish', 'png'], ['fair', 'png'],
  ['just', 'png'], ['observe', 'png'], ['communicate', 'png'], ['govern', 'png'],
  ['wish', 'png'], ['law', 'png'], ['order', 'png'], ['generate', 'png'], ['norm', 'png'],
  ['suppose', 'png'], ['distant', 'jpg'], ['private', 'png'], ['politics', 'png'],
  ['legal', 'png'], ['bias', 'jpg'], ['adjust', 'jpg'], ['enjoy', 'png'], ['common', 'png'],
  ['custom', 'png'], ['regulate', 'png'], ['temple', 'png'], ['memorable', 'jpg'],
  ['curious', 'jpg'], ['community', 'png'], ['vivid', 'png'], ['dominate', 'png'],
  ['judge', 'png'], ['provide', 'png'], ['consume', 'jpg'], ['serve', 'png'],
  ['appreciate', 'jpg'], ['public', 'png'], ['policy', 'png'], ['popular', 'png'], ['social', 'png']
];

const ADDITIONAL_IMAGE_FILES = [
  ['upend', 'jpg'], ['organ', 'jpg'], ['ecology', 'jpg'], ['express', 'jpg'], ['manage', 'jpg'],
  ['underlie', 'png'], ['outset', 'jpg'], ['determined', 'jpg'], ['remain', 'jpg'], ['program', 'jpg'],
  ['undercut', 'jpg'], ['achieve', 'jpg'], ['oversee', 'jpg'], ['century', 'jpg'], ['decline', 'jpg'],
  ['divide', 'jpg'], ['undergo', 'jpg'], ['during', 'jpg'], ['overwhelm', 'jpg'], ['similar', 'jpg'],
  ['up', 'jpg'], ['intellect', 'jpg'], ['upheaval', 'jpg'], ['overlook', 'jpg'], ['determine', 'jpg'],
  ['overhaul', 'jpg'], ['decade', 'jpg'], ['overarching', 'jpg'], ['outrage', 'png'], ['out', 'jpg'],
  ['update', 'jpg'], ['overturn', 'jpg'], ['try', 'jpg'], ['concern', 'jpg'], ['outbreak', 'jpg'],
  ['overcome', 'jpg'], ['uphold', 'jpg'], ['schedule', 'jpg'], ['leave', 'jpg'], ['literate', 'jpg'],
  ['part', 'jpg'], ['paragraph', 'jpg'], ['screen', 'jpg'], ['probable', 'jpg'], ['emerge', 'jpg'],
  ['outline', 'jpg'], ['trouble', 'jpg'], ['upholstered', 'jpg'], ['body', 'jpg'], ['undercover', 'jpg'],
  ['earnings', 'jpg'], ['overshadow', 'jpg'], ['outcome', 'jpg'], ['outlet', 'jpg'], ['limit', 'jpg'],
  ['word', 'jpg'], ['hand', 'jpg'], ['head', 'jpg'], ['overrule', 'jpg'], ['output', 'jpg'],
  ['describe', 'jpg'], ['decide', 'jpg'], ['author', 'jpg'], ['over', 'jpg'], ['particular', 'jpg'], ['wage', 'jpg'],
  ['salary', 'jpg'], ['level', 'jpg'], ['depart', 'jpg'], ['income', 'jpg'], ['hundred', 'jpg'],
  ['analyze', 'jpg'], ['assume', 'jpg'], ['under', 'jpg'], ['upset', 'jpg']
];

const ALL_IMAGE_FILES = [
  ...IMAGE_FILES.map(file => [...file, '2']),
  ...ADDITIONAL_IMAGE_FILES.map(file => [...file, '1'])
];

const netemByWord = new Map(NETEM_WORDS.map(word => [word.word.toLowerCase(), word]));
const FALLBACKS = {
  memorable: { phonetic: '/ˈmemərəbl/', partOfSpeech: 'adj.', meaning: '值得纪念的；难忘的' }
};

function detailPartOfSpeech(meaning = '') {
  return [...new Set(meaning.split('\n').map(line => line.match(/^([a-z]+)\./i)?.[1]).filter(Boolean).map(part => `${part === 'a' ? 'adj' : part}.`))].join(' / ');
}

function normalizePhonetic(value = '') {
  return value && !value.startsWith('/') ? `/${value}/` : value;
}

export const WORD_BANK_META = {
  source: '演示图片词库 1+2 / ECDICT 多义项',
  version: '2026-08-23 mysql demo v2',
  license: '演示图片授权待确认',
  count: ALL_IMAGE_FILES.length
};

export const WORDS = ALL_IMAGE_FILES.map(([name, extension, collection], index) => {
  const netem = netemByWord.get(name);
  const fallback = FALLBACKS[name] || {};
  const detail = WORD_DETAILS[name] || {};
  return {
    ...(netem || {}),
    id: 200001 + index,
    word: name,
    phonetic: normalizePhonetic(detail.phonetic || netem?.phonetic || fallback.phonetic || ''),
    partOfSpeech: detailPartOfSpeech(detail.meaning) || netem?.partOfSpeech || fallback.partOfSpeech || '',
    meaning: detail.meaning || netem?.meaning || fallback.meaning || '释义待补充',
    mnemonic: WORD_MEMORY_HINTS[name] || DEFAULT_MEMORY_HINT,
    imageUrl: `data/word/${collection}/1/${name}.${extension}`,
    sourceRank: index + 1
  };
});
