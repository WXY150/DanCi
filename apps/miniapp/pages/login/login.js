const auth = require('../../services/auth');

Page({
  data: { loading: false, error: '' },
  onLogin() {
    this.setData({ loading: true, error: '' });
    auth.login().then(() => {
      wx.reLaunch({ url: '/pages/home/home' });
    }).catch(error => {
      this.setData({ error: error.message || '登录失败' });
    }).finally(() => this.setData({ loading: false }));
  }
});
