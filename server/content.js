export function learnerWord(word, publicOrigin = '') {
  const imageUrl = word.imageUrl || '';
  const imagePath = imageUrl
    ? imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
    : '';
  const absoluteImageUrl = imagePath && publicOrigin
    ? `${publicOrigin}${imagePath}`
    : imagePath;
  return {
    id: word.id,
    word: word.word,
    phonetic: word.phonetic,
    partOfSpeech: word.partOfSpeech,
    meaning: word.meaning,
    mnemonic: word.mnemonic,
    imageUrl: absoluteImageUrl,
    imageVersion: word.imageVersion || 1
  };
}

export function learnerWords(words, publicOrigin = '') {
  return words.map(word => learnerWord(word, publicOrigin));
}
