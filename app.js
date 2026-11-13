import { contentProvider } from './services/content.js';
import { progressStore } from './services/progress.js';
import { audioService } from './services/audio.js';
import { answer, currentWord, dailyStats, dateKey, recallUnknown, startSession, stats, getStudyStreak, updateStudyStreak, getStudyStats } from './services/learning.js';

const app = document.querySelector('#app');
let words = [];
let wordBank = [];
let state = null;
let revealed = false;
let hintLevel = 0; // 0=无提示, 1=首字母, 2=音标, 3=图片
let spellingMode = false; // 听音拼写模式
let spellingInput = '';
let settingsNotice = '';
let settingsNoticeTimer = null;
let studyNotice = { message: '', tone: '' };
let studyNoticeTimer = null;
let authed = null; // { id, username, role }

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function persist() {
  progressStore.save(state);
  if (authed && state) {
    // 异步推送到账号云端（失败不影响本地学习）
    fetch('/api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state })
    }).catch(() => {});
  }
}

function configuredRoundSize() {
  return state?.settings?.roundSize || 20;
}

function configuredDailySize() {
  return state?.settings?.dailySize || 50;
}

function iconSpeaker() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
}

function iconBook() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z"/></svg>';
}

function iconTarget() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m15 9 5-5M16 4h4v4"/></svg>';
}

function iconSettings() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.09A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3V9.6h.09A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.12.38.33.72.6 1 .3.3.68.5 1.1.6h.09v4h-.09a1.7 1.7 0 0 0-1.7.4Z"/></svg>';
}

function iconSparkles() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2L12 3Z"/><path d="m18.5 13 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/><path d="m6 14 .7 1.8 1.8.7-1.8.7L6 19l-.7-1.8-1.8-.7 1.8-.7L6 14Z"/></svg>';
}

function iconUser() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>';
}

function iconArrowLeft() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></svg>';
}

function header({ showRoundProgress = false } = {}) {
  const progress = stats(state, words);
  const progressMeta = showRoundProgress
    ? `<div class="progress-meta"><span class="progress-label">${progress.completed}/${progress.total}</span><div class="progress-track" aria-label="本轮学习进度"><div class="progress-fill" style="width:${progress.total ? progress.completed / progress.total * 100 : 0}%"></div></div></div>`
    : '';
  return `<header class="app-header"><div class="brand-mark">${iconBook()}</div><div class="brand">单词本</div><span class="book-name">考研核心词</span>${progressMeta}</header>`;
}

async function handleLogout() {
  try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
  authed = null;
  window.location.href = '/login.html';
}

function renderHome() {
  const summary = stats(state, words);
  const today = dailyStats(state);
  const streakData = getStudyStreak(state);
  const studyStats = getStudyStats(state);
  const roundCompleted = summary.completed === summary.total && summary.total > 0;
  const dailyCompleted = today.goal > 0 && today.completed >= today.goal;
  const buttonText = roundCompleted ? '再学一轮' : (state.done ? '开始下一轮' : (summary.completed ? '继续学习' : '开始今日学习'));
  const buttonAction = state.done ? 'restart' : 'start';
  const note = summary.nextReviewDate ? `下一次复习：${summary.nextReviewDate}` : '进度会自动保存在当前浏览器中';
  const mistakeHint = summary.unreviewedWrongCount
    ? `${summary.unreviewedWrongCount} 个新错题待复习`
    : (summary.wrongCount ? '全部错题已复习' : '暂无错题记录');
  
  // 连续打卡显示
  const streakDisplay = streakData.currentStreak > 0
    ? `<div class="streak-badge"><span class="streak-icon">🔥</span><strong>${streakData.currentStreak}</strong><small>天连续学习</small></div>`
    : '';
  
  // 学习统计卡片
  const statsCards = `<div class="stats-cards"><div class="stat-card"><div class="stat-value">${studyStats.totalStudied}</div><div class="stat-label">已学单词</div></div><div class="stat-card"><div class="stat-value">${studyStats.mastered}</div><div class="stat-label">已掌握</div></div><div class="stat-card"><div class="stat-value">${studyStats.learning}</div><div class="stat-label">学习中</div></div></div>`;
  
  const tools = `<nav class="home-tools" aria-label="学习工具"><button class="tool-action" data-action="mistakes" type="button"><span class="tool-icon tool-icon-warm">${iconTarget()}</span><span class="tool-copy"><strong>错题本</strong><small>${mistakeHint}</small></span>${summary.unreviewedWrongCount ? `<span class="tool-count">${summary.unreviewedWrongCount}</span>` : ''}</button><button class="tool-action" data-action="quick-review" type="button"><span class="tool-icon tool-icon-blue">${iconTarget()}</span><span class="tool-copy"><strong>5分钟速刷</strong><small>快速复习最重要的5个词</small></span></button><button class="tool-action" data-action="profile" type="button"><span class="tool-icon tool-icon-purple">${iconUser()}</span><span class="tool-copy"><strong>个人中心</strong><small>账号信息 · 学习设置 · 退出切换</small></span></button></nav>`;

  app.innerHTML = `<section class="screen home-screen">${header()}<main class="home-main"><section class="home-hero">${streakDisplay}<div class="session-kicker">今日任务</div><h1>${dailyCompleted ? '今日学习已完成' : `今天还剩 ${Math.max(0, today.goal - today.completed)} 个词`}</h1><p class="session-copy">先回忆词义，再用联想图加深记忆。不会的词会在本轮再次出现。</p><div class="daily-progress-head"><span>今日进度</span><strong>${today.completed}<small> / ${today.goal}</small></strong></div><div class="task-progress" aria-label="今日目标进度"><span style="width:${today.goal ? Math.min(100, today.completed / today.goal * 100) : 0}%"></span></div><div class="overview"><div class="overview-item"><span class="overview-value">${today.completed}</span><span class="overview-label">今日已完成</span></div><div class="overview-item"><span class="overview-value">${today.known}</span><span class="overview-label">今日已掌握</span></div><div class="overview-item"><span class="overview-value">${today.unknown}</span><span class="overview-label">今日待巩固</span></div></div><button class="primary-action" data-action="${buttonAction}">${buttonText}</button></section>${statsCards}${tools}<p class="home-note">${note}</p></main></section>`;
  requestAnimationFrame(maybeCelebrateDailyGoal);
}

function renderStudy() {
  const word = currentWord(state, words);
  if (!word) return renderResult();
  
  // 听音拼写模式
  if (spellingMode) {
    return renderSpellingMode(word);
  }
  
  const summary = stats(state, words);
  const imageUrl = escapeHtml(word.imageUrl);
  const needsRelearning = state.sessionType === 'mistakes' || state.wrongIds?.includes(word.id) || state.roundResults?.[word.id] === 'unknown';
  const streakNote = needsRelearning ? `<div class="streak-note">连续记住 ${state.progress[word.id]?.correctStreak || 0}/3</div>` : '';
  const imageFrame = imageUrl
    ? `<div class="image-frame"><img class="word-img" src="${imageUrl}" alt="${escapeHtml(word.word)} 联想图" /></div>`
    : '<div class="image-frame no-image"><span>联想图待补充</span></div>';
  const meaningPanel = `<section class="meaning-panel"><span class="meaning-label">核心释义</span><div class="meaning">${escapeHtml(word.meaning)}</div></section>`;
  const memoryNotes = `<section class="memory-notes"><div class="mnemonic"><span class="mnemonic-title">记忆提示</span><span class="mnemonic-text">${escapeHtml(word.mnemonic)}</span></div></section>`;
  
  // 词根词缀分析
  const wordAnalysis = contentProvider.getWordAnalysis(word.word);
  let rootsDisplay = '';
  if (wordAnalysis.roots && wordAnalysis.roots.length > 0) {
    const rootInfo = wordAnalysis.roots[0];
    const relatedWords = rootInfo.words.filter(w => w.toLowerCase() !== word.word.toLowerCase()).slice(0, 5);
    rootsDisplay = `<div class="word-roots"><div class="root-header"><span class="root-icon">🌳</span><strong>词根：${rootInfo.root}</strong><span class="root-meaning">${rootInfo.meaning}</span></div><div class="root-family"><span class="root-label">同根词族：</span>${relatedWords.map(w => `<span class="root-word">${w}</span>`).join('')}</div></div>`;
  }
  
  // 形近词对照
  const confusableGroup = contentProvider.getConfusableWords(word.word);
  let confusableDisplay = '';
  if (confusableGroup) {
    const otherWords = confusableGroup.words.filter(w => w.toLowerCase() !== word.word.toLowerCase());
    confusableDisplay = `<div class="confusable-words"><div class="confusable-header"><span class="confusable-icon">⚠️</span><strong>易混词对照</strong></div><div class="confusable-list">${otherWords.map(w => `<div class="confusable-item"><strong>${w}</strong><span>${confusableGroup.tips[w] || ''}</span></div>`).join('')}</div><div class="confusable-tip">${escapeHtml(confusableGroup.mnemonic)}</div></div>`;
  }
  
  // 多级提示功能
  const hintButtons = !revealed ? `<div class="hint-buttons"><button class="hint-button" data-action="hint-letter" type="button" ${hintLevel >= 1 ? 'disabled' : ''}>💡 提示：首字母</button><button class="hint-button" data-action="hint-phonetic" type="button" ${hintLevel >= 2 ? 'disabled' : ''}>🔊 提示：音标</button><button class="hint-button" data-action="hint-image" type="button" ${hintLevel >= 3 ? 'disabled' : ''}>🖼️ 提示：图片</button></div>` : '';
  
  let hintContent = '';
  if (!revealed && hintLevel > 0) {
    const hints = [];
    if (hintLevel >= 1) hints.push(`<div class="hint-item"><strong>首字母：</strong>${word.word[0].toUpperCase()}...</div>`);
    if (hintLevel >= 2) hints.push(`<div class="hint-item"><strong>音标：</strong>${escapeHtml(word.phonetic)}</div>`);
    if (hintLevel >= 3) hints.push(`<div class="hint-item hint-image-preview"><img src="${imageUrl}" alt="联想图预览" /></div>`);
    hintContent = `<div class="hints-display">${hints.join('')}</div>`;
  }
  
  const answerPanel = revealed
    ? `<div class="memory-content">${meaningPanel}${imageFrame}${memoryNotes}${rootsDisplay}${confusableDisplay}</div>${streakNote}<div class="answer-actions"><button class="answer-button unknown" data-answer="unknown" type="button" aria-label="还不会，稍后再次学习"><span>还不会</span><kbd>←</kbd></button><button class="answer-button known" data-answer="known" type="button" aria-label="记住了，继续下一个单词"><span>记住了</span><kbd>→</kbd></button></div>`
    : `<div class="recall-prompt"><span>先在脑中回忆它的意思</span>${hintContent}${hintButtons}<button class="reveal-button" data-action="reveal" type="button">查看释义与联想图</button><div class="recall-actions"><button data-answer="known" type="button">我已经认识</button><button data-action="reveal-unknown" type="button">想不起来</button></div></div>`;
  const notice = studyNotice.message ? `<div class="study-toast ${studyNotice.tone}" role="status">${escapeHtml(studyNotice.message)}</div>` : '';
  app.innerHTML = `<section class="screen study-screen">${notice}${header({ showRoundProgress: true })}<div class="study-meta"><button class="study-home-button" data-action="home" type="button">${iconArrowLeft()}<span>返回首页</span></button><div class="study-context"><span>本轮第 ${Math.min(summary.completed + 1, summary.total)} 个</span><span class="word-status">${state.progress[word.id]?.stage ? '复习词' : '新词'}</span></div></div><article class="study-card ${revealed ? 'is-revealed' : ''}"><div class="word-line"><h1 class="word">${escapeHtml(word.word)}</h1><button class="speak-btn" data-action="speak" aria-label="播放 ${escapeHtml(word.word)} 发音" type="button">${iconSpeaker()}</button></div><div class="ipa">${escapeHtml(word.phonetic)}</div>${answerPanel}</article><div class="keyboard-hint"><span>方向键也可以快速作答</span></div></section>`;
}

function renderSpellingMode(word) {
  const summary = stats(state, words);
  let feedbackHtml = '';
  const feedback = state.spellingFeedback || null;
  
  if (feedback) {
    if (feedback.correct) {
      feedbackHtml = `<div class="spelling-feedback correct"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg><strong>拼写正确!</strong><span>${escapeHtml(word.word)}</span></div>`;
    } else {
      feedbackHtml = `<div class="spelling-feedback incorrect"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18M6 6l12 12"/></svg><strong>拼写错误</strong><div class="spelling-compare"><span class="your-answer">你的答案：<strong>${escapeHtml(feedback.userInput)}</strong></span><span class="correct-answer">正确答案：<strong>${escapeHtml(word.word)}</strong></span></div></div>`;
    }
  }
  
  const showAnswer = feedback && feedback.showAnswer;
  const imageUrl = escapeHtml(word.imageUrl || '');
  
  app.innerHTML = `<section class="screen spelling-screen">${header({ showRoundProgress: true })}<div class="study-meta"><button class="study-home-button" data-action="exit-spelling" type="button">${iconArrowLeft()}<span>退出听音拼写</span></button><div class="study-context"><span>本轮第 ${Math.min(summary.completed + 1, summary.total)} 个</span><span class="word-status">听音拼写</span></div></div><article class="spelling-card"><div class="spelling-mode-badge">🎧 听音拼写模式</div><div class="spelling-audio-area"><button class="big-speaker-button" data-action="speak" type="button">${iconSpeaker()}<span>播放发音</span></button><p class="spelling-hint">听发音后，在下方输入完整单词</p></div>${feedbackHtml}<div class="spelling-input-area"><input type="text" id="spelling-input" class="spelling-input" placeholder="输入你听到的单词..." value="${escapeHtml(spellingInput)}" autocomplete="off" autocapitalize="off" spellcheck="false" ${feedback ? 'disabled' : ''} /><button class="check-spelling-button" data-action="check-spelling" type="button" ${!spellingInput || feedback ? 'disabled' : ''}>检查拼写</button></div>${feedback ? `<div class="spelling-actions"><button class="reveal-button" data-action="show-spelling-answer" type="button" ${showAnswer ? 'disabled' : ''}>查看释义和联想图</button><button class="primary-action" data-answer="${feedback.correct ? 'known' : 'unknown'}" type="button">下一个单词</button></div>` : ''}${showAnswer ? `<div class="spelling-answer-reveal"><div class="ipa">${escapeHtml(word.phonetic)}</div><div class="meaning-panel"><span class="meaning-label">核心释义</span><div class="meaning">${escapeHtml(word.meaning)}</div></div>${imageUrl ? `<div class="image-frame"><img src="${imageUrl}" alt="${escapeHtml(word.word)} 联想图" /></div>` : ''}<div class="mnemonic"><span class="mnemonic-title">记忆提示</span><span class="mnemonic-text">${escapeHtml(word.mnemonic)}</span></div></div>` : ''}</article></section>`;
  
  // 自动聚焦输入框
  if (!feedback) {
    requestAnimationFrame(() => {
      const input = document.querySelector('#spelling-input');
      if (input) input.focus();
    });
  }
}

function renderResult() {
  const summary = stats(state, words);
  const mistakeSession = state.sessionType === 'mistakes';
  const nextAction = 'restart';
  const nextText = '再学一轮';
  app.innerHTML = `<section class="screen result">${header({ showRoundProgress: true })}<main class="result-card"><div class="result-mark" aria-hidden="true">✓</div><div class="session-kicker">本轮小结</div><h1>${mistakeSession ? '错题复习完成' : '这一轮完成了'}</h1><p>今天又向目标靠近了一步</p><div class="result-stats"><div class="result-stat"><span class="result-number" style="color:var(--green)">${summary.known}</span><span class="result-label">本轮认识</span></div><div class="result-stat"><span class="result-number" style="color:var(--orange)">${summary.unknown}</span><span class="result-label">本轮待巩固</span></div></div><p class="next-review">${summary.nextReviewDate ? `下一次复习：${summary.nextReviewDate}` : '复习日期已保存'}</p><button class="primary-action" data-action="${nextAction}" type="button">${nextText}</button><button class="secondary-action" data-action="home" type="button">返回首页</button></main></section>`;
}

function renderDailyGoalReached() {
  const today = dailyStats(state);
  const canContinueRound = !state.done && currentWord(state, words);
  const nextAction = canContinueRound ? 'continue-round' : 'restart';
  app.innerHTML = `<section class="screen result">${header()}<main class="result-card"><div class="result-mark" aria-hidden="true">✓</div><div class="session-kicker">今日任务</div><h1>恭喜达成今日学习任务</h1><p>今日目标 ${today.goal} 个词已全部完成，可以继续学习更多单词</p><div class="result-stats"><div class="result-stat"><span class="result-number" style="color:var(--green)">${today.known}</span><span class="result-label">今日已掌握</span></div><div class="result-stat"><span class="result-number" style="color:var(--orange)">${today.unknown}</span><span class="result-label">今日待巩固</span></div></div><p class="next-review">今日进度 ${today.completed}/${today.goal}</p><button class="primary-action" data-action="${nextAction}" type="button">继续学习</button><button class="secondary-action" data-action="home" type="button">返回首页</button></main></section>`;
  launchConfetti();
}

function renderMistakes() {
  const pendingIds = state.unreviewedWrongIds || [];
  const pendingSet = new Set(pendingIds);
  const mistakeIds = [...new Set([...pendingIds, ...(state.wrongIds || [])])];
  const mistakeWords = contentProvider.listWordsByIds(mistakeIds);
  const list = mistakeWords.slice(0, 80).map(word => `<div class="word-list-item"><strong>${escapeHtml(word.word)}</strong><span>${escapeHtml(word.meaning)}</span>${pendingSet.has(word.id) ? '<em class="pending-tag">待复习</em>' : ''}</div>`).join('');
  const actionText = pendingIds.length ? `复习 ${pendingIds.length} 个待复习错题` : '再次复习错题';
  const action = mistakeWords.length ? `<button class="primary-action" data-action="start-mistakes" type="button">${actionText}</button>` : '<p class="empty-note">还没有记录错题。</p>';
  app.innerHTML = `<section class="screen tool-screen">${header()}<div class="tool-heading"><div class="session-kicker">错题本</div><h1>以前不会的词</h1><p>${mistakeWords.length} 个错题 · ${pendingIds.length} 个待复习</p></div>${action}<div class="word-list">${list}</div><button class="secondary-action" data-action="home" type="button">返回首页</button></section>`;
}

function renderProfile() {
  const summary = stats(state, words);
  const accountPanel = authed
    ? `<section class="account-panel"><div class="account-identity"><strong>${escapeHtml(authed.username)}</strong><span>${authed.role === 'admin' ? '管理员' : '学习用户'}</span></div><button class="primary-action" data-action="logout" type="button">退出登录 / 切换账号</button><p class="home-note">退出后将返回登录界面，可登录或注册其他账号</p></section>`
    : '';
  app.innerHTML = `<section class="screen tool-screen">${header()}${accountPanel}<div class="tool-heading"><div class="session-kicker">个人中心</div><h1>个人中心</h1><p>当前词库 ${wordBank.length} 词，错题本 ${summary.wrongCount} 词</p></div>${authed ? '<p class="home-note">登录中 · 学习进度已同步到账号云端，可跨设备使用</p>' : ''}<label class="setting-row" for="daily-size"><span>每日任务单词数</span><input id="daily-size" type="number" min="5" max="200" step="5" value="${configuredDailySize()}" /></label><label class="setting-row" for="round-size"><span>每轮单词数</span><input id="round-size" type="number" min="5" max="100" step="5" value="${configuredRoundSize()}" /></label><button class="primary-action" data-action="save-settings" type="button">保存设置</button>${settingsNotice ? `<p class="save-notice" role="status">${settingsNotice}</p>` : ''}<p class="home-note">保存后立即更新今日目标和当前学习轮次</p><section class="reset-panel"><div><strong>重置学习进度</strong><span>清空已学单词、错题本和今日记录</span></div><button class="danger-action" data-action="open-reset-dialog" type="button">重置</button></section><button class="secondary-action" data-action="home" type="button">返回首页</button><dialog class="confirm-dialog" id="reset-dialog" aria-labelledby="reset-dialog-title" aria-describedby="reset-dialog-copy"><div class="confirm-card"><div class="confirm-icon" aria-hidden="true">!</div><h2 id="reset-dialog-title">确定重置学习进度？</h2><p id="reset-dialog-copy">已学单词、错题本和今日记录都会被清空，且无法恢复。</p><div class="confirm-actions"><button class="dialog-cancel" data-action="cancel-reset" type="button" autofocus>先不重置</button><button class="dialog-confirm" data-action="confirm-reset" type="button">确认重置</button></div></div></dialog></section>`;
}

function applyRoundSize(roundValue) {
  if (state.sessionType === 'mistakes') {
    const pending = contentProvider.listWordsByIds(state.unreviewedWrongIds || []);
    const pool = pending.length ? pending : contentProvider.listWordsByIds(state.wrongIds || []);
    if (!pool.length) return;
    words = pool.slice(0, roundValue);
    state = startSession(words, state, true, { sessionType: 'mistakes', wrongOffset: words.length % pool.length });
    return;
  }

  const hasRoundProgress = (state.answers?.known || 0) + (state.answers?.unknown || 0) > 0;
  const bankSize = wordBank.length || words.length || 1;
  const offset = hasRoundProgress
    ? Number(state.nextOffset) || 0
    : ((Number(state.nextOffset) || 0) - words.length + bankSize) % bankSize;
  const next = contentProvider.listNextNewWords(state.progress || {}, offset, roundValue);
  words = next.words;
  state = startSession(words, { ...state, nextOffset: next.nextOffset }, true, { sessionType: 'normal', nextOffset: next.nextOffset });
}

function startNextRound(sessionType = 'normal') {
  const count = configuredRoundSize();
  if (sessionType === 'mistakes') {
    const pendingPool = contentProvider.listWordsByIds(state.unreviewedWrongIds || []);
    const pool = pendingPool.length ? pendingPool : contentProvider.listWordsByIds(state.wrongIds || []);
    if (!pool.length) return renderMistakes();
    const offset = pendingPool.length ? 0 : (Number(state.wrongOffset) || 0) % pool.length;
    words = pendingPool.length
      ? pool.slice(0, count)
      : Array.from({ length: Math.min(count, pool.length) }, (_, index) => pool[(offset + index) % pool.length]);
    const wrongOffset = (offset + words.length) % pool.length;
    state = startSession(words, { ...state, wrongOffset }, true, { sessionType, wrongOffset });
  } else if (sessionType === 'quick') {
    // 快速复习模式：选择最需要复习的5个词
    const today = dateKey();
    const candidateWords = wordBank.filter(word => {
      const progress = state.progress?.[word.id];
      return progress && progress.stage > 0 && (!progress.nextReviewDate || progress.nextReviewDate <= today);
    }).sort((a, b) => {
      const aProgress = state.progress[a.id];
      const bProgress = state.progress[b.id];
      // 优先级：未复习日期 > 错误次数 > 阶段低
      if (!aProgress.nextReviewDate && bProgress.nextReviewDate) return -1;
      if (aProgress.nextReviewDate && !bProgress.nextReviewDate) return 1;
      if (aProgress.nextReviewDate !== bProgress.nextReviewDate) {
        return aProgress.nextReviewDate < bProgress.nextReviewDate ? -1 : 1;
      }
      if (bProgress.unknown !== aProgress.unknown) return bProgress.unknown - aProgress.unknown;
      return aProgress.stage - bProgress.stage;
    }).slice(0, 5);
    
    if (candidateWords.length === 0) {
      showStudyNotice('暂无需要复习的单词', 'is-warm');
      return renderHome();
    }
    
    words = candidateWords;
    state = startSession(words, state, true, { sessionType });
  } else {
    const offset = Number(state.nextOffset) || 0;
    const next = contentProvider.listNextNewWords(state.progress || {}, offset, count);
    words = next.words;
    const nextOffset = next.nextOffset;
    state = startSession(words, { ...state, nextOffset }, true, { sessionType, nextOffset });
  }
  revealed = false;
  hintLevel = 0;
  persist();
  renderStudy();
}

function saveSettings() {
  const roundInput = document.querySelector('#round-size');
  const dailyInput = document.querySelector('#daily-size');
  if (!roundInput || !dailyInput) return;
  const roundValue = Math.min(100, Math.max(5, Math.round(Number(roundInput.value) || 20)));
  const dailyValue = Math.min(200, Math.max(5, Math.round(Number(dailyInput.value) || 50)));
  state = {
    ...state,
    settings: { ...(state.settings || {}), roundSize: roundValue, dailySize: dailyValue },
    daily: { ...(state.daily || {}), goal: dailyValue }
  };
  applyRoundSize(roundValue);
  persist();
  settingsNotice = `保存成功，当前任务已更新：每日 ${dailyValue} 词，每轮 ${roundValue} 词`;
  renderProfile();
  clearTimeout(settingsNoticeTimer);
  settingsNoticeTimer = setTimeout(() => {
    settingsNotice = '';
    if (document.querySelector('#round-size')) renderProfile();
  }, 2600);
}

function resetProgress() {
  const settings = { roundSize: configuredRoundSize(), dailySize: configuredDailySize() };
  progressStore.clear();
  const next = contentProvider.listNextNewWords({}, 0, settings.roundSize);
  words = next.words;
  state = startSession(words, { settings, nextOffset: next.nextOffset }, true, { sessionType: 'normal', nextOffset: next.nextOffset });
  revealed = false;
  settingsNotice = '';
  clearTimeout(settingsNoticeTimer);
  persist();
  renderHome();
}

function openResetDialog() {
  document.querySelector('#reset-dialog')?.showModal();
}

function showStudyNotice(message, tone) {
  clearTimeout(studyNoticeTimer);
  studyNotice = { message, tone };
  studyNoticeTimer = setTimeout(() => {
    studyNotice = { message: '', tone: '' };
    document.querySelector('.study-toast')?.remove();
  }, 1800);
}

function submitAnswer(result) {
  const word = currentWord(state, words);
  if (!word) return;
  const needsStreak = state.sessionType === 'mistakes' || state.wrongIds?.includes(word.id) || state.roundResults?.[word.id] === 'unknown';
  state = answer(state, words, result);
  
  // 更新学习打卡
  if (result === 'known' && state.progress[word.id]?.correctStreak === 0) {
    state.streakData = updateStudyStreak(state, dateKey());
  }
  
  if (result === 'unknown') {
    showStudyNotice('已记录，这个词稍后再见', 'is-warm');
  } else if (needsStreak) {
    const streak = state.progress[word.id]?.correctStreak || 0;
    showStudyNotice(streak >= 3 ? '连续记住 3 次，已掌握' : `连续记住 ${streak}/3`, 'is-green');
  } else {
    showStudyNotice('已掌握，继续下一个', 'is-green');
  }
  revealed = false;
  hintLevel = 0;

  // 达成每日任务单词数 → 显示"恭喜达成今日学习任务"结算画面
  if (!state.daily?.celebrated) {
    const after = dailyStats(state);
    if (after.goal > 0 && after.completed >= after.goal) {
      state = { ...state, daily: { ...(state.daily || {}), celebrated: true } };
      persist();
      renderDailyGoalReached();
      return;
    }
  }

  persist();
  renderStudy();
}

function continueSession() {
  revealed = false;
  hintLevel = 0;
  renderStudy();
}

function launchConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelector('.confetti-layer')?.remove();
  const colors = ['#0e9f78', '#f2a65a', '#ef6a67', '#2f79a8', '#f4ce62'];
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = `${Array.from({ length: 48 }, (_, index) => `<i style="--x:${Math.random() * 100}vw;--drift:${Math.round(Math.random() * 180 - 90)}px;--spin:${Math.round(Math.random() * 760 + 360)}deg;--delay:${(Math.random() * .55).toFixed(2)}s;--duration:${(1.8 + Math.random() * 1.1).toFixed(2)}s;--color:${colors[index % colors.length]}"></i>`).join('')}<div class="celebration-toast"><strong>今日任务完成</strong><span>很棒，所有努力都有记录</span></div>`;
  document.body.append(layer);
  setTimeout(() => layer.remove(), 3400);
}

function maybeCelebrateDailyGoal() {
  const today = dailyStats(state);
  if (!today.goal || today.completed < today.goal || state.daily?.celebrated) return;
  state = { ...state, daily: { ...(state.daily || {}), celebrated: true } };
  persist();
  launchConfetti();
}

app.addEventListener('click', event => {
  const target = event.target.closest('[data-action], [data-answer]');
  if (!target) return;
  if (target.dataset.action === 'start') return continueSession();
  if (target.dataset.action === 'restart') return startNextRound();
  if (target.dataset.action === 'continue-round') {
    if (!state.done && currentWord(state, words)) return continueSession();
    return startNextRound('normal');
  }
  if (target.dataset.action === 'restart-mistakes') return startNextRound('mistakes');
  if (target.dataset.action === 'start-mistakes') return startNextRound('mistakes');
  if (target.dataset.action === 'quick-review') return startNextRound('quick');
  if (target.dataset.action === 'spelling-mode') {
    spellingMode = true;
    spellingInput = '';
    delete state.spellingFeedback;
    return continueSession();
  }
  if (target.dataset.action === 'exit-spelling') {
    spellingMode = false;
    spellingInput = '';
    delete state.spellingFeedback;
    return renderHome();
  }
  if (target.dataset.action === 'check-spelling') {
    const word = currentWord(state, words);
    if (!word) return;
    const correct = spellingInput.trim().toLowerCase() === word.word.toLowerCase();
    state.spellingFeedback = { correct, userInput: spellingInput.trim(), showAnswer: false };
    if (correct) {
      showStudyNotice('拼写正确！', 'is-green');
    } else {
      showStudyNotice('拼写错误，再试试', 'is-warm');
    }
    return renderStudy();
  }
  if (target.dataset.action === 'show-spelling-answer') {
    if (state.spellingFeedback) {
      state.spellingFeedback.showAnswer = true;
      return renderStudy();
    }
  }
  if (target.dataset.action === 'mistakes') return renderMistakes();
  if (target.dataset.action === 'profile') return renderProfile();
  if (target.dataset.action === 'save-settings') return saveSettings();
  if (target.dataset.action === 'open-reset-dialog') return openResetDialog();
  if (target.dataset.action === 'cancel-reset') return document.querySelector('#reset-dialog')?.close();
  if (target.dataset.action === 'confirm-reset') return resetProgress();
  if (target.dataset.action === 'logout') return handleLogout();
  if (target.dataset.action === 'home') return renderHome();
  if (target.dataset.action === 'speak') return audioService.play(currentWord(state, words)?.word);
  if (target.dataset.action === 'hint-letter') {
    hintLevel = Math.max(hintLevel, 1);
    return renderStudy();
  }
  if (target.dataset.action === 'hint-phonetic') {
    hintLevel = Math.max(hintLevel, 2);
    return renderStudy();
  }
  if (target.dataset.action === 'hint-image') {
    hintLevel = Math.max(hintLevel, 3);
    return renderStudy();
  }
  if (target.dataset.action === 'reveal') {
    revealed = true;
    return renderStudy();
  }
  if (target.dataset.action === 'reveal-unknown') {
    state = recallUnknown(state, words);
    revealed = true;
    hintLevel = 0;
    persist();
    return renderStudy();
  }
  if (target.dataset.answer) {
    if (spellingMode) {
      delete state.spellingFeedback;
      spellingInput = '';
    }
    return submitAnswer(target.dataset.answer);
  }
});

// 监听拼写输入
app.addEventListener('input', event => {
  if (event.target.id === 'spelling-input') {
    spellingInput = event.target.value;
    const button = document.querySelector('.check-spelling-button');
    if (button) button.disabled = !spellingInput.trim();
  }
});

// 监听拼写输入回车
app.addEventListener('keypress', event => {
  if (event.target.id === 'spelling-input' && event.key === 'Enter') {
    const button = document.querySelector('[data-action="check-spelling"]');
    if (button && !button.disabled) button.click();
  }
});

document.addEventListener('keydown', event => {
  if (!document.querySelector('.study-card') || document.querySelector('dialog[open]')) return;
  if (event.key === 'ArrowLeft') answerCurrent('unknown');
  if (event.key === 'ArrowRight') answerCurrent('known');
});

function answerCurrent(result) {
  submitAnswer(result);
}

async function init() {
  authed = null;
  try {
    const statusResp = await fetch('/api/auth/status');
    const statusData = await statusResp.json();
    if (statusData.authenticated) authed = statusData.user;
  } catch {}

  if (!authed) {
    window.location.href = '/login.html';
    return;
  }

  wordBank = await contentProvider.listWordBank();

  // 拉取账号云端进度，云端优先覆盖本地
  try {
    const pr = await fetch('/api/progress');
    const pd = await pr.json();
    if (pd.state) progressStore.save(pd.state);
  } catch {}

  const previous = progressStore.load();
  const count = previous?.settings?.roundSize || 20;
  let nextOffset = Number(previous?.nextOffset) || 0;
  if (previous?.date === dateKey() && previous?.sessionWordIds?.length) {
    words = contentProvider.listWordsByIds(previous.sessionWordIds);
  } else {
    const next = contentProvider.listNextNewWords(previous?.progress || {}, nextOffset, count);
    words = next.words;
    nextOffset = next.nextOffset;
  }
  state = startSession(words, { ...(previous || {}), nextOffset });
  persist();
  renderHome();
}

init().catch(() => {
  app.innerHTML = '<section class="screen error-state"><h1>词库加载失败</h1><p>请刷新页面后重试。</p></section>';
});
