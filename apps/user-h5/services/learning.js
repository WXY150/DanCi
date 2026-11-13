export const REVIEW_INTERVALS = [1, 2, 4, 7, 15];
export const REQUEUE_AFTER = 3;
export const REQUIRED_CONSECUTIVE_KNOWN = 3;
const LEARNING_RULE_VERSION = 3;
const SESSION_VERSION = 4;
const DEFAULT_ROUND_SIZE = 20;
const DEFAULT_DAILY_SIZE = 50;

// 学习统计相关
export function getStudyStreak(progress = {}) {
  if (!progress.streakData) return { currentStreak: 0, longestStreak: 0, lastStudyDate: '' };
  return progress.streakData;
}

export function updateStudyStreak(progress = {}, today = dateKey()) {
  const streakData = progress.streakData || { currentStreak: 0, longestStreak: 0, lastStudyDate: '' };
  const lastDate = streakData.lastStudyDate;
  
  if (!lastDate) {
    // 第一次学习
    streakData.currentStreak = 1;
    streakData.longestStreak = 1;
    streakData.lastStudyDate = today;
  } else if (lastDate === today) {
    // 今天已经学习过
    return streakData;
  } else {
    const yesterday = addDays(today, -1);
    if (lastDate === yesterday) {
      // 连续学习
      streakData.currentStreak += 1;
      streakData.longestStreak = Math.max(streakData.longestStreak, streakData.currentStreak);
    } else {
      // 中断了
      streakData.currentStreak = 1;
    }
    streakData.lastStudyDate = today;
  }
  
  return streakData;
}

export function getStudyStats(progress = {}) {
  const allProgress = progress.progress || {};
  const totalStudied = Object.keys(allProgress).length;
  const mastered = Object.values(allProgress).filter(p => p.stage >= 3).length;
  const learning = Object.values(allProgress).filter(p => p.stage > 0 && p.stage < 3).length;
  const wrongCount = Object.values(allProgress).filter(p => p.unknown > 0).length;
  
  return {
    totalStudied,
    mastered,
    learning,
    wrongCount
  };
}

export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day + days);
  return dateKey(date);
}

function newProgress(previous = {}) {
  return {
    stage: Number(previous.stage) || 0,
    known: Number(previous.known) || 0,
    unknown: Number(previous.unknown) || 0,
    correctStreak: 0,
    nextReviewDate: previous.nextReviewDate || ''
  };
}

function roundSize(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(5, Math.round(parsed))) : DEFAULT_ROUND_SIZE;
}

function dailySize(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(200, Math.max(5, Math.round(parsed))) : DEFAULT_DAILY_SIZE;
}

function previousWrongIds(previous) {
  const fromProgress = Object.entries(previous.progress || {})
    .filter(([, progress]) => Number(progress.unknown) > 0)
    .map(([id]) => Number(id));
  return [...new Set([...(previous.wrongIds || []), ...fromProgress].map(Number))].filter(Number.isFinite);
}

function dailyState(previous, today, words = [], configuredGoal = DEFAULT_DAILY_SIZE) {
  const source = previous?.date === today && previous.daily?.date === today
    ? previous.daily
    : { date: today, goal: 0, wordIds: [], completedIds: [], unknownIds: [], knownIds: [], celebrated: false };
  const daily = {
    date: today,
    goal: Number(source.goal) || dailySize(configuredGoal),
    wordIds: [...new Set((source.wordIds || []).map(Number).filter(Number.isFinite))],
    completedIds: [...new Set((source.completedIds || []).map(Number).filter(Number.isFinite))],
    unknownIds: [...new Set((source.unknownIds || []).map(Number).filter(Number.isFinite))],
    knownIds: [...new Set((source.knownIds || []).map(Number).filter(Number.isFinite))],
    celebrated: Boolean(source.celebrated)
  };
  words.forEach(word => {
    if (!daily.wordIds.includes(word.id)) daily.wordIds.push(word.id);
  });
  return daily;
}

function newState(words, previous = {}, force = false, options = {}) {
  const today = dateKey();
  const progress = JSON.parse(JSON.stringify(previous.progress || {}));
  words.forEach(word => {
    progress[word.id] = newProgress(previous.progress?.[word.id]);
  });
  const queue = words
    .filter(word => force || progress[word.id].stage === 0 || !progress[word.id].nextReviewDate || progress[word.id].nextReviewDate <= today)
    .map(word => word.id);

  return {
    version: SESSION_VERSION,
    learningRuleVersion: LEARNING_RULE_VERSION,
    date: today,
    queue,
    index: 0,
    done: queue.length === 0,
    answers: { known: 0, unknown: 0 },
    roundResults: {},
    completedIds: [],
    sessionWordIds: words.map(word => word.id),
    sessionType: options.sessionType || 'normal',
    nextOffset: Number.isFinite(options.nextOffset) ? options.nextOffset : Number(previous.nextOffset) || 0,
    wrongOffset: Number.isFinite(options.wrongOffset) ? options.wrongOffset : Number(previous.wrongOffset) || 0,
    wrongIds: previousWrongIds(previous),
    unreviewedWrongIds: [...new Set((previous.unreviewedWrongIds || []).map(Number))].filter(Number.isFinite),
    settings: {
      roundSize: roundSize(previous.settings?.roundSize),
      dailySize: dailySize(previous.settings?.dailySize)
    },
    feedback: { ...(previous.feedback || {}) },
    daily: dailyState(previous, today, words, previous.settings?.dailySize),
    progress
  };
}

export function startSession(words, previous = null, force = false, options = {}) {
  const today = dateKey();
  const sameDay = previous?.version === SESSION_VERSION && previous.date === today;
  if (!force && sameDay && previous.learningRuleVersion === LEARNING_RULE_VERSION) {
    const settings = {
      ...(previous.settings || {}),
      roundSize: roundSize(previous.settings?.roundSize),
      dailySize: dailySize(previous.settings?.dailySize)
    };
    const migratedDaily = previous.daily?.date === today
      ? { ...previous.daily, goal: previous.settings?.dailySize ? (Number(previous.daily.goal) || settings.dailySize) : settings.dailySize }
      : dailyState(previous, today, words, settings.dailySize);
    return { ...previous, settings, daily: migratedDaily };
  }
  const rulesChanged = sameDay && previous.learningRuleVersion !== LEARNING_RULE_VERSION;
  return newState(words, previous || {}, force || rulesChanged, options);
}

export function currentWord(state, words) {
  const id = state?.queue?.[state.index];
  return words.find(word => word.id === id) || null;
}

function markCompleted(state, id) {
  if (!state.completedIds.includes(id)) state.completedIds.push(id);
  state.daily ||= dailyState({}, dateKey());
  if (!state.daily.completedIds.includes(id)) state.daily.completedIds.push(id);
  if (!state.daily.knownIds.includes(id)) state.daily.knownIds.push(id);
}

function requeue(state, id) {
  state.queue.splice(state.index, 1);
  const insertAt = Math.min(state.index + REQUEUE_AFTER, state.queue.length);
  state.queue.splice(insertAt, 0, id);
}

function recordUnknown(next, current, today) {
  const progress = next.progress[current.id];
  next.wrongIds ||= [];
  next.unreviewedWrongIds ||= [];
  if (!next.wrongIds.includes(current.id)) next.wrongIds.push(current.id);
  if (!next.unreviewedWrongIds.includes(current.id)) next.unreviewedWrongIds.push(current.id);
  if (next.roundResults[current.id] !== 'unknown') {
    next.roundResults[current.id] = 'unknown';
    progress.unknown += 1;
    next.answers.unknown += 1;
  }
  progress.correctStreak = 0;
  progress.stage = 0;
  progress.nextReviewDate = addDays(today, 1);
  next.daily ||= dailyState({}, today);
  if (!next.daily.wordIds.includes(current.id)) next.daily.wordIds.push(current.id);
  if (!next.daily.unknownIds.includes(current.id)) next.daily.unknownIds.push(current.id);
  next.daily.knownIds = next.daily.knownIds.filter(id => id !== current.id);
}

export function recallUnknown(state, words) {
  const current = currentWord(state, words);
  if (!current || state.done) return state;

  const next = JSON.parse(JSON.stringify(state));
  next.roundResults ||= {};
  recordUnknown(next, current, dateKey());
  return next;
}

export function answer(state, words, result) {
  const current = currentWord(state, words);
  if (!current || state.done) return state;

  const next = JSON.parse(JSON.stringify(state));
  const progress = next.progress[current.id];
  const today = dateKey();
  progress.correctStreak = Number(progress.correctStreak) || 0;
  next.roundResults ||= {};
  next.wrongIds ||= [];

  if (result === 'known') {
    const needsRelearning = next.sessionType === 'mistakes'
      || next.wrongIds.includes(current.id)
      || next.roundResults[current.id] === 'unknown';
    next.roundResults[current.id] ||= 'known';
    progress.known += 1;
    next.answers.known += 1;
    next.daily ||= dailyState({}, today);
    if (!next.daily.wordIds.includes(current.id)) next.daily.wordIds.push(current.id);
    if (!next.daily.unknownIds.includes(current.id) && !next.daily.knownIds.includes(current.id)) {
      next.daily.knownIds.push(current.id);
    }
    progress.correctStreak = needsRelearning ? progress.correctStreak + 1 : REQUIRED_CONSECUTIVE_KNOWN;

    if (progress.correctStreak >= REQUIRED_CONSECUTIVE_KNOWN) {
      progress.correctStreak = 0;
      progress.stage = Math.min(progress.stage + 1, REVIEW_INTERVALS.length);
      progress.nextReviewDate = addDays(today, REVIEW_INTERVALS[Math.max(progress.stage - 1, 0)]);
      markCompleted(next, current.id);
      if (next.sessionType === 'mistakes') {
        next.unreviewedWrongIds = (next.unreviewedWrongIds || []).filter(id => id !== current.id);
      }
      next.index += 1;
    } else {
      requeue(next, current.id);
    }
  } else {
    recordUnknown(next, current, today);
    requeue(next, current.id);
  }

  next.done = next.index >= next.queue.length;
  return next;
}

export function stats(state, words) {
  const roundResults = state?.roundResults;
  const known = roundResults
    ? Object.values(roundResults).filter(result => result === 'known').length
    : words.filter(word => state?.progress?.[word.id]?.known > 0 && state.progress[word.id].unknown === 0).length;
  const unknown = roundResults
    ? Object.values(roundResults).filter(result => result === 'unknown').length
    : words.filter(word => state?.progress?.[word.id]?.unknown > 0).length;
  const nextReviewDate = words
    .map(word => state?.progress?.[word.id]?.nextReviewDate)
    .filter(Boolean)
    .sort()[0] || '';
  return {
    total: words.length,
    completed: state?.completedIds?.length || 0,
    wrongCount: state?.wrongIds?.length || 0,
    unreviewedWrongCount: state?.unreviewedWrongIds?.length || 0,
    known,
    unknown,
    answered: (state?.answers?.known || 0) + (state?.answers?.unknown || 0),
    nextReviewDate
  };
}

export function dailyStats(state) {
  const daily = state?.daily || {};
  const unknownIds = new Set((daily.unknownIds || []).map(Number));
  return {
    goal: Number(daily.goal) || 0,
    total: (daily.wordIds || []).length,
    completed: (daily.completedIds || []).length,
    known: (daily.knownIds || []).map(Number).filter(id => !unknownIds.has(id)).length,
    unknown: unknownIds.size
  };
}
