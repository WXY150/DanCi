const env = require('../config/env');

function appState() {
  return getApp().globalData;
}

function request(path, options = {}) {
  const state = appState();
  const token = state.sessionToken || wx.getStorageSync('danci_session_token');
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${state.apiOrigin || env.API_ORIGIN}${path}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.header || {})
      },
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data);
          return;
        }
        const error = response.data?.error || {};
        reject(Object.assign(new Error(error.message || '服务请求失败'), {
          code: error.code,
          statusCode: response.statusCode,
          details: error.details
        }));
      },
      fail(error) {
        reject(Object.assign(new Error('网络连接失败，请稍后重试'), { cause: error }));
      }
    });
  });
}

module.exports = { request };
