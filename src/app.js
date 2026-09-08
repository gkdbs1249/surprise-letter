import { decodeLetter, encodeLetter, validateLetter } from './letter-codec.js';

const HISTORY_KEY = 'surprise-letter-history-v1';
const $ = selector => document.querySelector(selector);

function show(view) {
  ['#creator-view', '#recipient-view', '#error-view'].forEach(selector => { $(selector).hidden = selector !== view; });
}

function loadHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(value) ? value.slice(0, 20) : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)));
}

function renderHistory() {
  const items = loadHistory();
  const section = $('#history-section');
  section.hidden = items.length === 0;
  $('#history-list').replaceChildren(...items.map((item, index) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    const label = document.createElement('strong');
    const action = document.createElement('span');
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener';
    label.textContent = `${item.recipient}에게 보낸 편지`;
    action.textContent = '열어보기 →';
    link.append(label, action);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'history-delete';
    remove.dataset.historyIndex = String(index);
    remove.setAttribute('aria-label', `${item.recipient}에게 보낸 편지 삭제`);
    remove.textContent = '×';
    li.append(link, remove);
    return li;
  }));
}

function makeUrl(encoded) {
  return `${location.origin}${location.pathname}#letter=${encoded}`;
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
  $('#recipient-view').className = `recipient-shell theme-${theme}`;
}

function renderRecipient(letter) {
  show('#recipient-view');
  setTheme(letter.theme);
  $('#delivery-label').textContent = `${letter.recipient}님께 도착한 편지`;
  $('#letter-recipient').textContent = letter.recipient;
  $('#letter-message').textContent = letter.message;
  $('#letter-message').style.textAlign = letter.alignment;
  $('#letter-sender').textContent = letter.sender;
  const envelope = $('#envelope');
  const sheet = $('#letter-sheet');
  envelope.addEventListener('click', () => {
    if (envelope.classList.contains('opened')) return;
    sheet.hidden = false;
    envelope.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => requestAnimationFrame(() => envelope.classList.add('opened')));
  });
}

function renderCreator() {
  show('#creator-view');
  document.body.dataset.theme = 'rose';
  renderHistory();
}

function route() {
  const value = location.hash.startsWith('#letter=') ? location.hash.slice(8) : '';
  if (!value) return renderCreator();
  try {
    renderRecipient(decodeLetter(value));
  } catch {
    show('#error-view');
  }
}

$('#letter-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const error = $('#form-error');
  try {
    const letter = validateLetter(Object.fromEntries(new FormData(form)));
    const url = makeUrl(encodeLetter(letter));
    $('#share-link').value = url;
    $('#preview-link').href = url;
    $('#share-result').hidden = false;
    error.hidden = true;
    saveHistory([{ recipient: letter.recipient, url }, ...loadHistory()]);
    renderHistory();
    $('#share-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (cause) {
    error.textContent = cause.message;
    error.hidden = false;
  }
});

$('#copy-link').addEventListener('click', async event => {
  const input = $('#share-link');
  try {
    await navigator.clipboard.writeText(input.value);
  } catch {
    input.select();
    document.execCommand('copy');
  }
  event.currentTarget.textContent = '복사됨';
  setTimeout(() => { event.currentTarget.textContent = '복사'; }, 1400);
});

$('#share-native').addEventListener('click', async event => {
  const payload = {
    title: '도착한 비밀편지 열어보기',
    text: '도착한 비밀편지 열어보기',
    url: $('#share-link').value,
  };
  if (navigator.share) {
    try { await navigator.share(payload); }
    catch (error) { if (error.name !== 'AbortError') throw error; }
    return;
  }
  try { await navigator.clipboard.writeText(payload.url); }
  catch { $('#share-link').select(); document.execCommand('copy'); }
  event.currentTarget.textContent = '공유 링크 복사됨';
  setTimeout(() => { event.currentTarget.textContent = 'SNS로 공유하기'; }, 1400);
});

$('#history-list').addEventListener('click', event => {
  const button = event.target.closest('[data-history-index]');
  if (!button) return;
  const items = loadHistory();
  items.splice(Number(button.dataset.historyIndex), 1);
  saveHistory(items);
  renderHistory();
});

addEventListener('hashchange', route);
route();
