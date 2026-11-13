const KEY = 'danci_miniapp_learning_state';

function load() {
  return wx.getStorageSync(KEY) || null;
}

function save(state, revision = 0) {
  wx.setStorageSync(KEY, state);
  wx.setStorageSync(`${KEY}:revision`, Number(revision) || 0);
}

function revision() {
  return Number(wx.getStorageSync(`${KEY}:revision`)) || 0;
}

module.exports = { load, save, revision };
