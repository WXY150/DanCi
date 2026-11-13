// 形近词/易混词数据库
// 每组包含容易混淆的单词及其区别要点
export const CONFUSABLE_GROUPS = [
  {
    words: ['adapt', 'adopt', 'adept'],
    tips: {
      adapt: '适应、调整 (adjust to)',
      adopt: '采纳、收养 (take as one\'s own)',
      adept: '熟练的 (skilled)'
    },
    mnemonic: 'adapt有ap→调整适应；adopt有op→选择采纳；adept有ep→expert专家熟练'
  },
  {
    words: ['affect', 'effect'],
    tips: {
      affect: '影响 (动词) - a开头像action',
      effect: '效果、影响 (名词) - e开头像end result'
    },
    mnemonic: 'affect=动词影响；effect=名词效果'
  },
  {
    words: ['accept', 'except'],
    tips: {
      accept: '接受 (ac=to)',
      except: '除了 (ex=out)'
    },
    mnemonic: 'ac向内接受；ex向外排除'
  },
  {
    words: ['alter', 'altar'],
    tips: {
      alter: '改变 (动词)',
      altar: '祭坛 (名词，有ar像architecture)'
    },
    mnemonic: 'altar多个a像祭坛的台阶'
  },
  {
    words: ['angle', 'angel'],
    tips: {
      angle: '角度 (有g像几何)',
      angel: '天使 (有e像翅膀)'
    },
    mnemonic: 'angel天使有e像展开的翅膀'
  },
  {
    words: ['access', 'assess', 'excess'],
    tips: {
      access: '访问、接近 (ac=to)',
      assess: '评估 (as=to)',
      excess: '过度 (ex=out)'
    },
    mnemonic: 'access一个c进入；assess两个s评估；excess有ex超出'
  },
  {
    words: ['complement', 'compliment'],
    tips: {
      complement: '补充、完善 (complete)',
      compliment: '赞美、恭维 (有i像I赞美你)'
    },
    mnemonic: 'complement→complete补充完整；compliment→I赞美'
  },
  {
    words: ['council', 'counsel'],
    tips: {
      council: '委员会 (名词，有c像circle)',
      counsel: '建议、律师 (有s像suggest)'
    },
    mnemonic: 'council委员会围成circle；counsel建议suggest'
  },
  {
    words: ['desert', 'dessert'],
    tips: {
      desert: '沙漠 (一个s)',
      dessert: '甜点 (两个s，sweet的s)'
    },
    mnemonic: '甜点dessert有两个s因为你想要more sweets'
  },
  {
    words: ['emigrate', 'immigrate'],
    tips: {
      emigrate: '移出 (e=exit离开)',
      immigrate: '移入 (i=in进入)'
    },
    mnemonic: 'e→exit离开；i→in进入'
  },
  {
    words: ['explicit', 'implicit'],
    tips: {
      explicit: '明确的 (ex=out外显)',
      implicit: '含蓄的 (im=in内含)'
    },
    mnemonic: 'ex向外明说；im向内暗示'
  },
  {
    words: ['illusion', 'allusion', 'elusion'],
    tips: {
      illusion: '幻觉 (ill→不真实)',
      allusion: '暗指 (al→all全面提及)',
      elusion: '逃避 (e→escape)'
    },
    mnemonic: 'illusion幻觉不真实；allusion暗指全面；elusion逃避escape'
  },
  {
    words: ['personal', 'personnel'],
    tips: {
      personal: '个人的 (形容词)',
      personnel: '全体人员 (名词，有nel像channel渠道)'
    },
    mnemonic: 'personnel多nel表示一群人'
  },
  {
    words: ['principal', 'principle'],
    tips: {
      principal: '校长、主要的 (pal朋友)',
      principle: '原则 (ple→ople人民都要遵守)'
    },
    mnemonic: 'principal校长是你的pal；principle原则people遵守'
  },
  {
    words: ['stationary', 'stationery'],
    tips: {
      stationary: '静止的 (形容词，有a)',
      stationery: '文具 (名词，有e像envelope信封)'
    },
    mnemonic: 'stationery文具有e→envelope信封'
  },
  {
    words: ['weather', 'whether'],
    tips: {
      weather: '天气 (有a像air)',
      whether: '是否 (是or不是)'
    },
    mnemonic: 'whether是否→which either；weather天气有a像air'
  },
  {
    words: ['continuous', 'continual'],
    tips: {
      continuous: '连续不断的 (无间隙)',
      continual: '频繁的 (有间隙但反复出现)'
    },
    mnemonic: 'continuous无u断；continual有al间隙always重复'
  },
  {
    words: ['economic', 'economical'],
    tips: {
      economic: '经济的、经济学的',
      economical: '节约的、实惠的 (al→all省钱)'
    },
    mnemonic: 'economical有al→all都省钱'
  },
  {
    words: ['historic', 'historical'],
    tips: {
      historic: '历史性的、重大的',
      historical: '历史上的、史学的'
    },
    mnemonic: 'historic重大事件；historical历史相关'
  },
  {
    words: ['loose', 'lose'],
    tips: {
      loose: '松的 (形容词，有两个o像松松垮垮)',
      lose: '失去 (动词，失去一个o)'
    },
    mnemonic: 'loose松的有两个o；lose失去丢了一个o'
  },
  {
    words: ['quite', 'quiet'],
    tips: {
      quite: '相当、完全 (无t在最后)',
      quiet: '安静的 (et→end with t保持安静)'
    },
    mnemonic: 'quiet安静把t放最后'
  },
  {
    words: ['than', 'then'],
    tips: {
      than: '比较 (a像对比的两边)',
      then: '那么、然后 (e像event事件顺序)'
    },
    mnemonic: 'than比较用a；then时间用e'
  }
];

// 根据单词查找形近词组
export function findConfusableGroup(word) {
  const normalizedWord = word.toLowerCase();
  return CONFUSABLE_GROUPS.find(group => 
    group.words.some(w => w.toLowerCase() === normalizedWord)
  );
}

// 获取单词的易混淆提示
export function getConfusableTip(word) {
  const group = findConfusableGroup(word);
  if (!group) return null;
  
  return {
    confusableWords: group.words.filter(w => w.toLowerCase() !== word.toLowerCase()),
    tips: group.tips,
    mnemonic: group.mnemonic
  };
}
