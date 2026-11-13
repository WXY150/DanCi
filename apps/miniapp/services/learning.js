const REQUEUE_AFTER = 3;
const REQUIRED_CONSECUTIVE_KNOWN = 3;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function wordProgress(previous = {}) {
  return {
    known: Number(previous.known) || 0,
    unknown: Number(previous.unknown) || 0,
    correctStreak: Number(previous.correctStreak) || 0,
    stage: Number(previous.stage) || 0
  };
}

function requeue(state, id) {
  state.queue.splice(state.index, 1);
  const insertAt = Math.min(state.index + REQUEUE_AFTER, state.queue.length);
  state.queue.splice(insertAt, 0, id);
}

function markCompleted(state, id) {
  if (!state.completedIds.includes(id)) state.completedIds.push(id);
  state.progress[id].stage = Math.min(state.progress[id].stage + 1, 5);
}

function markUnknown(state, id) {
  state.wrongIds ||= [];
  state.unreviewedWrongIds ||= [];
  if (!state.wrongIds.includes(id)) state.wrongIds.push(id);
  if (!state.unreviewedWrongIds.includes(id)) state.unreviewedWrongIds.push(id);
  if (state.roundResults[id] !== 'unknown') {
    state.roundResults[id] = 'unknown';
    state.answers.unknown += 1;
    state.progress[id].unknown += 1;
  }
  state.progress[id].correctStreak = 0;
  state.progress[id].stage = 0;
}

function startSession(words, previous = null) {
  const old = previous || {};
  const progress = {};
  words.forEach(word => { progress[word.id] = wordProgress(old.progress?.[word.id]); });
  const sessionWordIds = words.map(word => word.id);
  const queue = old.sessionWordIds?.join(',') === sessionWordIds.join(',') && Array.isArray(old.queue)
    ? old.queue.slice()
    : sessionWordIds.slice();
  return {
    version: 1,
    queue,
    index: Math.min(Number(old.index) || 0, queue.length),
    done: queue.length === 0,
    sessionWordIds,
    completedIds: Array.isArray(old.completedIds) ? old.completedIds.slice() : [],
    wrongIds: Array.isArray(old.wrongIds) ? old.wrongIds.slice() : [],
    unreviewedWrongIds: Array.isArray(old.unreviewedWrongIds) ? old.unreviewedWrongIds.slice() : [],
    roundResults: { ...(old.roundResults || {}) },
    answers: { known: Number(old.answers?.known) || 0, unknown: Number(old.answers?.unknown) || 0 },
    progress
  };
}

function currentWord(state, words) {
  const id = state?.queue?.[state.index];
  return words.find(word => word.id === id) || null;
}

function answer(state, words, result) {
  const current = currentWord(state, words);
  if (!current || state.done) return state;
  const next = clone(state);
  const progress = next.progress[current.id] || wordProgress();
  next.progress[current.id] = progress;

  if (result === 'unknown') {
    markUnknown(next, current.id);
    requeue(next, current.id);
  } else {
    const needsRelearning = next.wrongIds.includes(current.id) || next.roundResults[current.id] === 'unknown';
    next.roundResults[current.id] ||= 'known';
    next.answers.known += 1;
    progress.known += 1;
    progress.correctStreak = needsRelearning ? progress.correctStreak + 1 : REQUIRED_CONSECUTIVE_KNOWN;
    if (progress.correctStreak >= REQUIRED_CONSECUTIVE_KNOWN) {
      markCompleted(next, current.id);
      next.index += 1;
    } else {
      requeue(next, current.id);
    }
  }
  next.done = next.index >= next.queue.length;
  return next;
}

function stats(state, words) {
  return {
    total: words.length,
    completed: state.completedIds.length,
    known: state.answers.known,
    unknown: state.answers.unknown,
    answered: state.answers.known + state.answers.unknown
  };
}

module.exports = { startSession, currentWord, answer, stats };
