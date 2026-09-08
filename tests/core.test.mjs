import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeLetter, decodeLetter, validateLetter } from '../src/letter-codec.js';

const sample = {
  recipient: '하윤',
  sender: '제권',
  message: '오늘도 고마워.\n앞으로도 함께하자!',
  theme: 'rose',
  alignment: 'center',
};

test('letter payload survives a URL-safe Korean round trip', () => {
  const encoded = encodeLetter(sample);
  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodeLetter(encoded), sample);
});

test('validateLetter trims fields and rejects an empty message', () => {
  assert.deepEqual(validateLetter({ recipient: ' 하윤 ', sender: ' 제권 ', message: ' 안녕 ', theme: 'sage' }), {
    recipient: '하윤', sender: '제권', message: '안녕', theme: 'sage', alignment: 'left',
  });
  assert.throws(() => validateLetter({ recipient: '', sender: '', message: '   ', theme: 'sage' }), /편지 내용을 입력/);
});

test('validateLetter preserves supported text alignment and rejects unknown values', () => {
  assert.equal(validateLetter({ message: '가운데', alignment: 'center' }).alignment, 'center');
  assert.equal(validateLetter({ message: '오른쪽', alignment: 'right' }).alignment, 'right');
  assert.equal(validateLetter({ message: '기본', alignment: 'sideways' }).alignment, 'left');
});

test('decoder rejects malformed links without executing content', () => {
  assert.throws(() => decodeLetter('not-a-real-letter'), /열 수 없는 편지/);
});
