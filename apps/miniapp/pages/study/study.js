Page({
  data: { word: null },
  onLoad() {
    const words = wx.getStorageSync('danci_words') || [];
    this.setData({ word: words[0] || null });
  }
});
