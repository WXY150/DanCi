const api = require('../../services/api');
const learning = require('../../services/learning');
const session = require('../../services/session');

Page({
  data: { word: null, revealed: false, error: '', imageUnavailable: false, busy: false, progress: 0 },
  onLoad() {
    const words = wx.getStorageSync('danci_words') || [];
    const state = session.load();
    this.words = words;
    this.state = state;
    this.renderWord();
  },
  renderWord() {
    const word = learning.currentWord(this.state, this.words);
    if (!word || this.state.done) {
      wx.redirectTo({ url: '/pages/result/result' });
      return;
    }
    this.setData({ word, revealed: false, imageUnavailable: false, progress: this.state.completedIds.length });
  },
  onReveal() {
    this.setData({ revealed: true });
  },
  onUnknown() {
    if (!this.data.revealed) {
      this.setData({ revealed: true });
      return;
    }
    this.submit('unknown');
  },
  onKnown() {
    this.submit('known');
  },
  onImageError() {
    this.setData({ imageUnavailable: true });
  },
  onHome() {
    wx.reLaunch({ url: '/pages/home/home' });
  },
  submit(result) {
    if (this.data.busy) return;
    this.setData({ busy: true, error: '' });
    const next = learning.answer(this.state, this.words, result);
    const baseRevision = session.revision();
    session.save(next, baseRevision);
    api.request('/api/v1/progress', {
      method: 'PUT',
      data: { state: next, baseRevision, clientMutationId: `${Date.now()}-${Math.random().toString(16).slice(2)}` }
    }).then(saved => {
      session.save(next, saved.revision);
      this.state = next;
      this.renderWord();
    }).catch(error => {
      if (error.code === 'progress_conflict') {
        this.setData({ error: '进度已在其他设备更新，请返回首页刷新' });
      } else {
        this.state = next;
        this.renderWord();
      }
    }).finally(() => this.setData({ busy: false }));
  }
});
