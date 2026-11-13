const STORAGE_KEY = 'danci_state_v5_mysql_word2';
let memoryState = null;

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export const progressStore = {
  load() {
    try {
      return clone(JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY) || 'null'));
    } catch {
      return clone(memoryState);
    }
  },

  save(state) {
    const next = clone(state);
    memoryState = next;
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // 内存回退保证隐私模式或受限环境仍可完成当前会话。
    }
    return next;
  },

  clear() {
    memoryState = null;
    try {
      globalThis.localStorage?.removeItem(STORAGE_KEY);
    } catch {
      // 没有持久化能力时无需额外处理。
    }
  }
};
