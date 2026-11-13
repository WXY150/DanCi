const api = require('../../services/api');
const auth = require('../../services/auth');

Page({
  data: { loading: true, user: null, wordCount: 0, error: '' },
  onLoad() {
    Promise.all([auth.me(), api.request('/api/v1/words')]).then(([user, payload]) => {
      wx.setStorageSync('danci_words', payload.words || []);
      this.setData({ user, wordCount: (payload.words || []).length, loading: false });
    }).catch(error => {
      this.setData({ error: error.message || '加载失败', loading: false });
    });
  },
  startStudy() {
    wx.navigateTo({ url: '/pages/study/study' });
  },
  openProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  }
});
