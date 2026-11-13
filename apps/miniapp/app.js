App({
  globalData: {
    apiOrigin: require('./config/env').API_ORIGIN,
    sessionToken: ''
  },

  onLaunch() {
    const token = wx.getStorageSync('danci_session_token');
    if (token) this.globalData.sessionToken = token;
  }
});
