export const audioService = {
  play(word) {
    if (!('speechSynthesis' in globalThis) || !word) return false;
    globalThis.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.82;
    globalThis.speechSynthesis.speak(utterance);
    return true;
  }
};
