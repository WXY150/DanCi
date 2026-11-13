const auth = require('../../services/auth');

Page({
  data: { user: wx.getStorageSync('danci_user') || null },
  onLogout() {
    auth.logout().finally(() => wx.reLaunch({ url: '/pages/login/login' }));
  }
});
