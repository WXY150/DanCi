const api = require('../../services/api');
const auth = require('../../services/auth');
const learning = require('../../services/learning');
const session = require('../../services/session');

Page({
  data: { loading: true, user: null, wordCount: 0, error: '' },
  onLoad() {
    Promise.all([auth.me(), api.request('/api/v1/words'), api.request('/api/v1/progress').catch(() => ({ state: null, revision: 0 }))]).then(([user, payload, remote]) => {
      wx.setStorageSync('danci_words', payload.words || []);
      const words = payload.words || [];
      let state = remote.state || session.load();
      if (!state || state.done || !state.sessionWordIds?.length) {
        state = learning.startSession(words.slice(0, 20), state);
      }
      session.save(state, remote.revision);
      this.setData({ user, wordCount: words.length, completed: state.completedIds.length, loading: false });
    }).catch(error => {
      if (error.statusCode === 401) {
        wx.reLaunch({ url: '/pages/login/login' });
        return;
      }
      this.setData({ error: error.message || '加载失败', loading: false });
    });
  },
  startStudy() {
    wx.navigateTo({ url: '/pages/study/study' });
  },
  onRetry() {
    this.setData({ loading: true, error: '' });
    this.onLoad();
  },
  openProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  }
});
