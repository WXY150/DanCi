import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { contentProvider } from '../apps/user-h5/services/content.js';

const words = await contentProvider.listTodayWords(new Date(2026, 7, 19));
const bank = await contentProvider.listWordBank();

assert.equal(words.length, 20);
assert.equal(bank.length, 114);
assert.equal(new Set(words.map(word => word.id)).size, words.length);
assert.ok(bank.every(word => word.word && word.meaning));
assert.ok(bank.filter(word => word.partOfSpeech).length > 35);
assert.ok(bank.every(word => /^data\/word\/[12]\/1\//.test(word.imageUrl)));
assert.ok(bank.every(word => existsSync(path.join('apps/user-h5', word.imageUrl))), '演示词库中的每个单词都必须有图片');
assert.equal(new Set(bank.map(word => word.id)).size, bank.length, '词库 ID 不应重复');
assert.notDeepEqual(bank.slice(0, 20).map(word => word.id), bank.slice(20, 40).map(word => word.id));

const first = contentProvider.listNextNewWords({}, 0, 20);
assert.equal(contentProvider.listNextNewWords({}, 0, 35).words.length, 35, '修改每轮词数后应立即得到对应数量的当前轮');
const studied = Object.fromEntries(first.words.map(word => [word.id, { known: 1 }]));
const second = contentProvider.listNextNewWords(studied, first.nextOffset, 20);
assert.equal(second.words.length, 20);
assert.equal(second.words.some(word => studied[word.id]), false, '新词未学完前不应重复已学词');

const allStudied = Object.fromEntries(bank.map(word => [word.id, { known: 1 }]));
assert.equal(contentProvider.listNextNewWords(allStudied, 0, 20).words.length, 20, '全部学完后可以重新循环词库');

console.log('content-check passed');
