import { WORDS as NETEM_WORDS } from './words.js';

const IMAGE_WORDS = [
  'upend', 'organ', 'ecology', 'express', 'manage', 'underlie', 'outset', 'determined',
  'remain', 'program', 'undercut', 'achieve', 'oversee', 'century', 'decline', 'divide',
  'undergo', 'during', 'overwhelm', 'similar', 'up', 'intellect', 'upheaval', 'overlook',
  'determine', 'overhaul', 'decade', 'overarching', 'outrage', 'out', 'update', 'overturn',
  'try', 'concern', 'outbreak', 'overcome', 'uphold', 'schedule', 'leave', 'literate',
  'part', 'paragraph', 'screen', 'probable', 'emerge', 'outline', 'trouble', 'upholstered',
  'body', 'undercover', 'earnings', 'overshadow', 'outcome', 'decide', 'outlet', 'limit',
  'word', 'hand', 'head', 'overrule', 'output', 'describe', 'author', 'over', 'particular',
  'wage', 'salary', 'level', 'depart', 'income', 'fair', 'under', 'hundred', 'analyze',
  'assume', 'upset'
];

const FALLBACKS = {
  upend: ['/ʌpˈend/', 'v.', '颠倒；翻转；彻底改变'],
  determined: ['/dɪˈtɜːmɪnd/', 'adj.', '坚定的；有决心的'],
  undercut: ['/ˌʌndəˈkʌt/', 'v.', '削弱；以低价竞争'],
  oversee: ['/ˌəʊvəˈsiː/', 'v.', '监督；管理'],
  intellect: ['/ˈɪntəlekt/', 'n.', '智力；理解力'],
  upheaval: ['/ʌpˈhiːvl/', 'n.', '剧变；动荡'],
  overarching: ['/ˌəʊvərˈɑːtʃɪŋ/', 'adj.', '首要的；总体的'],
  literate: ['/ˈlɪtərət/', 'adj.', '有读写能力的；有文化的'],
  upholstered: ['/ʌpˈhəʊlstəd/', 'adj.', '装有软垫的'],
  undercover: ['/ˌʌndəˈkʌvə/', 'adj.', '秘密的；暗中进行的'],
  earnings: ['/ˈɜːnɪŋz/', 'n.', '收入；收益'],
  overshadow: ['/ˌəʊvəˈʃædəʊ/', 'v.', '使黯然失色；遮蔽'],
  overrule: ['/ˌəʊvəˈruːl/', 'v.', '否决；驳回'],
  analyze: ['/ˈænəlaɪz/', 'v.', '分析']
};

const netemByWord = new Map(NETEM_WORDS.map(word => [word.word.toLowerCase(), word]));

export const WORD_BANK_META = {
  source: '演示图片词库 / NETEM 释义',
  version: '2026-08-23 demo',
  license: '演示图片授权待确认',
  count: IMAGE_WORDS.length
};

export const WORDS = IMAGE_WORDS.map((name, index) => {
  const netem = netemByWord.get(name);
  const fallback = FALLBACKS[name] || ['', '', ''];
  const extension = name === 'underlie' || name === 'outrage' ? 'png' : 'jpg';
  return {
    ...(netem || {}),
    id: 100001 + index,
    word: name,
    phonetic: netem?.phonetic || fallback[0],
    partOfSpeech: netem?.partOfSpeech || fallback[1],
    meaning: netem?.meaning || fallback[2],
    mnemonic: '结合图片场景回忆单词含义。',
    imageUrl: `data/word/1/1/${name}.${extension}`,
    sourceRank: index + 1
  };
});
