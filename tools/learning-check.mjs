import assert from 'node:assert/strict';
import { WORDS } from '../apps/user-h5/data/words.js';
import { addDays, answer, currentWord, dailyStats, recallUnknown, startSession, stats } from '../apps/user-h5/services/learning.js';

let state = startSession(WORDS, null, true);
assert.equal(state.queue.length, WORDS.length);

const legacyState = { ...state };
delete legacyState.learningRuleVersion;
const migrated = startSession(WORDS, legacyState);
assert.equal(migrated.queue.length, WORDS.length, '旧规则的当天会话应重建完整队列');

const firstId = state.queue[0];
state = recallUnknown(state, WORDS);
assert.equal(currentWord(state, WORDS).id, firstId, '点想不起来后应先展示原单词释义');
assert.equal(state.completedIds.includes(firstId), false, '点想不起来不能计入完成进度');
assert.equal(state.wrongIds.includes(firstId), true, '想不起来的词应进入错题本');
assert.equal(state.unreviewedWrongIds.includes(firstId), true, '新错题应计入待复习数量');
state = answer(state, WORDS, 'known');
assert.equal(state.queue[0], 2);
assert.equal(state.queue[3], firstId, '不会的词应在三张卡片后重现');

state = answer(state, WORDS, 'known');
state = answer(state, WORDS, 'known');
state = answer(state, WORDS, 'known');
assert.equal(state.queue[state.index], firstId);

state = answer(state, WORDS, 'known');
assert.equal(state.completedIds.includes(firstId), false, '不会词第二次认出后不能计入进度');
assert.equal(state.progress[firstId].correctStreak, 2);

while (state.queue[state.index] !== firstId) state = answer(state, WORDS, 'known');
state = answer(state, WORDS, 'unknown');
assert.equal(state.completedIds.includes(firstId), false, '不会词再次答错后不能计入进度');

assert.equal(state.progress[firstId].correctStreak, 0, '再次答错应清空连续正确次数');

for (let count = 1; count <= 3; count += 1) {
  while (state.queue[state.index] !== firstId) state = answer(state, WORDS, 'known');
  state = answer(state, WORDS, 'known');
  assert.equal(state.completedIds.includes(firstId), count === 3, '不会词必须连续认出三次才计入进度');
}

assert.equal(dailyStats(state).goal, 50);
assert.equal(dailyStats(state).total, WORDS.length);
assert.equal(dailyStats(state).completed, state.completedIds.length);
assert.equal(dailyStats(state).unknown, 1);

const today = new Date();
const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
assert.equal(state.progress[firstId].nextReviewDate, addDays(todayKey, 1));
assert.equal(state.completedIds.includes(firstId), true);
assert.equal(state.unreviewedWrongIds.includes(firstId), true, '普通轮学会后仍应保留专项复习提醒');
assert.equal(stats(state, WORDS).unknown, 1, '本轮曾答错的单词应计入曾不会');

state = startSession(WORDS, state, true);
assert.deepEqual(
  { known: stats(state, WORDS).known, unknown: stats(state, WORDS).unknown },
  { known: 0, unknown: 0 },
  '再学一轮应清空上一轮统计'
);
state = answer(state, WORDS, 'known');
assert.deepEqual(
  { known: stats(state, WORDS).known, unknown: stats(state, WORDS).unknown },
  { known: 1, unknown: 0 },
  '新一轮统计应随本轮作答更新'
);

let mistakeState = startSession([WORDS[0]], state, true, { sessionType: 'mistakes' });
for (let count = 1; count <= 3; count += 1) {
  mistakeState = answer(mistakeState, [WORDS[0]], 'known');
  if (count < 3) assert.equal(mistakeState.completedIds.length, 0, '错题复习前两次答对不能完成');
}
assert.equal(mistakeState.completedIds.length, 1, '错题复习连续三次答对后才完成');
assert.equal(mistakeState.unreviewedWrongIds.includes(firstId), false, '错题专项复习完成后应清除待复习提醒');

const completed = { ...state, done: true, completedIds: WORDS.map(word => word.id) };
assert.equal(startSession(WORDS, completed).completedIds.length, WORDS.length, '当天刷新应保留完成结果');

let dailyState = startSession([WORDS[0]], null, true);
dailyState = answer(dailyState, [WORDS[0]], 'known');
dailyState = startSession([WORDS[1]], dailyState, true);
dailyState = answer(dailyState, [WORDS[1]], 'known');
assert.deepEqual(dailyStats(dailyState), { goal: 50, total: 2, completed: 2, known: 2, unknown: 0 });

console.log('learning-check passed');
