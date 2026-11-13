// 统一登录/注册页面逻辑

const form = document.querySelector('#login-form');
const errorMessage = document.querySelector('#error-message');
const loginButton = document.querySelector('#login-button');
const buttonText = loginButton.querySelector('.button-text');
const buttonSpinner = loginButton.querySelector('.button-spinner');
const subtitle = document.querySelector('#login-subtitle');
const passwordInput = document.querySelector('#password');

let mode = 'login'; // 'login' | 'signup'

// 根据角色跳转
function redirectByRole(user) {
  if (user && user.role === 'admin') {
    window.location.href = '/admin.html';
  } else {
    window.location.href = '/index.html';
  }
}

// 检查是否已登录
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    if (data.authenticated) {
      redirectByRole(data.user);
    }
  } catch (error) {
    console.error('检查登录状态失败:', error);
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

function clearError() {
  errorMessage.textContent = '';
  errorMessage.style.display = 'none';
}

function setLoading(loading) {
  loginButton.disabled = loading;
  buttonText.style.display = loading ? 'none' : 'inline';
  buttonSpinner.style.display = loading ? 'inline-block' : 'none';
}

// 切换登录/注册
function switchMode(nextMode) {
  mode = nextMode;
  clearError();
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === mode);
  });
  if (mode === 'signup') {
    buttonText.textContent = '注册并登录';
    subtitle.textContent = '注册后学习进度将保存到你的账号，可跨设备同步';
    passwordInput.setAttribute('autocomplete', 'new-password');
    passwordInput.setAttribute('placeholder', '至少6位');
  } else {
    buttonText.textContent = '登录';
    subtitle.textContent = '登录后学习进度将同步到你的账号，可跨设备使用';
    passwordInput.setAttribute('autocomplete', 'current-password');
    passwordInput.setAttribute('placeholder', '请输入密码');
  }
}

document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => switchMode(tab.dataset.tab));
});

// 处理表单提交
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  const username = document.querySelector('#username').value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showError('请输入用户名和密码');
    return;
  }

  setLoading(true);

  try {
    // 注册模式先调用 signup
    if (mode === 'signup') {
      const signupResp = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!signupResp.ok) {
        const sd = await signupResp.json().catch(() => ({}));
        throw new Error(sd.error || '注册失败');
      }
    }

    // 登录
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '登录失败');
    }

    if (data.success && data.user) {
      redirectByRole(data.user);
    } else {
      throw new Error('登录失败，请重试');
    }
  } catch (error) {
    showError(error.message || '操作失败，请检查网络连接');
    setLoading(false);
  }
});

// 页面加载时检查登录状态
checkAuth();

// 监听输入框，清除错误消息
document.querySelector('#username').addEventListener('input', clearError);
passwordInput.addEventListener('input', clearError);
