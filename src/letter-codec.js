const THEMES = new Set(['rose', 'sage', 'night']);

export function validateLetter(input = {}) {
  const message = String(input.message ?? '').trim();
  if (!message) throw new Error('편지 내용을 입력해 주세요.');
  return {
    recipient: String(input.recipient ?? '').trim() || '소중한 사람',
    sender: String(input.sender ?? '').trim() || '마음을 보낸 사람',
    message: message.slice(0, 3000),
    theme: THEMES.has(input.theme) ? input.theme : 'rose',
  };
}

function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function base64ToBytes(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

export function encodeLetter(input) {
  const letter = validateLetter(input);
  return bytesToBase64(new TextEncoder().encode(JSON.stringify(letter)));
}

export function decodeLetter(value) {
  try {
    if (!value || !/^[A-Za-z0-9_-]+$/u.test(value)) throw new Error('invalid');
    const parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(base64ToBytes(value)));
    return validateLetter(parsed);
  } catch {
    throw new Error('열 수 없는 편지예요.');
  }
}
