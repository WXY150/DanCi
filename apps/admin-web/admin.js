// 管理后台逻辑

let currentUser = null;
let allWords = [];
let filteredWords = [];

// 检查认证状态
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    
    if (!data.authenticated || data.user.role !== 'admin') {
      // 未登录或非管理员，跳转到登录页
      window.location.href = '/login.html';
      return false;
    }
    
    currentUser = data.user;
    document.querySelector('#username-display').textContent = data.user.username;
    const roleEl = document.querySelector('#role-display');
    if (roleEl) roleEl.textContent = data.user.role === 'admin' ? '管理员' : '学习用户';
    return true;
  } catch (error) {
    console.error('检查认证状态失败:', error);
    window.location.href = '/login.html';
    return false;
  }
}

// 登出
async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  } catch (error) {
    console.error('登出失败:', error);
    alert('登出失败，请重试');
  }
}

// 加载词库数据
async function loadWords() {
  try {
    const response = await fetch('/api/words');
    const data = await response.json();
    allWords = data.words || [];
    filteredWords = [...allWords];
    renderWords();
    updateWordCount();
  } catch (error) {
    console.error('加载词库失败:', error);
    document.querySelector('#words-grid').innerHTML = '<p class="log-empty">加载词库失败</p>';
  }
}

// 渲染词库列表
function renderWords() {
  const grid = document.querySelector('#words-grid');
  
  if (filteredWords.length === 0) {
    grid.innerHTML = '<p class="log-empty">没有找到匹配的单词</p>';
    return;
  }
  
  grid.innerHTML = filteredWords.map(word => `
    <div class="word-card" data-word-id="${word.id}">
      <div class="word-image-preview">
        ${word.imageUrl
          ? `<img src="${escapeHtml(word.imageUrl)}" alt="${escapeHtml(word.word)} 联想图" loading="lazy" onclick="openImagePreview(${word.id})" />`
          : `<div class="word-image-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="m21 15-5-5L5 21"/>
              </svg>
              <span>暂无图片</span>
            </div>`}
      </div>
      <div class="word-card-header">
        <span class="word-title">${escapeHtml(word.word)}</span>
        <span class="word-phonetic">${escapeHtml(word.phonetic)}</span>
      </div>
      <div class="word-meaning">${escapeHtml(word.meaning)}</div>
      <div class="word-card-footer">
        <div class="word-image-status">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="m21 15-5-5L5 21"/>
          </svg>
          <span>版本 ${word.imageVersion || 1}</span>
        </div>
        <div class="word-actions">
          <button class="icon-button" onclick="regenerateImage(${word.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12"/>
            </svg>
            <span>重新生成</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// 更新词数统计
function updateWordCount() {
  document.querySelector('#total-words').textContent = filteredWords.length;
  document.querySelector('#stat-total-words').textContent = allWords.length;
  
  const withImages = allWords.filter(w => w.imageUrl).length;
  document.querySelector('#stat-with-images').textContent = withImages;
  
  const avgVersion = allWords.length > 0 
    ? (allWords.reduce((sum, w) => sum + (w.imageVersion || 1), 0) / allWords.length).toFixed(1)
    : '0';
  document.querySelector('#stat-avg-version').textContent = avgVersion;
}

// 搜索单词
function searchWords(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    filteredWords = [...allWords];
  } else {
    filteredWords = allWords.filter(word => 
      word.word.toLowerCase().includes(q) || 
      word.meaning.toLowerCase().includes(q)
    );
  }
  renderWords();
  updateWordCount();
}

// 重新生成单个单词的图片
async function regenerateImage(wordId) {
  const btn = document.querySelector('#manager-regenerate');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="mini-spinner"></span> 生成中...';
  }
  try {
    const response = await fetch(`/api/admin/words/${wordId}/regenerate-image`, {
      method: 'POST'
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '生成失败');
    }
    // 生成成功后刷新历史图片列表（新图作为候选，待挑选启用）
    await loadImageManager(wordId);
  } catch (error) {
    alert('生成图片失败: ' + error.message);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }
}

// 批量生成图片
async function startBatchGeneration() {
  const batchSize = parseInt(document.querySelector('#batch-size').value);
  const pendingWords = allWords.filter(w => !w.imageUrl || w.imageVersion === 1).slice(0, batchSize);
  
  if (pendingWords.length === 0) {
    alert('没有待生成的单词');
    return;
  }
  
  const log = document.querySelector('#gen-log');
  log.innerHTML = '';
  
  let completed = 0;
  
  for (const word of pendingWords) {
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    logItem.textContent = `正在生成: ${word.word}...`;
    log.appendChild(logItem);
    
    try {
      await regenerateImage(word.id);
      logItem.className = 'log-item success';
      logItem.textContent = `✓ ${word.word} 生成成功`;
      completed++;
    } catch (error) {
      logItem.className = 'log-item error';
      logItem.textContent = `✗ ${word.word} 失败: ${error.message}`;
    }
    
    document.querySelector('#completed-count').textContent = completed;
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  await loadWords();
}

// ==================== 用户管理 ====================

let allUsers = [];
let filteredUsers = [];

async function loadUsers() {
  try {
    const response = await fetch('/api/admin/users');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '加载失败');
    allUsers = data.users || [];
    filteredUsers = [...allUsers];
    renderUsers();
    document.querySelector('#total-users').textContent = filteredUsers.length;
  } catch (error) {
    document.querySelector('#users-tbody').innerHTML = `<tr><td colspan="6" class="users-empty">加载用户失败：${escapeHtml(error.message)}</td></tr>`;
  }
}

function searchUsers(query) {
  const q = query.toLowerCase().trim();
  filteredUsers = !q ? [...allUsers] : allUsers.filter(u => u.username.toLowerCase().includes(q));
  renderUsers();
  document.querySelector('#total-users').textContent = filteredUsers.length;
}

function renderUsers() {
  const tbody = document.querySelector('#users-tbody');
  if (!filteredUsers.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="users-empty">暂无账户</td></tr>';
    return;
  }
  tbody.innerHTML = filteredUsers.map(user => {
    const roleBadge = user.role === 'admin'
      ? '<span class="role-badge role-admin">管理员</span>'
      : '<span class="role-badge role-user">用户</span>';
    const progressText = user.has_progress ? `有进度（${user.completed_words || 0} 词）` : '无进度';
    return `<tr>
      <td><strong>${escapeHtml(user.username)}</strong></td>
      <td>${roleBadge}</td>
      <td>${formatDate(user.created_at)}</td>
      <td>${user.last_login_at ? formatDate(user.last_login_at) : '未登录'}</td>
      <td>${progressText}</td>
      <td class="user-actions">
        <button class="user-btn" onclick="viewUser(${user.id})" title="查看该用户进度">进度</button>
        <button class="user-btn" onclick="toggleRole(${user.id}, '${user.role === 'admin' ? 'user' : 'admin'}')" title="切换角色">${user.role === 'admin' ? '降为用户' : '设为管理员'}</button>
        <button class="user-btn" onclick="resetUserProgress(${user.id})" title="重置该用户进度">重置进度</button>
        <button class="user-btn user-btn-danger" onclick="deleteUser(${user.id})" title="删除该账户">删除</button>
      </td>
    </tr>`;
  }).join('');
}

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return isNaN(d) ? String(value).replace('T', ' ').slice(0, 19) : d.toLocaleString('zh-CN');
}

async function viewUser(id) {
  try {
    const response = await fetch(`/api/admin/users/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '加载失败');
    renderUserDetail(data.user, data.state);
  } catch (error) {
    alert('查看失败：' + error.message);
  }
}

function renderUserDetail(user, state) {
  const detail = document.querySelector('#user-detail');
  const closeBtn = `<button class="user-btn" onclick="document.querySelector('#user-detail').innerHTML=''">关闭</button>`;
  if (!state) {
    detail.innerHTML = `<div class="user-detail-card"><h3>${escapeHtml(user.username)}</h3><p class="muted">该用户还没有云端学习进度。</p>${closeBtn}</div>`;
    return;
  }
  const studied = Object.keys(state.progress || {}).length;
  const mastered = Object.values(state.progress || {}).filter(p => p.stage >= 3).length;
  const wrongIds = (state.wrongIds || []).length;
  const daily = state.daily || {};
  detail.innerHTML = `<div class="user-detail-card">
    <div class="user-detail-head"><div><h3>${escapeHtml(user.username)} 的学习进度</h3><span class="muted">学习日期 ${formatDate(state.date)} · 今日 ${daily.completed || 0}/${daily.goal || 0} 词</span></div>${closeBtn}</div>
    <div class="user-detail-stats">
      <div class="detail-stat"><strong>${studied}</strong><span>已学单词</span></div>
      <div class="detail-stat"><strong>${mastered}</strong><span>已掌握</span></div>
      <div class="detail-stat"><strong>${wrongIds}</strong><span>错题</span></div>
      <div class="detail-stat"><strong>${state.settings?.dailySize || 50}</strong><span>每日目标</span></div>
    </div>
  </div>`;
}

async function resetUserProgress(id) {
  if (!confirm('确定重置该用户的学习进度？此操作不可恢复。')) return;
  try {
    const response = await fetch(`/api/admin/users/${id}/reset-progress`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '重置失败');
    alert('已重置该用户进度');
    loadUsers();
  } catch (error) {
    alert('重置失败：' + error.message);
  }
}

async function deleteUser(id) {
  if (!confirm('确定删除该账户？其会话与学习进度将一并删除。')) return;
  try {
    const response = await fetch(`/api/admin/users/${id}/delete`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '删除失败');
    alert('已删除账户');
    loadUsers();
  } catch (error) {
    alert('删除失败：' + error.message);
  }
}

async function toggleRole(id, role) {
  try {
    const response = await fetch(`/api/admin/users/${id}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '操作失败');
    alert(`已${role === 'admin' ? '设为' : '取消'}管理员`);
    loadUsers();
  } catch (error) {
    alert('操作失败：' + error.message);
  }
}

// 加载系统状态
async function loadSystemStatus() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    
    document.querySelector('#db-status').textContent = data.storage === 'mysql' ? '✓ 正常运行' : '⚠ 使用本地缓存';
    document.querySelector('#ai-status').textContent = data.imageGeneration ? '✓ 已配置' : '✗ 未配置';
    document.querySelector('#server-time').textContent = new Date().toLocaleString('zh-CN');
  } catch (error) {
    console.error('加载系统状态失败:', error);
  }
}

// 视图切换（每次切换都重新校验当前登录身份，避免被个人端登录覆盖后仍显示旧账号）
async function switchView(viewName) {
  const ok = await checkAuth();
  if (!ok) return;
  document.querySelectorAll('.admin-view').forEach(view => {
    view.classList.remove('active');
  });
  
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  document.querySelector(`#${viewName}-view`)?.classList.add('active');
  document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');
  
  // 加载对应视图的数据
  if (viewName === 'words') {
    loadWords();
  } else if (viewName === 'stats') {
    loadSystemStatus();
  } else if (viewName === 'image-gen') {
    updateGenStatus();
  } else if (viewName === 'users') {
    loadUsers();
  }
}

// 更新生成状态
function updateGenStatus() {
  const pending = allWords.filter(w => !w.imageUrl).length;
  const completed = allWords.filter(w => w.imageUrl).length;
  
  document.querySelector('#pending-count').textContent = pending;
  document.querySelector('#generating-count').textContent = 0;
  document.querySelector('#completed-count').textContent = completed;
}

// ==================== 图片历史管理 ====================

let currentManagerWordId = null;

// 打开图片管理弹层
function openImagePreview(wordId) {
  const word = allWords.find(w => w.id === wordId);
  if (!word) return;
  currentManagerWordId = wordId;

  let overlay = document.querySelector('#image-preview-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'image-preview-overlay';
    overlay.className = 'image-preview-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('image-preview-close')) {
        closeImagePreview();
      }
    });
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="image-manager-dialog">
      <button class="image-preview-close" title="关闭">×</button>
      <header class="image-manager-header">
        <div class="image-preview-word">
          <strong>${escapeHtml(word.word)}</strong>
          <span>${escapeHtml(word.phonetic)}</span>
        </div>
        <p class="image-preview-meaning">${escapeHtml(word.meaning)}</p>
      </header>
      <div class="image-manager-toolbar">
        <span class="image-manager-count" id="manager-count"></span>
        <div class="image-manager-buttons">
          <button class="icon-button upload" id="manager-upload" onclick="document.querySelector('#manager-file-input').click()">
            ${iconUpload()}
            <span>上传图片</span>
          </button>
          <input type="file" id="manager-file-input" accept="image/jpeg,image/png,image/gif,image/webp" hidden />
          <button class="primary-action" id="manager-regenerate" onclick="regenerateImage(${wordId})">
            ${iconSparkles()}
            <span>生成新图片</span>
          </button>
        </div>
      </div>
      <div class="image-manager-grid" id="manager-grid">
        <div class="loading-state"><div class="spinner"></div><p>加载历史图片...</p></div>
      </div>
    </div>`;
  overlay.classList.add('open');
  document.addEventListener('keydown', handlePreviewEsc);

  // 绑定上传文件选择
  const fileInput = overlay.querySelector('#manager-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (file) uploadImage(wordId, file);
    });
  }

  loadImageManager(wordId);
}

// 上传本地图片
async function uploadImage(wordId, file) {
  const btn = document.querySelector('#manager-upload');
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="mini-spinner"></span> 上传中...';
  }
  try {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`/api/admin/words/${wordId}/upload-image`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '上传失败');
    // 上传成功后作为候选图片出现在历史列表，刷新即可
    await loadImageManager(wordId);
  } catch (error) {
    alert('上传图片失败: ' + error.message);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

// 加载某单词的历史图片
async function loadImageManager(wordId) {
  const grid = document.querySelector('#manager-grid');
  if (!grid) return;
  try {
    const response = await fetch(`/api/admin/words/${wordId}/images`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '加载失败');

    // 同步词库里的当前图片，保证关闭弹层后卡片刷新
    const word = allWords.find(w => w.id === wordId);
    if (word && data.word) {
      word.imageUrl = data.word.imageUrl;
      word.imageVersion = data.word.imageVersion;
    }

    renderImageManager(wordId, data.images || []);
  } catch (error) {
    grid.innerHTML = `<p class="log-empty">加载失败：${escapeHtml(error.message)}</p>`;
  }
}

// 渲染历史图片网格
function renderImageManager(wordId, images) {
  const grid = document.querySelector('#manager-grid');
  const count = document.querySelector('#manager-count');
  const btn = document.querySelector('#manager-regenerate');
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `${iconSparkles()}<span>生成新图片</span>`;
  }
  if (count) count.textContent = `共 ${images.length} 张历史图片`;
  if (!grid) return;

  if (images.length === 0) {
    grid.innerHTML = '<p class="log-empty">暂无图片，点击"生成新图片"创建</p>';
    return;
  }

  grid.innerHTML = images.map(img => `
    <figure class="manager-image-item ${img.isActive ? 'is-active' : ''}">
      <div class="manager-image-frame">
        <img src="${escapeHtml(img.imageUrl)}" alt="历史图片" loading="lazy" />
        ${img.isActive ? '<span class="active-badge">使用中</span>' : ''}
      </div>
      <figcaption>
        <span class="manager-image-date">${formatDate(img.createdAt)}</span>
        <div class="manager-image-actions">
          ${img.isActive
            ? '<button class="icon-button" disabled>当前图片</button>'
            : `<button class="icon-button use" onclick="activateImage(${wordId}, ${img.id})">使用</button>
               <button class="icon-button danger" onclick="deleteImage(${wordId}, ${img.id})">删除</button>`}
        </div>
      </figcaption>
    </figure>
  `).join('');
}

// 启用某张历史图片
async function activateImage(wordId, imageId) {
  try {
    const response = await fetch(`/api/admin/words/${wordId}/images/${imageId}/activate`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '切换失败');
    await loadImageManager(wordId);
    renderWords();
  } catch (error) {
    alert('切换图片失败: ' + error.message);
  }
}

// 删除某张历史图片
async function deleteImage(wordId, imageId) {
  if (!confirm('确定删除这张历史图片？此操作不可恢复。')) return;
  try {
    const response = await fetch(`/api/admin/words/${wordId}/images/${imageId}/delete`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '删除失败');
    await loadImageManager(wordId);
  } catch (error) {
    alert('删除图片失败: ' + error.message);
  }
}

function closeImagePreview() {
  const overlay = document.querySelector('#image-preview-overlay');
  if (overlay) overlay.classList.remove('open');
  document.removeEventListener('keydown', handlePreviewEsc);
  currentManagerWordId = null;
}

function handlePreviewEsc(e) {
  if (e.key === 'Escape') closeImagePreview();
}

// 火花图标
function iconSparkles() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2L12 3Z"/><path d="m18.5 13 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/></svg>';
}

// 上传图标
function iconUpload() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>';
}

// 工具函数
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 暴露到全局作用域供HTML调用
window.regenerateImage = regenerateImage;
window.openImagePreview = openImagePreview;
window.closeImagePreview = closeImagePreview;
window.activateImage = activateImage;
window.deleteImage = deleteImage;
window.viewUser = viewUser;
window.toggleRole = toggleRole;
window.resetUserProgress = resetUserProgress;
window.deleteUser = deleteUser;

// ==================== 新增单词 ====================

// 打开新增单词弹窗
function openAddWordModal() {
  let overlay = document.querySelector('#add-word-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'add-word-overlay';
    overlay.className = 'image-preview-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('image-preview-close')) {
        closeAddWordModal();
      }
    });
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="add-word-dialog">
      <button class="image-preview-close" title="关闭">×</button>
      <h2 class="add-word-title">新增单词</h2>
      <form id="add-word-form" class="add-word-form">
        <label class="field">
          <span>单词 <em>*</em></span>
          <input type="text" name="word" autocomplete="off" placeholder="如 example" required />
        </label>
        <label class="field">
          <span>音标</span>
          <input type="text" name="phonetic" autocomplete="off" placeholder="如 /ɪɡˈzɑːmpl/" />
        </label>
        <label class="field">
          <span>词性</span>
          <input type="text" name="partOfSpeech" autocomplete="off" placeholder="如 n. / v. / adj." />
        </label>
        <label class="field">
          <span>释义 <em>*</em></span>
          <textarea name="meaning" rows="2" placeholder="中文释义" required></textarea>
        </label>
        <label class="field">
          <span>记忆提示</span>
          <textarea name="mnemonic" rows="2" placeholder="助记/联想（可选）"></textarea>
        </label>
        <p class="add-word-error" id="add-word-error"></p>
        <div class="add-word-actions">
          <button type="button" class="icon-button" id="add-word-cancel">取消</button>
          <button type="submit" class="primary-action" id="add-word-submit">创建</button>
        </div>
      </form>
    </div>`;
  overlay.classList.add('open');

  overlay.querySelector('#add-word-cancel').addEventListener('click', closeAddWordModal);
  overlay.querySelector('#add-word-form').addEventListener('submit', submitAddWord);
}

function closeAddWordModal() {
  const overlay = document.querySelector('#add-word-overlay');
  if (overlay) overlay.classList.remove('open');
}

// 提交新增单词
async function submitAddWord(event) {
  event.preventDefault();
  const form = event.target;
  const errorEl = document.querySelector('#add-word-error');
  const submitBtn = document.querySelector('#add-word-submit');
  errorEl.textContent = '';

  const payload = {
    word: form.word.value.trim(),
    phonetic: form.phonetic.value.trim(),
    partOfSpeech: form.partOfSpeech.value.trim(),
    meaning: form.meaning.value.trim(),
    mnemonic: form.mnemonic.value.trim()
  };

  if (!payload.word || !payload.meaning) {
    errorEl.textContent = '单词和释义为必填项';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = '创建中...';
  try {
    const response = await fetch('/api/admin/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '创建失败');

    // 新词加入列表并刷新
    allWords.unshift(data.word);
    searchWords(document.querySelector('#word-search').value || '');
    updateWordCount();
    closeAddWordModal();

    // 直接打开图片管理，方便马上配图
    openImagePreview(data.word.id);
  } catch (error) {
    errorEl.textContent = error.message;
    submitBtn.disabled = false;
    submitBtn.textContent = '创建';
  }
}

// 事件监听
document.querySelector('#logout-button').addEventListener('click', logout);
document.querySelector('#add-word-btn')?.addEventListener('click', openAddWordModal);

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    switchView(item.dataset.view);
  });
});

document.querySelector('#word-search').addEventListener('input', (e) => {
  searchWords(e.target.value);
});

document.querySelector('#start-batch-gen').addEventListener('click', startBatchGeneration);
document.querySelector('#user-search')?.addEventListener('input', (e) => {
  searchUsers(e.target.value);
});

// 初始化
async function init() {
  const authenticated = await checkAuth();
  if (!authenticated) return;
  
  await loadWords();
  updateGenStatus();
}

init();
