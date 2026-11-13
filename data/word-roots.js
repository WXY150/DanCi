// 词根词缀数据库
// 每个词根包含：词根、含义、同根词列表
export const WORD_ROOTS = [
  {
    root: 'spect',
    meaning: '看',
    words: ['inspect', 'respect', 'suspect', 'expect', 'aspect', 'prospect', 'spectacle', 'spectrum']
  },
  {
    root: 'dict',
    meaning: '说',
    words: ['predict', 'dictate', 'dictionary', 'contradict', 'verdict', 'indicate', 'dedicate']
  },
  {
    root: 'port',
    meaning: '拿、运',
    words: ['transport', 'export', 'import', 'report', 'support', 'portable', 'porter']
  },
  {
    root: 'scrib/script',
    meaning: '写',
    words: ['describe', 'prescribe', 'subscribe', 'inscribe', 'manuscript', 'scripture', 'transcript']
  },
  {
    root: 'duct',
    meaning: '引导',
    words: ['conduct', 'produce', 'reduce', 'introduce', 'educate', 'deduce', 'abduct']
  },
  {
    root: 'ject',
    meaning: '投、掷',
    words: ['project', 'reject', 'inject', 'object', 'subject', 'eject', 'trajectory']
  },
  {
    root: 'miss/mit',
    meaning: '送、放出',
    words: ['transmit', 'submit', 'admit', 'permit', 'dismiss', 'mission', 'emit', 'omit']
  },
  {
    root: 'pos/pon',
    meaning: '放置',
    words: ['propose', 'compose', 'expose', 'dispose', 'impose', 'suppose', 'postpone', 'position']
  },
  {
    root: 'press',
    meaning: '压',
    words: ['express', 'impress', 'compress', 'suppress', 'depress', 'oppress', 'pressure']
  },
  {
    root: 'tract',
    meaning: '拉、拖',
    words: ['attract', 'contract', 'extract', 'subtract', 'distract', 'abstract', 'tractor']
  },
  {
    root: 'vis/vid',
    meaning: '看见',
    words: ['vision', 'visible', 'visit', 'visual', 'television', 'video', 'evident', 'provide']
  },
  {
    root: 'aud',
    meaning: '听',
    words: ['audio', 'audience', 'auditorium', 'audit', 'audible', 'audition']
  },
  {
    root: 'greg',
    meaning: '群、聚',
    words: ['aggregate', 'congregate', 'segregate', 'gregarious']
  },
  {
    root: 'cred',
    meaning: '相信',
    words: ['credit', 'credible', 'incredible', 'credential', 'credulous', 'discredit']
  },
  {
    root: 'cur/cour',
    meaning: '跑',
    words: ['current', 'occur', 'course', 'recur', 'concur', 'incur', 'cursor', 'courier']
  },
  {
    root: 'form',
    meaning: '形状',
    words: ['reform', 'transform', 'inform', 'conform', 'deform', 'uniform', 'format', 'formula']
  },
  {
    root: 'gen',
    meaning: '产生',
    words: ['generate', 'general', 'genuine', 'generous', 'genesis', 'gene', 'gender', 'genre']
  },
  {
    root: 'graph',
    meaning: '写、画',
    words: ['photograph', 'biography', 'geography', 'paragraph', 'telegraph', 'autograph', 'graphic']
  },
  {
    root: 'log',
    meaning: '说、词',
    words: ['logic', 'dialogue', 'apology', 'catalog', 'monologue', 'biology', 'psychology']
  },
  {
    root: 'man',
    meaning: '手',
    words: ['manage', 'manual', 'manufacture', 'manuscript', 'manipulate', 'manner', 'manicure']
  },
  {
    root: 'path',
    meaning: '感情',
    words: ['sympathy', 'empathy', 'apathy', 'pathetic', 'antipathy', 'telepathy']
  },
  {
    root: 'phon',
    meaning: '声音',
    words: ['telephone', 'microphone', 'symphony', 'phonetic', 'saxophone', 'ophone']
  },
  {
    root: 'struct',
    meaning: '建造',
    words: ['structure', 'construct', 'instruct', 'destroy', 'obstruct', 'infrastructure']
  },
  {
    root: 'tain/ten',
    meaning: '持有、保持',
    words: ['contain', 'maintain', 'obtain', 'sustain', 'retain', 'detain', 'entertain', 'tenant']
  },
  {
    root: 'terr',
    meaning: '土地',
    words: ['territory', 'terrain', 'terrestrial', 'terrace', 'Mediterranean', 'subterranean']
  },
  {
    root: 'voc/vok',
    meaning: '声音、叫',
    words: ['vocal', 'vocabulary', 'advocate', 'provoke', 'invoke', 'revoke', 'vocation']
  }
];

// 前缀数据库
export const PREFIXES = [
  { prefix: 're-', meaning: '再、又、回', examples: ['return', 'review', 'recall', 'rebuild'] },
  { prefix: 'un-', meaning: '不、非', examples: ['unhappy', 'unable', 'unfair', 'unknown'] },
  { prefix: 'in-/im-/il-/ir-', meaning: '不、非', examples: ['incorrect', 'impossible', 'illegal', 'irregular'] },
  { prefix: 'dis-', meaning: '不、相反', examples: ['disagree', 'disappear', 'dishonest', 'dislike'] },
  { prefix: 'pre-', meaning: '在...之前', examples: ['predict', 'preview', 'prepare', 'prevent'] },
  { prefix: 'post-', meaning: '在...之后', examples: ['postwar', 'postpone', 'postgraduate'] },
  { prefix: 'sub-', meaning: '在...下面', examples: ['subway', 'submarine', 'subtitle', 'subdivide'] },
  { prefix: 'super-', meaning: '超级、在...上', examples: ['superior', 'supervise', 'supernatural', 'superficial'] },
  { prefix: 'trans-', meaning: '跨越、转移', examples: ['transport', 'transfer', 'translate', 'transform'] },
  { prefix: 'inter-', meaning: '在...之间', examples: ['international', 'internet', 'interact', 'interview'] },
  { prefix: 'over-', meaning: '过度、在...上', examples: ['overcome', 'overlook', 'overhaul', 'overwhelm'] },
  { prefix: 'under-', meaning: '在...下、不足', examples: ['underground', 'underlie', 'undercut', 'undergo'] },
  { prefix: 'out-', meaning: '超出、向外', examples: ['outcome', 'outlet', 'outbreak', 'outline'] },
  { prefix: 'up-', meaning: '向上', examples: ['update', 'uphold', 'upend', 'upheaval'] }
];

// 后缀数据库
export const SUFFIXES = [
  { suffix: '-able/-ible', meaning: '能够...的', examples: ['readable', 'visible', 'possible', 'comfortable'] },
  { suffix: '-tion/-sion', meaning: '行为、状态', examples: ['action', 'creation', 'decision', 'confusion'] },
  { suffix: '-ment', meaning: '行为、结果', examples: ['movement', 'development', 'treatment', 'agreement'] },
  { suffix: '-ness', meaning: '状态、性质', examples: ['happiness', 'darkness', 'kindness', 'goodness'] },
  { suffix: '-ful', meaning: '充满...的', examples: ['beautiful', 'careful', 'useful', 'wonderful'] },
  { suffix: '-less', meaning: '无、没有', examples: ['homeless', 'hopeless', 'careless', 'endless'] },
  { suffix: '-er/-or', meaning: '做...的人', examples: ['teacher', 'writer', 'actor', 'director'] },
  { suffix: '-ist', meaning: '专业人员', examples: ['scientist', 'artist', 'pianist', 'journalist'] },
  { suffix: '-ism', meaning: '主义、制度', examples: ['socialism', 'capitalism', 'criticism', 'optimism'] },
  { suffix: '-ize', meaning: '使...化', examples: ['realize', 'modernize', 'organize', 'recognize'] },
  { suffix: '-fy', meaning: '使成为', examples: ['simplify', 'classify', 'satisfy', 'identify'] },
  { suffix: '-ous', meaning: '充满...的', examples: ['dangerous', 'famous', 'curious', 'generous'] },
  { suffix: '-al', meaning: '与...有关的', examples: ['natural', 'central', 'general', 'personal'] },
  { suffix: '-ive', meaning: '有...性质的', examples: ['active', 'creative', 'effective', 'positive'] }
];

// 根据单词查找词根
export function findRootsForWord(word) {
  const normalizedWord = word.toLowerCase();
  const foundRoots = [];
  
  for (const rootData of WORD_ROOTS) {
    if (rootData.words.some(w => w.toLowerCase() === normalizedWord)) {
      foundRoots.push(rootData);
    }
  }
  
  // 也检查词根是否包含在单词中
  if (foundRoots.length === 0) {
    for (const rootData of WORD_ROOTS) {
      const roots = rootData.root.split('/');
      if (roots.some(r => normalizedWord.includes(r))) {
        foundRoots.push(rootData);
      }
    }
  }
  
  return foundRoots;
}

// 根据单词查找前缀
export function findPrefixForWord(word) {
  const normalizedWord = word.toLowerCase();
  
  for (const prefixData of PREFIXES) {
    const prefixes = prefixData.prefix.replace(/[/-]/g, '').split('');
    const mainPrefix = prefixData.prefix.split('-')[0].replace(/\//g, '|');
    
    const pattern = new RegExp(`^(${mainPrefix})`);
    if (pattern.test(normalizedWord)) {
      return prefixData;
    }
  }
  
  return null;
}

// 根据单词查找后缀
export function findSuffixForWord(word) {
  const normalizedWord = word.toLowerCase();
  
  for (const suffixData of SUFFIXES) {
    const suffixes = suffixData.suffix.split('/');
    if (suffixes.some(s => normalizedWord.endsWith(s.replace('-', '')))) {
      return suffixData;
    }
  }
  
  return null;
}

// 分析单词的词根词缀结构
export function analyzeWordStructure(word) {
  return {
    word,
    roots: findRootsForWord(word),
    prefix: findPrefixForWord(word),
    suffix: findSuffixForWord(word)
  };
}
