/* =========================================================================
   Меню сообщества «Умка» — виджет сообщества ВКонтакте.

   Что делает приложение:
   • показывает список пунктов меню и даёт править его прямо во ВКонтакте
     (в том числе с телефона);
   • сохраняет список в VK Storage — он привязан к аккаунту, а не к телефону,
     поэтому правки видны с любого устройства;
   • одной кнопкой ставит/обновляет виджет на странице сообщества.

   Файлы рядом: index.html, vk-bridge.min.js (локальная копия VK Bridge).

   ВАЖНО: виджеты сообществ принимают только внутренние ссылки ВК
   (vk.com / vk.ru / vk.me). Внешние сайты — нельзя.
   ========================================================================= */

/* Значения по умолчанию. Их видно при первом запуске и после «Сбросить». */
const CONFIG = {
  title: 'Добрый день, Ульяна!',
  // Иконка пунктов:
  //  'logo'  — логотип Умки (иконка приложения, icon_id = app<ID>);
  //  'emoji' — эмодзи медвежонка 🐻 перед названием.
  iconMode: 'logo',
  icon: '🐻',              // эмодзи для режима 'emoji'
  community: 'ymka32020',  // короткое имя сообщества
  appId: 54809979,         // ID мини-приложения (короткий адрес vk.com/app54809979)
  groupId: 212278594,      // ID сообщества Умка (vk.com/club212278594)
  columns: 2,              // колонок в таблице-виджете (2 или 3, максимум 6)
  // 'tiles' — плитки с логотипом (3–10 шт.), 'table' — сетка, 'list' — список (до 6)
  widgetType: 'tiles',
  // Куда ведут пункты:
  //  'app'     — страница приложения со ВСЕМИ постами по хештегу (без фильтра по датам);
  //  'wall'    — штатный поиск по записям сообщества (vk.com/wall-<ID>?q=…);
  //  'hashtag' — общий поиск ВК по хештегу (vk.com/feed?section=search&q=…).
  searchMode: 'app',
  items: [
    { text: '«Умка» — это люди', hashtag: 'УмкаЭтоЛюди' },
    { text: 'Итоги недели', hashtag: 'УмкаИтогиНедели' },
    { text: 'Умка готовится к…', hashtag: 'УмкаГотовится' },
    { text: 'Умка знает правила', hashtag: 'УмкаЗнаетПравила' },
    { text: 'Умкины истории', hashtag: 'УмкиныИстории' },
    { text: 'Умка благодарит', hashtag: 'УмкаБлагодарит' },
    { text: 'Умка в деле', hashtag: 'УмкаВДеле' },
    { text: 'Умкины будни', hashtag: 'УмкиныБудни' },
    { text: 'Умка рекомендует', hashtag: 'УмкаРекомендует' },
    { text: 'Добро начинается с тебя', hashtag: 'ДоброНачинаетсяСТебя' },
  ],
};

const MAX_LIST_ITEMS = 6;
const MAX_TABLE_COLUMNS = 6;
const MAX_TABLE_ROWS = 11;
const STORAGE_PREFIX = 'umka_menu_';
/** Версия файла — видна в приложении и в журнале. Меняйте при каждой правке. */
const APP_VERSION = 'v1.09 (09.10.2026)';

/* ------------------------------------------------------------------ */
/* Логика меню — от здесь и до разделителя ниже нет обращений к DOM.   */
/* ------------------------------------------------------------------ */

/** Состояние: копия CONFIG, которую правит пользователь. */
const state = {
  title: CONFIG.title,
  iconMode: CONFIG.iconMode,
  icon: CONFIG.icon,
  columns: CONFIG.columns,
  widgetType: CONFIG.widgetType,
  searchMode: CONFIG.searchMode,
  items: CONFIG.items.map((i) => Object.assign({}, i)),
  tag: null,
  groupId: CONFIG.groupId ? String(CONFIG.groupId) : null,
  role: null,
  platform: null,
  appId: CONFIG.appId ? String(CONFIG.appId) : null,
  bridgeOk: false,
};

/** Подпись пункта. В режиме эмодзи — с медвежонком перед названием. */
function itemLabel(item) {
  if (state.iconMode === 'emoji' && state.icon) return state.icon + ' ' + item.text;
  return item.text;
}

/** Идентификатор картинки-иконки для виджета: иконка приложения = логотип Умки. */
function itemIconId() {
  if (state.iconMode !== 'logo') return null;
  const appId = state.appId || CONFIG.appId;
  return appId ? 'app' + appId : null;
}

/** Хештег → ASCII-код (по 4 hex-цифры на символ). Кириллицу в URL не передаём,
 *  иначе ВК перекодирует её и получаются «кракозябры» вида РЈРјРєР°…
 *  Код короткий: ВК разрешает в виджете ссылки не длиннее 200 символов. */
function tagToHex(tag) {
  const s = String(tag || '');
  let out = '';
  for (let i = 0; i < s.length; i++) {
    out += s.charCodeAt(i).toString(16).padStart(4, '0');
  }
  return out;
}

/** ASCII-код → хештег. Понимает и новый код (4 цифры), и старый (5 цифр). */
function hexToTag(hex) {
  const s = String(hex || '');
  if (!s || !/^[0-9a-f]+$/i.test(s)) return null;
  let width;
  if (s.length % 4 === 0) width = 4;
  else if (s.length % 5 === 0) width = 5;
  else return null;
  let out = '';
  for (let i = 0; i < s.length; i += width) {
    const code = parseInt(s.substr(i, width), 16);
    if (!isFinite(code) || code < 32) return null;
    out += String.fromCharCode(code);
  }
  return out;
}

/* --- починка «кракозябр» на случай старых ссылок с кириллицей в URL ------- */
const MOJIBAKE_RE = /[ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏђ‘’“”•–—™љ›њќћџЎўЈ¤Ґ¦§Ё©Є«¬®Ї°±Ііґµ¶·ё№є»јЅѕї¿]/;

let cp1251Reverse = null;

function buildCp1251Reverse() {
  if (cp1251Reverse) return cp1251Reverse;
  cp1251Reverse = {};
  try {
    const dec = new TextDecoder('windows-1251');
    for (let b = 128; b < 256; b++) {
      const ch = dec.decode(new Uint8Array([b]));
      if (ch && ch.length === 1 && ch !== '\uFFFD') cp1251Reverse[ch] = b;
    }
  } catch (error) {
    cp1251Reverse = {};
  }
  return cp1251Reverse;
}

/** Если ВК перекодировал кириллицу в cp1251 — возвращаем читаемый хештег. */
function repairTag(raw) {
  const s = String(raw || '').trim();
  if (!s || !MOJIBAKE_RE.test(s)) return s;
  const map = buildCp1251Reverse();
  const bytes = [];
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (code < 128) {
      bytes.push(code);
      continue;
    }
    const b = map[ch];
    if (b === undefined) return s;
    bytes.push(b);
  }
  try {
    const fixed = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
    return fixed || s;
  } catch (error) {
    return s;
  }
}

/** Ссылка пункта: либо заданная явно, либо страница приложения/поиск по хештегу.
 *
 * Формат ссылок важен:
 *  • 'app'     — vk.com/app<ID>_-<GROUP>#h=<ASCII-код хештега> — открывает наше приложение,
 *                которое через API показывает ВСЕ посты с хештегом, без фильтра по датам;
 *  • 'wall'    — vk.com/wall-<ID>?q=%23хештег (штатный поиск по записям сообщества);
 *  • 'hashtag' — vk.com/feed?section=search&q=%23хештег (общий поиск ВК).
 */
function itemUrl(item) {
  if (item.url) return item.url;
  const rawTag = String(item.hashtag || '').replace(/^#/, '').trim();
  const tag = '%23' + encodeURIComponent(rawTag);
  const mode = state.searchMode === 'community' ? 'wall' : state.searchMode;

  if (mode === 'app') {
    const appId = state.appId || CONFIG.appId;
    const gid = String(state.groupId || CONFIG.groupId || '').replace('-', '');
    if (appId) {
      // h= — ASCII-код хештега. Никакой кириллицы: ВК её портит,
      // а ссылка в виджете ограничена 200 символами.
      const appUrl = 'https://vk.com/app' + appId + (gid ? '_-' + gid : '') + '#h=' + tagToHex(rawTag);
      if (appUrl.length <= 200) return appUrl;
      // если вдруг длиннее лимита ВК — отдаём штатный поиск по записям
    }
    return 'https://vk.com/wall-' + gid + '?q=' + tag;
  }
  if (mode === 'hashtag') {
    return 'https://vk.com/feed?section=search&q=' + tag;
  }
  const gid = String(state.groupId || CONFIG.groupId || '').replace('-', '');
  if (gid) return 'https://vk.com/wall-' + gid + '?q=' + tag;
  // запасной вариант, если ID сообщества неизвестен
  return 'https://vk.com/' + CONFIG.community + '?q=' + tag;
}

/** Собирает VKScript-код виджета из текущего состояния. */
function buildWidgetCode() {
  const items = state.items.filter((i) => i && i.text);
  const widget = { title: state.title };
  const iconId = itemIconId();

  if (state.widgetType === 'tiles') {
    // Плитки: у каждой — логотип Умки (иконка приложения) и подпись.
    widget.tiles = items.slice(0, 10).map((item) => {
      const tile = {
        title: itemLabel(item),
        url: itemUrl(item),
      };
      if (iconId) tile.icon_id = iconId;
      const tag = String(item.hashtag || '').replace(/^#/, '');
      if (tag && !item.url) tile.descr = '#' + tag;
      return tile;
    });
  } else if (state.widgetType === 'table') {
    const columns = Math.min(Math.max(1, state.columns), MAX_TABLE_COLUMNS);
    const rows = items.slice(0, columns * MAX_TABLE_ROWS);
    const body = [];
    for (let i = 0; i < rows.length; i += columns) {
      const row = [];
      for (let j = 0; j < columns; j++) {
        const item = rows[i + j];
        if (!item) {
          row.push({ text: '\u00A0' });
          continue;
        }
        const cell = { text: itemLabel(item), url: itemUrl(item) };
        // В таблице картинка допустима только в первой ячейке строки.
        if (iconId && j === 0) cell.icon_id = iconId;
        row.push(cell);
      }
      body.push(row);
    }
    widget.body = body;
  } else {
    // list / compact_list: картинка должна быть либо у всех пунктов, либо ни у кого.
    widget.rows = items.slice(0, MAX_LIST_ITEMS).map((item) => {
      const row = { title: itemLabel(item), title_url: itemUrl(item) };
      if (iconId) row.icon_id = iconId;
      return row;
    });
  }

  // параметр code — строка с VKScript, заканчивающаяся точкой с запятой
  return 'return ' + JSON.stringify(widget) + ';';
}

/** Текст редактора → массив пунктов. Формат строки: «Название | хештег». */
function parseItems(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|');
      const title = (parts[0] || '').trim();
      const second = (parts.slice(1).join('|') || '').trim();
      if (!title) return null;
      if (/^https?:\/\//i.test(second)) return { text: title, url: second };
      return { text: title, hashtag: second.replace(/^#/, '').trim() };
    })
    .filter(Boolean);
}

/** Массив пунктов → текст редактора. */
function itemsToText(items) {
  return (items || [])
    .map((i) => i.text + ' | ' + (i.url ? i.url : '#' + String(i.hashtag || '').replace(/^#/, '')))
    .join('\n');
}

/** Проверка перед отправкой: возвращает массив замечаний. */
function validate() {
  const problems = [];
  if (!state.items.length) problems.push('Список пунктов пуст.');
  if (state.widgetType === 'tiles') {
    if (state.items.length < 3) problems.push('Для плиток нужно минимум 3 пункта.');
    if (state.items.length > 10) problems.push('Для плиток максимум 10 пунктов — сейчас ' + state.items.length + '.');
    if (state.iconMode === 'logo' && !(state.appId || CONFIG.appId)) {
      problems.push('Не известен ID приложения — логотип в плитках не подставится.');
    }
  } else if (state.widgetType === 'table') {
    if (state.columns < 1 || state.columns > MAX_TABLE_COLUMNS) problems.push('Колонок должно быть от 1 до 6.');
    if (state.items.length > state.columns * MAX_TABLE_ROWS) problems.push('Слишком много пунктов для таблицы.');
    if (state.iconMode === 'logo' && state.columns > 1) {
      problems.push('В таблице логотип встанет только в левую колонку. Для логотипа у всех пунктов выберите «Плитки» или список в 1 колонку.');
    }
  } else if (state.items.length > MAX_LIST_ITEMS) {
    problems.push('Для списка максимум 6 пунктов — сейчас ' + state.items.length + '.');
  }
  state.items.forEach((item) => {
    const url = itemUrl(item);
    if (!/^https:\/\/(vk\.com|vk\.ru|vk\.me)\//.test(url)) {
      problems.push('Ссылка пункта должна быть внутренней ВК: ' + item.text);
    }
    if (url.length > 200) {
      problems.push('Ссылка пункта «' + item.text + '» длиннее 200 символов (' + url.length + ') — ВК её не примет.');
    }
    if (itemLabel(item).length > 100) problems.push('Слишком длинное название: ' + item.text);
  });
  if (state.title.length > 100) problems.push('Заголовок длиннее 100 символов.');
  return problems;
}

function storageKey() {
  return STORAGE_PREFIX + (state.groupId ? String(state.groupId).replace('-', '') : 'default');
}

function serializeConfig() {
  return JSON.stringify({
    title: state.title,
    iconMode: state.iconMode,
    icon: state.icon,
    columns: state.columns,
    widgetType: state.widgetType,
    searchMode: state.searchMode,
    items: state.items,
  });
}

/** Применяет сохранённый конфиг к состоянию (с проверкой полей). */
function applyConfig(data) {
  if (!data || typeof data !== 'object') return;
  if (typeof data.title === 'string') state.title = data.title;
  if (data.iconMode === 'logo' || data.iconMode === 'emoji') state.iconMode = data.iconMode;
  if (typeof data.icon === 'string') state.icon = data.icon;
  if (Number(data.columns) > 0) state.columns = Number(data.columns);
  if (data.widgetType === 'table' || data.widgetType === 'list' || data.widgetType === 'tiles') {
    state.widgetType = data.widgetType;
  }
  if (data.searchMode === 'community') state.searchMode = 'wall';
  else if (['app', 'wall', 'hashtag'].indexOf(data.searchMode) >= 0) state.searchMode = data.searchMode;
  if (Array.isArray(data.items) && data.items.length) {
    state.items = data.items
      .filter((i) => i && i.text)
      .map((i) => (i.url ? { text: i.text, url: i.url } : { text: i.text, hashtag: i.hashtag || '' }));
  }
}

/* ------------------------------ UI -------------------------------------- */

const $ = (id) => document.getElementById(id);

function errText(error) {
  if (!error) return 'неизвестная ошибка';
  if (typeof error === 'string') return error;
  return error.error_msg || error.error_description || error.message || JSON.stringify(error);
}

function log(message, kind) {
  const box = $('log');
  const line = document.createElement('div');
  if (kind) line.className = kind;
  const time = new Date().toLocaleTimeString('ru-RU');
  line.textContent = '[' + time + '] ' + message;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

function fatal(html) {
  const box = $('fatal');
  box.hidden = false;
  box.innerHTML = html;
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('таймаут: ' + label)), ms)),
  ]);
}

/** Запущено ли приложение внутри ВКонтакте. */
let embedded = false;

/** Можно ли вызывать методы VK Bridge (внутри ВК и мост ответил). */
function bridgeUsable() {
  return typeof vkBridge !== 'undefined' && state.bridgeOk;
}

function renderStatus() {
  const parts = [];
  parts.push(APP_VERSION);
  parts.push(state.bridgeOk ? 'VK Bridge: ок' : 'VK Bridge: нет связи');
  if (state.appId) parts.push('приложение ' + state.appId);
  if (state.groupId) parts.push('сообщество ' + state.groupId);
  if (state.role) parts.push('роль: ' + state.role);
  if (state.platform) parts.push(state.platform);
  $('statusline').textContent = parts.join(' · ');
}

function renderPreview() {
  const box = $('preview');
  box.innerHTML = '';
  const useLogo = state.iconMode === 'logo';

  const title = document.createElement('div');
  title.className = 'widget-title';
  title.textContent = state.title;
  box.appendChild(title);

  if (state.widgetType === 'tiles') {
    const grid = document.createElement('div');
    grid.className = 'widget-tiles';
    state.items.slice(0, 10).forEach((item) => {
      const tile = document.createElement('a');
      tile.className = 'tile';
      tile.href = itemUrl(item);
      tile.target = '_blank';
      tile.rel = 'noopener';

      const pic = document.createElement('img');
      pic.className = 'tile-pic';
      pic.src = 'logo-bear.png';
      pic.alt = '';
      tile.appendChild(pic);

      const cap = document.createElement('span');
      cap.className = 'tile-cap';
      cap.textContent = itemLabel(item);
      tile.appendChild(cap);

      grid.appendChild(tile);
    });
    box.appendChild(grid);
  } else {
    const wrap = document.createElement('div');
    wrap.className = state.widgetType === 'table' ? 'widget-grid' : 'widget-rows';
    if (state.widgetType === 'table') {
      wrap.style.gridTemplateColumns = 'repeat(' + Math.min(state.columns, 3) + ', minmax(0, 1fr))';
    }
    const list = state.widgetType === 'table' ? state.items : state.items.slice(0, MAX_LIST_ITEMS);
    list.forEach((item) => {
      const a = document.createElement('a');
      a.href = itemUrl(item);
      a.target = '_blank';
      a.rel = 'noopener';
      if (useLogo) {
        const pic = document.createElement('img');
        pic.className = 'item-pic';
        pic.src = 'logo-bear.png';
        pic.alt = '';
        a.appendChild(pic);
      }
      const span = document.createElement('span');
      span.textContent = itemLabel(item);
      a.appendChild(span);
      wrap.appendChild(a);
    });
    box.appendChild(wrap);
  }
}

function renderLinks() {
  const box = $('links');
  box.innerHTML = '';
  state.items.forEach((item) => {
    const url = itemUrl(item);
    const row = document.createElement('div');
    row.className = 'linkrow';

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = itemLabel(item) + ' → ' + url;

    const code = document.createElement('code');
    code.textContent = 'хештег: #' + String(item.hashtag || '').replace(/^#/, '');

    row.appendChild(a);
    row.appendChild(code);
    box.appendChild(row);
  });
}

function renderEditor() {
  $('items').value = itemsToText(state.items);
  $('mode').value = state.searchMode;
  $('iconmode').value = state.iconMode;
  $('type').value = state.widgetType;
  $('group').value = state.groupId ? String(state.groupId).replace('-', '') : ($('group').value || '');
}

function renderAll() {
  renderStatus();
  renderEditor();
  renderPreview();
  renderLinks();
}

async function loadFromStorage() {
  if (!bridgeUsable()) return;
  try {
    const res = await withTimeout(
      vkBridge.send('VKWebAppStorageGet', { keys: [storageKey()] }),
      10000,
      'VKWebAppStorageGet'
    );
    const list = (res && res.keys) || [];
    const found = list.find((k) => k && k.key === storageKey());
    if (found && found.value) {
      applyConfig(JSON.parse(found.value));
      log('Список загружен из хранилища ВК (' + state.items.length + ' пунктов).', 'ok');
    } else {
      log('В хранилище ВК пока пусто — показаны стандартные пункты.', 'muted');
    }
  } catch (error) {
    log('Не удалось прочитать хранилище: ' + errText(error), 'err');
  }
}

async function saveToStorage() {
  if (!bridgeUsable()) {
    log('Вне ВКонтакте сохранить в хранилище нельзя — откройте приложение внутри ВК.', 'err');
    return false;
  }
  try {
    await withTimeout(
      vkBridge.send('VKWebAppStorageSet', { key: storageKey(), value: serializeConfig() }),
      10000,
      'VKWebAppStorageSet'
    );
    log('Сохранено в хранилище ВК. Откройте приложение с любого устройства — список будет тот же.', 'ok');
    return true;
  } catch (error) {
    log('Не удалось сохранить: ' + errText(error), 'err');
    return false;
  }
}

function readEditor() {
  state.items = parseItems($('items').value);
  state.searchMode = $('mode').value;
}

async function onSave() {
  readEditor();
  const problems = validate();
  if (problems.length) {
    problems.forEach((p) => log(p, 'err'));
  } else {
    renderPreview();
    renderLinks();
  }
  await saveToStorage();
}

async function onApplyWidget() {
  readEditor();
  renderPreview();
  renderLinks();

  const problems = validate();
  if (problems.length) {
    problems.forEach((p) => log(p, 'err'));
    return;
  }

  if (!bridgeUsable()) {
    fatal('<b>Приложение открыто вне ВКонтакте.</b><br>Установить виджет можно только из ВК: откройте ссылку приложения внутри ВКонтакте.');
    return;
  }

  const raw = ($('group').value || state.groupId || '').trim().replace('-', '');
  if (!raw) {
    log('Укажите ID сообщества — виджет ставится в конкретное сообщество.', 'err');
    return;
  }
  state.groupId = raw;

  await saveToStorage();

  log('Показываю предпросмотр виджета…', 'muted');
  try {
    const res = await withTimeout(
      vkBridge.send('VKWebAppShowCommunityWidgetPreviewBox', {
        group_id: Number(raw),
        type: state.widgetType,
        code: buildWidgetCode(),
      }),
      60000,
      'VKWebAppShowCommunityWidgetPreviewBox'
    );
    if (res && res.result) {
      log('Предпросмотр открыт — подтвердите установку в окне ВК.', 'ok');
    } else {
      log('Предпросмотр не открылся: ' + JSON.stringify(res), 'err');
    }
  } catch (error) {
    log('Ошибка установки виджета: ' + errText(error), 'err');
    log('Проверьте, что приложение добавлено в сообщество и открыто внутри него.', 'muted');
  }
}

async function onAddToCommunity() {
  if (!bridgeUsable()) {
    log('Добавить в сообщество можно только внутри ВК.', 'err');
    return;
  }
  try {
    const data = await withTimeout(vkBridge.send('VKWebAppAddToCommunity'), 120000, 'VKWebAppAddToCommunity');
    if (data && data.group_id) {
      state.groupId = String(data.group_id);
      $('group').value = state.groupId.replace('-', '');
      renderStatus();
      log('Приложение добавлено в сообщество ' + state.groupId + '. Теперь нажмите «Обновить виджет в сообществе».', 'ok');
      await loadFromStorage();
      renderEditor();
    } else {
      log('Ответ без group_id: ' + JSON.stringify(data), 'err');
    }
  } catch (error) {
    log('Не удалось добавить: ' + errText(error), 'err');
  }
}

function onOpenContext() {
  const raw = ($('group').value || state.groupId || '').trim().replace('-', '');
  if (!state.appId) {
    log('ID приложения неизвестен. Откройте приложение по ссылке vk.com/app<ID>, тогда он подставится.', 'err');
    return;
  }
  if (!raw) {
    log('Сначала укажите ID сообщества.', 'err');
    return;
  }
  const url = 'https://vk.com/app' + state.appId + '_-' + raw;
  log('Ссылка для открытия в сообществе: ' + url, 'muted');
  window.open(url, '_blank');
}

function onReset() {
  state.title = CONFIG.title;
  state.iconMode = CONFIG.iconMode;
  state.icon = CONFIG.icon;
  state.columns = CONFIG.columns;
  state.widgetType = CONFIG.widgetType;
  state.searchMode = CONFIG.searchMode;
  state.items = CONFIG.items.map((i) => Object.assign({}, i));
  renderAll();
  log('Возвращены стандартные пункты. Нажмите «Сохранить», чтобы записать их в хранилище.', 'muted');
}

function copyLog() {
  const text = $('log').textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(
      () => log('Журнал скопирован.', 'ok'),
      () => log('Не удалось скопировать автоматически.', 'err')
    );
  } else {
    log('Копирование недоступно в этом браузере.', 'err');
  }
}

function showParams() {
  log(
    'Данные запуска: ' +
      JSON.stringify({
        appId: state.appId,
        groupId: state.groupId,
        role: state.role,
        platform: state.platform,
        bridge: typeof vkBridge !== 'undefined' ? 'загружен' : 'нет',
        search: location.search || '(пусто)',
        hash: location.hash || '(пусто)',
      }),
    'muted'
  );
}

/** Параметры запуска: сначала пробуем через VK Bridge, потом читаем из адреса. */
async function detectLaunchParams() {
  let params = null;
  if (bridgeUsable()) {
    try {
      params = await withTimeout(vkBridge.send('VKWebAppGetLaunchParams'), 10000, 'VKWebAppGetLaunchParams');
    } catch (error) {
      log('VKWebAppGetLaunchParams недоступен: ' + errText(error), 'muted');
    }
  }
  const url = new URLSearchParams(location.search);
  const pick = (key) => (params && params[key] != null ? params[key] : url.get(key));

  const groupId = pick('vk_group_id') || pick('group_id');
  state.groupId = groupId ? String(groupId).replace('-', '') : state.groupId;
  state.appId = pick('vk_app_id') || pick('app_id') || state.appId;
  state.role = pick('vk_viewer_group_role') || state.role;
  state.platform = pick('vk_platform') || state.platform;

  log(
    'Контекст: ' +
      (state.groupId ? 'сообщество ' + state.groupId : 'без сообщества') +
      (state.role ? ', роль ' + state.role : '') +
      (state.platform ? ', платформа ' + state.platform : ''),
    'muted'
  );

  if (state.groupId && state.role && state.role !== 'admin') {
    log('Внимание: вы не администратор этого сообщества — установить виджет не получится.', 'err');
  }
  if (!state.groupId) {
    log('Приложение открыто без контекста сообщества. Откройте его из сообщества (ссылка с суффиксом _-<ID>).', 'muted');
  }
  if (state.appId && state.groupId) {
    log('Ссылка для открытия прямо в сообществе: https://vk.com/app' + state.appId + '_-' + state.groupId, 'muted');
  }
}

/* ---------------------- страница «все посты по хештегу» ------------------ */

/** Хештег, переданный виджетом в ссылке вида vk.com/app…_-…#h=<код>&tag=…
 *  Приоритет — ASCII-код `h`: кириллицу в URL ВК перекодирует в «кракозябры». */
function getTagFromLaunch() {
  let raw = '';
  try {
    const sp = new URLSearchParams(location.search);
    raw = sp.get('hash') || '';
  } catch (error) {
    raw = '';
  }
  if (!raw && location.hash) raw = location.hash.replace(/^#/, '');
  if (!raw) return null;

  let hex = '';
  let literal = '';
  try {
    const inner = new URLSearchParams(raw);
    hex = inner.get('h') || '';
    literal = inner.get('tag') || '';
  } catch (error) {
    hex = '';
    literal = '';
  }
  if (!hex && !literal) {
    if (/^h=/.test(raw)) hex = raw.slice(2);
    else if (/^tag=/.test(raw)) literal = raw.slice(4);
  }

  const fromHex = hexToTag(hex);
  if (fromHex) return fromHex;

  const fixed = repairTag(literal).replace(/^#/, '').trim();
  return fixed || null;
}

function ownerId() {
  const gid = String(state.groupId || CONFIG.groupId || '').replace('-', '');
  return gid ? -Math.abs(Number(gid)) : null;
}

let userToken = null;

/** Ключ доступа пользователя — нужен для вызовов API через VK Bridge. */
async function getUserToken() {
  if (userToken) return userToken;
  const res = await withTimeout(
    vkBridge.send('VKWebAppGetAuthToken', {
      app_id: Number(state.appId || CONFIG.appId),
      scope: '',
    }),
    25000,
    'VKWebAppGetAuthToken'
  );
  userToken = (res && res.access_token) || null;
  return userToken;
}

async function callApi(method, params) {
  const token = await getUserToken();
  if (!token) throw new Error('ВК не выдал ключ доступа');
  const res = await withTimeout(
    vkBridge.send('VKWebAppCallAPIMethod', {
      method: method,
      params: Object.assign({ v: '5.131', access_token: token }, params),
    }),
    25000,
    method
  );
  if (res && res.error) throw new Error(errText(res.error));
  return res && res.response;
}

/** Все посты сообщества с хештегом. Сначала wall.search, затем wall.get + фильтр. */
async function fetchPosts(tag) {
  const owner = ownerId();
  const query = '#' + tag;

  try {
    const res = await callApi('wall.search', {
      owner_id: owner,
      query: query,
      owners_only: 1,
      count: 100,
    });
    const items = (res && res.items) || [];
    if (items.length) return items;
  } catch (error) {
    logPosts('wall.search: ' + errText(error) + ' — пробую запасной способ', 'muted');
  }

  const res = await callApi('wall.get', { owner_id: owner, count: 100, filter: 'owner' });
  const items = (res && res.items) || [];
  const needle = query.toLowerCase();
  return items.filter((p) => String(p.text || '').toLowerCase().indexOf(needle) >= 0);
}

function formatDate(ts) {
  try {
    return new Date(Number(ts) * 1000).toLocaleString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch (error) {
    return '';
  }
}

function postPhoto(post) {
  const att = (post.attachments || []).find((a) => a && a.type === 'photo' && a.photo);
  if (!att) return null;
  const sizes = att.photo.sizes || [];
  if (!sizes.length) return null;
  return sizes[sizes.length - 1].url || null;
}

function logPosts(message, kind) {
  const box = $('posts-log');
  if (!box) return;
  const line = document.createElement('div');
  if (kind) line.className = kind;
  line.textContent = message;
  box.appendChild(line);
}

function renderPosts(items) {
  const box = $('posts-list');
  box.innerHTML = '';
  if (!items.length) {
    box.innerHTML =
      '<div class="hint">Записей с этим хештегом не нашлось. ' +
      'Проверьте, что хештег стоит в тексте самой записи (не в подписи к фото и не в комментарии).</div>';
    return;
  }
  items
    .slice()
    .sort((a, b) => Number(b.date) - Number(a.date))
    .forEach((post) => {
      const div = document.createElement('div');
      div.className = 'post';

      const date = document.createElement('div');
      date.className = 'post-date';
      date.textContent = formatDate(post.date);
      div.appendChild(date);

      if (post.text) {
        const text = document.createElement('div');
        text.className = 'post-text';
        text.textContent = post.text;
        div.appendChild(text);
      }

      const pic = postPhoto(post);
      if (pic) {
        const img = document.createElement('img');
        img.className = 'post-photo';
        img.src = pic;
        img.loading = 'lazy';
        div.appendChild(img);
      }

      const link = document.createElement('a');
      link.className = 'post-link';
      link.href = 'https://vk.com/wall' + ownerId() + '_' + post.id;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Открыть запись';
      div.appendChild(link);

      box.appendChild(div);
    });
}

function renderCategoryButtons() {
  const box = $('posts-list');
  box.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'cats';
  state.items.forEach((item) => {
    const btn = document.createElement('button');
    btn.className = 'secondary';
    btn.textContent = item.text;
    btn.addEventListener('click', () => {
      $('posts-title').textContent = '#' + String(item.hashtag || '').replace(/^#/, '');
      loadPosts(String(item.hashtag || '').replace(/^#/, ''));
    });
    wrap.appendChild(btn);
  });
  box.appendChild(wrap);
}

async function loadPosts(tag) {
  const box = $('posts-list');
  state.tag = tag || null;
  box.innerHTML = '<div class="hint">Загружаю записи…</div>';
  $('posts-log').textContent = '';
  try {
    const items = await fetchPosts(tag);
    renderPosts(items);
    $('posts-sub').textContent =
      'Хештег #' + tag + ' · найдено записей: ' + items.length + ' · показаны все, без фильтра по датам.';
  } catch (error) {
    box.innerHTML = '';
    logPosts('Не удалось загрузить: ' + errText(error), 'err');
    $('posts-sub').textContent = 'Можно открыть обычный поиск ВК кнопкой ниже.';
  }
}

function showPostsView(tag) {
  $('posts-view').hidden = false;
  $('admin-view').hidden = true;
  $('page-title').textContent = 'Умка · публикации';
  state.tag = tag || null;
  if (tag) {
    $('posts-title').textContent = '#' + tag;
    $('posts-sub').textContent = 'Все записи сообщества с этим хештегом.';
    loadPosts(tag);
  } else {
    $('posts-title').textContent = 'Разделы';
    $('posts-sub').textContent = 'Выберите раздел — покажу все записи с его хештегом.';
    renderCategoryButtons();
  }
  $('btn-admin').hidden = !(state.role === 'admin' || state.role === 'editor' || state.role === 'moder' || !state.role);
}

function showAdminView() {
  $('posts-view').hidden = true;
  $('admin-view').hidden = false;
  $('page-title').textContent = 'Меню сообщества «Умка»';
  state.tag = null;
}

function openVkSearch() {
  const tag = state.tag || (state.items[0] && String(state.items[0].hashtag || '').replace(/^#/, '')) || '';
  const gid = String(state.groupId || CONFIG.groupId || '').replace('-', '');
  const url = gid
    ? 'https://vk.com/wall-' + gid + '?q=%23' + encodeURIComponent(tag)
    : 'https://vk.com/feed?section=search&q=%23' + encodeURIComponent(tag);
  window.open(url, '_blank');
}

async function init() {
  renderAll(); // интерфейс показываем сразу, не дожидаясь ответов ВК

  if (typeof vkBridge === 'undefined') {
    fatal(
      '<b>Не загрузился файл vk-bridge.min.js.</b><br>' +
        'Проверьте, что он лежит в репозитории рядом с index.html и app.js. ' +
        'Пока его нет, кнопки работать не будут, но предпросмотр меню ниже доступен.'
    );
    log('vk-bridge.min.js не загружен.', 'err');
    return;
  }

  const canDetect = typeof vkBridge.isEmbedded === 'function' && vkBridge.isEmbedded();
  embedded = canDetect || (window.self !== window.top) || /vk_(app_id|group_id|platform|viewer)/.test(location.search);

  try {
    await withTimeout(vkBridge.send('VKWebAppInit'), embedded ? 8000 : 3000, 'VKWebAppInit');
    state.bridgeOk = true;
    embedded = true;
    log('VK Bridge инициализирован. Версия приложения: ' + APP_VERSION, 'ok');
  } catch (error) {
    log('VKWebAppInit не ответил: ' + errText(error), 'err');
    if (!embedded) {
      fatal(
        '<b>Страница открыта вне ВКонтакте.</b><br>' +
          'Здесь можно посмотреть предпросмотр, сверить ссылки и править список. ' +
          'Сохранять в ВК и ставить виджет нужно внутри ВК — по ссылке ' +
          '<b>vk.com/app54809979_-212278594</b>.'
      );
      log('Вне ВК: кнопки установки неактивны, это нормально.', 'muted');
      return;
    }
  }

  await detectLaunchParams();
  renderAll();
  await loadFromStorage();
  renderAll();

  // Определяем, что показать: страницу постов по хештегу или настройки меню.
  const tag = getTagFromLaunch();
  const isAdmin = state.role === 'admin' || state.role === 'editor' || state.role === 'moder';
  if (tag) {
    showPostsView(tag);
  } else if (isAdmin || !state.role) {
    showAdminView();
  } else {
    showPostsView(null);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $('btn-save').addEventListener('click', onSave);
  $('btn-apply').addEventListener('click', onApplyWidget);
  $('btn-reset').addEventListener('click', onReset);
  $('btn-add').addEventListener('click', onAddToCommunity);
  $('btn-context').addEventListener('click', onOpenContext);
  $('btn-log').addEventListener('click', copyLog);
  $('btn-params').addEventListener('click', showParams);
  $('mode').addEventListener('change', () => {
    state.searchMode = $('mode').value;
    renderPreview();
    renderLinks();
  });
  $('iconmode').addEventListener('change', () => {
    state.iconMode = $('iconmode').value;
    renderPreview();
    renderLinks();
  });
  $('type').addEventListener('change', () => {
    state.widgetType = $('type').value;
    renderPreview();
  });
  if ($('btn-refresh')) {
    $('btn-refresh').addEventListener('click', () => {
      if (state.tag) loadPosts(state.tag);
      else showPostsView(null);
    });
  }
  if ($('btn-vk-search')) $('btn-vk-search').addEventListener('click', openVkSearch);
  if ($('btn-admin')) $('btn-admin').addEventListener('click', showAdminView);
  if ($('btn-preview-user')) {
    $('btn-preview-user').addEventListener('click', () => showPostsView(state.tag || null));
  }
  init();
});
