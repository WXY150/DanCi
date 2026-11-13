const session = require('../../services/session');

Page({
  data: { completed: 0, answered: 0 },
  onLoad() {
    const state = session.load() || { completedIds: [], answers: { known: 0, unknown: 0 } };
    this.setData({ completed: state.completedIds.length, answered: state.answers.known + state.answers.unknown });
  },
  backHome() {
    wx.reLaunch({ url: '/pages/home/home' });
  }
});
