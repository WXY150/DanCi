const api = require('./api');

function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(loginResult) {
        if (!loginResult.code) {
          reject(new Error('未获取到微信登录凭证'));
          return;
        }
        api.request('/api/v1/auth/wechat-login', {
          method: 'POST',
          data: { code: loginResult.code }
        }).then(result => {
          const app = getApp();
          app.globalData.sessionToken = result.token;
          wx.setStorageSync('danci_session_token', result.token);
          wx.setStorageSync('danci_user', result.user);
          resolve(result.user);
        }).catch(reject);
      },
      fail: reject
    });
  });
}

function me() {
  return api.request('/api/v1/auth/me').then(result => result.user);
}

function logout() {
  return api.request('/api/v1/auth/logout', { method: 'POST' }).finally(() => {
    const app = getApp();
    app.globalData.sessionToken = '';
    wx.removeStorageSync('danci_session_token');
    wx.removeStorageSync('danci_user');
  });
}

module.exports = { login, me, logout };
