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
  //  'emoji' — эмодзи перед названием. По умолчанию нейтральный синий кружок.
  iconMode: 'emoji',
  icon: '🔵',
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
  // Быстрые ссылки сверху виджета (как «меню» сообщества). Показывать/скрыть.
  quickLinksOn: true,
  quickLinks: [
    {
      key: 'enroll',
      text: 'Запись в кружок',
      emoji: '🧒',
      url: 'https://vk.ru/app8181405#module=education&step=ChoosingKid&groupId=public212278594',
      descr: 'Запись ребёнка в детский сад через Госуслуги',
      image: 'https://sun9-71.userapi.com/s/v1/s2/B32E_2kB_CMqGpMNTZnSI6dvpc2gTNi8pWOC_BEoXRVf6x1Gxc8wW7yu_dj2axAJuIHUZy49qUDfIiW4Y1fs-KvRDITF.jpg',
    },
    {
      key: 'opinion',
      text: 'Высказать мнение',
      emoji: '💬',
      url: 'https://pos.gosuslugi.ru/og/org-activities?mun_code=49027097&utm_source=vk2&utm_medium=32&utm_campaign=1204200000366',
      external: true,
      descr: 'Оцените работу детского сада на портале «Решаем вместе»',
      image: 'https://sun9-7.userapi.com/s/v1/s2/MykcTYQErEgyum6rYXps7phILQ2mAbgLwcJy8b9gsuefmJzkvQxlj6TyHw9yKGM5Q2HGGKk5Adq-IYvi4EiaqlYRiv8q.jpg',
    },
    {
      key: 'problem',
      text: 'Сообщить о проблеме',
      emoji: '⚠️',
      url: 'https://pos.gosuslugi.ru/form/?opaId=21227859&utm_source=vk&utm_medium=32&utm_campaign=1204200000366',
      external: true,
      descr: 'Сообщить о проблеме через портал «Решаем вместе»',
      image: 'https://sun9-8.userapi.com/s/v1/s2/hUOyU22fyRril9MRk5XoMiI228pCH4ycjv5Z26iGqJTzg-bo2GydXU2ZyDKdJVKx8ARQRjLdKc2hkMVLcJpHARrZyHw8.jpg',
    },
    {
      key: 'cyber',
      text: 'Кибермошенничество',
      emoji: '🛡️',
      url: 'https://vk.ru/wall-212278594_7332',
      descr: 'Как защититься от мошенников — памятка',
      image: 'https://sun9-40.userapi.com/s/v1/ig2/Wgrz20XbehENhDZhW4O7VnvrIKnHD0z96WW7l_3AdZ4tgyht--EkgXkkNagf8bEOWMezCtqPyl9StSsSI4JRswYj.jpg?as=160x160&quality=95',
    },
  ],
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
const STORAGE_PREFIX = 'umka_menu_v2_';
/** Версия файла — видна в приложении и в журнале. Меняйте при каждой правке. */
const APP_VERSION = 'v1.20 (18.10.2026)';

/** Варианты иконки пунктов: значение списка → (режим, эмодзи). */
const ICON_OPTIONS = {
  dot: { iconMode: 'emoji', icon: '🔵' },
  diamond: { iconMode: 'emoji', icon: '🔹' },
  circle: { iconMode: 'emoji', icon: '⚪' },
  bear: { iconMode: 'emoji', icon: '🐻' },
  logo: { iconMode: 'logo', icon: '' },
  none: { iconMode: 'emoji', icon: '' },
};

/** Какое значение списка соответствует текущей настройке. */
function currentIconOption() {
  if (state.iconMode === 'logo') return 'logo';
  const keys = Object.keys(ICON_OPTIONS);
  for (let i = 0; i < keys.length; i++) {
    const opt = ICON_OPTIONS[keys[i]];
    if (opt.iconMode === state.iconMode && opt.icon === state.icon) return keys[i];
  }
  return state.icon ? 'dot' : 'none';
}

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
  quickLinksOn: CONFIG.quickLinksOn,
  items: CONFIG.items.map((i) => Object.assign({}, i)),
  tag: null,
  go: null,
  groupId: CONFIG.groupId ? String(CONFIG.groupId) : null,
  role: null,
  platform: null,
  appId: CONFIG.appId ? String(CONFIG.appId) : null,
  bridgeOk: false,
};

/** Ссылка быстрого пункта для виджета.
 *  Внешние сайты ВК в виджете запрещены, поэтому они идут через страницу
 *  приложения: vk.com/app<ID>_-<GROUP>#go=<ключ>. */
function quickLinkUrl(q) {
  if (!q.external) return q.url;
  const appId = state.appId || CONFIG.appId;
  const gid = String(state.groupId || CONFIG.groupId || '').replace('-', '');
  return 'https://vk.com/app' + appId + (gid ? '_-' + gid : '') + '#go=' + encodeURIComponent(q.key);
}

function quickLinks() {
  return (CONFIG.quickLinks || []).filter((q) => q && q.text);
}

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

  // Быстрые ссылки сверху — только таблицей (в плитках лимит 10 на всё).
  if (state.quickLinksOn && state.widgetType !== 'list' && state.widgetType !== 'compact_list') {
    const columns = 2;
    const body = [];

    // 1. Быстрые ссылки — первые ряды
    const quick = quickLinks();
    for (let i = 0; i < quick.length; i += columns) {
      const row = [];
      for (let j = 0; j < columns; j++) {
        const q = quick[i + j];
        row.push(q ? { text: q.emoji + ' ' + q.text, url: quickLinkUrl(q) } : { text: '\u00A0' });
      }
      body.push(row);
    }

    // 2. Пустой ряд-разделитель, чтобы меню визуально отделялось от разделов
    if (quick.length) {
      body.push([{ text: '\u00A0' }, { text: '\u00A0' }]);
    }

    // 3. Разделы с хештегами
    const rest = [];
    items.forEach((item) => {
      rest.push({ text: itemLabel(item), url: itemUrl(item) });
    });
    for (let i = 0; i < rest.length && body.length < MAX_TABLE_ROWS; i += columns) {
      body.push(rest.slice(i, i + columns));
    }

    widget.body = body;
    return 'return ' + JSON.stringify(widget) + ';';
  }

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
  if (state.quickLinksOn) {
    quickLinks().forEach((q) => {
      const url = quickLinkUrl(q);
      if (!/^https:\/\/(vk\.com|vk\.ru|vk\.me)\//.test(url)) {
        problems.push('Ссылка «' + q.text + '» должна быть внутренней ВК (внешние сайты — через страницу приложения).');
      }
      if (url.length > 200) {
        problems.push('Ссылка «' + q.text + '» длиннее 200 символов (' + url.length + ').');
      }
    });
  }
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
    quickLinksOn: state.quickLinksOn,
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
  if (typeof data.quickLinksOn === 'boolean') state.quickLinksOn = data.quickLinksOn;
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

/** Короткий и понятный текст ошибки: у VK Bridge ошибка лежит внутри error_data. */
function errText(error) {
  if (!error) return 'неизвестная ошибка';
  if (typeof error === 'string') return error;
  const d = error.error_data || error;
  if (d && (d.error_code !== undefined || d.error_reason)) {
    return 'код ' + d.error_code + (d.error_reason ? ': ' + d.error_reason : '');
  }
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

  // Быстрые ссылки — как в виджете, первыми
  if (state.quickLinksOn) {
    const quick = document.createElement('div');
    quick.className = 'preview-quick';
    quickLinks().forEach((q) => {
      const row = document.createElement('div');
      row.className = 'preview-quick-row';
      row.textContent = q.emoji + ' ' + q.text;
      quick.appendChild(row);
    });
    box.appendChild(quick);
  }

  if (state.widgetType === 'tiles' && !state.quickLinksOn) {
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
  $('iconmode').value = currentIconOption();
  $('type').value = state.widgetType;
  if ($('quicklinks')) $('quicklinks').value = state.quickLinksOn ? 'on' : 'off';
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
  state.quickLinksOn = CONFIG.quickLinksOn;
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

/** Разбирает строку после «#» (например «h=0414…») и достаёт хештег.
 *  Приоритет — ASCII-код `h`: кириллицу в URL ВК перекодирует в «кракозябры». */
function tagFromFragment(raw) {
  const s = String(raw || '').replace(/^#/, '');
  if (!s) return null;

  let hex = '';
  let literal = '';
  try {
    const inner = new URLSearchParams(s);
    hex = inner.get('h') || '';
    literal = inner.get('tag') || '';
  } catch (error) {
    hex = '';
    literal = '';
  }
  if (!hex && !literal) {
    if (/^h=/.test(s)) hex = s.slice(2);
    else if (/^tag=/.test(s)) literal = s.slice(4);
  }

  const fromHex = hexToTag(hex);
  if (fromHex) return fromHex;

  const fixed = repairTag(literal).replace(/^#/, '').trim();
  return fixed || null;
}

/** Хештег при запуске приложения: либо из параметра hash, либо из адреса. */
function getTagFromLaunch() {
  let raw = '';
  try {
    raw = new URLSearchParams(location.search).get('hash') || '';
  } catch (error) {
    raw = '';
  }
  if (!raw && location.hash) raw = location.hash;
  return tagFromFragment(raw);
}

/** Слежение за сменой хештега.
 *
 *  Как это работает в ВК: новый хештег платформа присылает СОБЫТИЕМ
 *  (VKWebAppChangeFragment), а адрес страницы при этом часто остаётся старым.
 *  Поэтому источник истины — события; проверки адреса включаются только если
 *  событий не было вообще, иначе старый адрес откатывал бы список назад. */
let launchFragment = '';
let liveFragment = '';
let eventsSeen = false;

/** Что лежало в ссылке на момент запуска (это значение не обновляется). */
function readLaunchFragment() {
  const fromHash = location.hash ? location.hash.replace(/^#/, '') : '';
  if (fromHash) return fromHash;
  try {
    return new URLSearchParams(location.search).get('hash') || '';
  } catch (error) {
    return '';
  }
}

/** Ключ быстрой ссылки из фрагмента вида go=opinion. */
function goFromFragment(raw) {
  const s = String(raw || '').replace(/^#/, '');
  if (!s) return null;
  try {
    const v = new URLSearchParams(s).get('go');
    return v ? String(v) : null;
  } catch (error) {
    return null;
  }
}

/** Новый фрагмент из надёжного источника. */
function setLiveFragment(raw, source) {
  if (!raw || raw === liveFragment) return;

  const go = goFromFragment(raw);
  if (go) {
    liveFragment = raw;
    log('Ссылка изменилась (' + source + '): сервис ' + go, 'muted');
    showService(go);
    return;
  }

  const tag = tagFromFragment(raw);

  // Тот же хештег — не дёргаем список (иначе он мигает)
  if (tag && tag === state.tag && !$('posts-view').hidden) {
    liveFragment = raw;
    return;
  }

  liveFragment = raw;
  log('Ссылка изменилась (' + source + '): ' + (tag ? '#' + tag : '(пусто)'), 'muted');
  if (tag) showPostsView(tag);
  else showPostsView(null);
}

/** Проверка адреса. Работает только пока ВК не присылал событий:
 *  после события адрес считается устаревшим. */
function checkUrlFragment(source) {
  if (eventsSeen) return;
  const raw = location.hash ? location.hash.replace(/^#/, '') : '';
  if (!raw || raw === launchFragment) return;
  setLiveFragment(raw, source);
}

function startTagWatch() {
  window.addEventListener('hashchange', () => checkUrlFragment('адрес'));

  setInterval(() => {
    if ($('posts-view').hidden) return;
    checkUrlFragment('адрес');
  }, 1500);

  // ВК может обновить только параметры запуска — спрашиваем их, пока нет событий
  setInterval(async () => {
    if (eventsSeen || $('posts-view').hidden || !bridgeUsable()) return;
    try {
      const params = await vkBridge.send('VKWebAppGetLaunchParams');
      const raw = (params && params.hash) || '';
      if (raw && raw !== launchFragment) setLiveFragment(raw, 'параметры запуска');
    } catch (error) {
      /* молча */
    }
  }, 5000);

  // Возврат в приложение: смотрим адрес несколько раз (если события не приходят)
  const recheck = () => {
    [250, 1000, 2500].forEach((delay) => {
      setTimeout(() => checkUrlFragment('возврат в приложение'), delay);
    });
  };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) recheck();
  });
  window.addEventListener('focus', recheck);
  window.addEventListener('pageshow', recheck);
}

/** Перечитать ссылку и показать то, что в ней. Используется кнопкой «Обновить». */
function refreshFromLink() {
  const fromUrl = location.hash ? location.hash.replace(/^#/, '') : '';
  const raw = liveFragment || (!eventsSeen ? fromUrl : '');
  const go = goFromFragment(raw);
  if (go && quickLinks().some((q) => q.key === go)) {
    showService(go);
    return;
  }
  const tag = tagFromFragment(raw) || getTagFromLaunch() || state.tag;
  if (tag) showPostsView(tag);
  else showPostsView(null);
}

function watchFragmentChanges() {
  if (typeof vkBridge === 'undefined' || typeof vkBridge.subscribe !== 'function') return;

  vkBridge.subscribe((event) => {
    const detail = event && event.detail;
    if (!detail || !detail.type) return;

    // все события ВК пишем в журнал — это помогает разбираться с проблемами
    log('событие ВК: ' + detail.type, 'muted');

    if (detail.type === 'VKWebAppChangeFragment' || detail.type === 'VKWebAppLocationChanged') {
      eventsSeen = true; // адресу страницы больше не доверяем
      const loc = (detail.data && detail.data.location) || '';
      setLiveFragment(loc, 'событие ВК');
      return;
    }

    if (detail.type === 'VKWebAppViewRestore') {
      const tag = tagFromFragment(liveFragment) || getTagFromLaunch();
      if (tag) showPostsView(tag);
    }
  });
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

/** Вызов метода API. Платформа требует ключ доступа, поэтому берём его сразу
 *  (со пустым scope — без лишнего запроса прав). */
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

/** Текст записи вместе с подписями к фото — по нему ищем хештег. */
function postText(post) {
  let s = String(post.text || '');
  (post.attachments || []).forEach((a) => {
    if (a && a.type === 'photo' && a.photo && a.photo.text) s += '\n' + a.photo.text;
  });
  return s.toLowerCase();
}

/** Есть ли в записи нужный хештег (регистр не важен). */
function matchesTag(post, tag) {
  const needle = ('#' + String(tag || '')).toLowerCase();
  if (needle === '#') return false;
  return postText(post).indexOf(needle) >= 0;
}

/** Все посты сообщества с хештегом.
 *  Фильтр по хештегу применяется ВСЕГДА и на нашей стороне, потому что
 *  мобильный клиент ВК иногда возвращает из wall.search вообще все записи.
 *  Возвращает список, источник и подробности для журнала. */
async function fetchPosts(tag) {
  const owner = ownerId();
  const query = '#' + tag;
  const info = [];   // подробности для журнала
  const failed = []; // методы, которые не сработали

  async function attempt(method, params) {
    try {
      const res = await callApi(method, params);
      const all = (res && res.items) || [];
      const items = all.filter((p) => matchesTag(p, tag));
      info.push(method + ': получено записей ' + all.length + ', из них с хештегом ' + items.length);
      return items;
    } catch (error) {
      info.push(method + ': не удалось — ' + errText(error));
      failed.push(method);
      return [];
    }
  }

  let items = await attempt('wall.search', {
    owner_id: owner, query: query, owners_only: 1, count: 100,
  });
  if (items.length) return { items: items, method: 'wall.search', info: info, failed: failed };

  items = await attempt('wall.get', { owner_id: owner, count: 100, filter: 'owner' });
  if (items.length) return { items: items, method: 'wall.get', info: info, failed: failed };

  items = await attempt('newsfeed.search', { q: query, count: 100 });
  if (items.length) return { items: items, method: 'newsfeed.search', info: info, failed: failed };

  return { items: [], method: '—', info: info, failed: failed };
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
  const time = new Date().toLocaleTimeString('ru-RU');
  line.textContent = '[' + time + '] ' + message;
  box.appendChild(line);
}

function renderPosts(items, tag) {
  const box = $('posts-list');
  box.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'hint';
    empty.textContent = tag
      ? 'Записей с хештегом #' + tag + ' не нашлось.'
      : 'Записей не нашлось.';
    box.appendChild(empty);
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

        // как в ленте: длинный текст показываем сокращённо
        if (post.text.length > 240) {
          const more = document.createElement('button');
          more.className = 'post-more';
          more.textContent = 'Показать полностью';
          more.addEventListener('click', () => {
            const opened = text.classList.toggle('open');
            more.textContent = opened ? 'Свернуть' : 'Показать полностью';
          });
          div.appendChild(more);
        }
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
      link.href = 'https://vk.com/wall' + (post.owner_id != null ? post.owner_id : ownerId()) + '_' + post.id;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Открыть запись';
      div.appendChild(link);

      box.appendChild(div);
    });
}

/** Открыть внешний сайт напрямую (без away.php — он показывает страницу ВК
 *  в отдельном окне). VK откроет ссылку в своём встроенном браузере. */
function openExternal(url) {
  try {
    window.open(url, '_blank');
    return true;
  } catch (error) {
    return false;
  }
}

/** Открыть быстрый пункт: внутренние — через VK Bridge (в основном окне ВК),
 *  внешние — напрямую на сайт. */
function openQuick(q) {
  if (!q) return;

  if (!q.external && bridgeUsable()) {
    // Запись в кружок — другое мини-приложение ВК
    if (q.key === 'enroll') {
      vkBridge
        .send('VKWebAppOpenApp', {
          app_id: 8181405,
          location: 'module=education&step=ChoosingKid&groupId=public212278594',
        })
        .catch(() => window.open(q.url, '_blank'));
      return;
    }
    // Кибермошенничество — запись сообщества
    if (q.key === 'cyber') {
      vkBridge
        .send('VKWebAppOpenWallPost', { owner_id: -212278594, post_id: 7332 })
        .catch(() => window.open(q.url, '_blank'));
      return;
    }
  }

  window.open(q.url, '_blank');
}

function renderCategoryButtons() {
  const box = $('posts-list');
  box.innerHTML = '';

  // Сверху — быстрые ссылки (как «меню» сообщества)
  if (state.quickLinksOn && quickLinks().length) {
    const head = document.createElement('div');
    head.className = 'section-head';
    head.textContent = 'Полезное';
    box.appendChild(head);

    const quick = document.createElement('div');
    quick.className = 'quick';
    quickLinks().forEach((q) => {
      const btn = document.createElement('button');
      btn.className = 'quick-btn';
      if (q.image) {
        const img = document.createElement('img');
        img.className = 'quick-img';
        img.src = q.image;
        img.alt = '';
        btn.appendChild(img);
      } else {
        const emo = document.createElement('span');
        emo.className = 'quick-emoji';
        emo.textContent = q.emoji || '';
        btn.appendChild(emo);
      }
      const cap = document.createElement('span');
      cap.className = 'quick-cap';
      cap.textContent = q.text;
      btn.appendChild(cap);
      btn.addEventListener('click', () => {
        openQuick(q);
      });
      quick.appendChild(btn);
    });
    const block = document.createElement('div');
    block.className = 'quick-block';
    block.appendChild(quick);
    box.appendChild(block);
  }

  const head2 = document.createElement('div');
  head2.className = 'section-head';
  head2.textContent = 'Разделы';
  box.appendChild(head2);

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

/** Страница быстрой ссылки: картинка, описание и кнопка перехода. */
function showService(key) {
  const q = quickLinks().filter((x) => x.key === key)[0];
  if (!q) {
    showPostsView(null);
    return;
  }
  $('posts-view').hidden = false;
  $('admin-view').hidden = true;
  finishLoading();
  state.tag = null;
  state.go = key;
  $('posts-title').textContent = q.text;
  $('posts-sub').textContent = '';

  const box = $('posts-list');
  box.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'service';

  if (q.image) {
    const img = document.createElement('img');
    img.className = 'service-img';
    img.src = q.image;
    img.alt = '';
    card.appendChild(img);
  }

  const t = document.createElement('div');
  t.className = 'service-title';
  t.textContent = q.text;
  card.appendChild(t);

  if (q.descr) {
    const d = document.createElement('div');
    d.className = 'service-descr';
    d.textContent = q.descr;
    card.appendChild(d);
  }

  const link = document.createElement('a');
  link.className = 'service-btn';
  link.href = q.url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = q.external ? 'Открыть на Госуслугах' : 'Перейти';
  card.appendChild(link);

  const back = document.createElement('button');
  back.className = 'secondary';
  back.textContent = '← Все разделы';
  back.addEventListener('click', () => {
    state.go = null;
    showPostsView(null);
  });
  card.appendChild(back);

  box.appendChild(card);
  applyChromeVisibility();
}

/** Счётчик запросов: чтобы медленный старый ответ не затёр новый список. */
let loadSeq = 0;

async function loadPosts(tag) {
  const box = $('posts-list');
  const logBox = $('posts-log');
  state.tag = tag || null;
  logBox.textContent = '';
  logBox.hidden = true;

  if (!tag) {
    renderCategoryButtons();
    return;
  }

  box.innerHTML = '<div class="hint">Загружаю записи…</div>';
  const requestId = ++loadSeq;
  try {
    const result = await fetchPosts(tag);
    // Пока грузилось, могли открыть другой хештег — устаревший ответ не показываем
    if (requestId !== loadSeq) {
      logPosts('Устаревший ответ для #' + tag + ' пропущен', 'muted');
      return;
    }
    renderPosts(result.items, tag);

    if (result.items.length) {
      $('posts-sub').textContent =
        'Всего записей: ' + result.items.length + ' · показаны все, без фильтра по датам';
    } else {
      $('posts-sub').textContent = '';
      if (result.failed.length === 3) {
        // ни один способ не сработал — говорим понятно, без технических деталей
        box.innerHTML = '';
        const d = document.createElement('div');
        d.className = 'hint';
        d.textContent = 'ВК не отдал записи. Нажмите «Обновить» или «Поиск ВК».';
        box.appendChild(d);
      }
    }

    // Подробности — только в журнал, который открывается кнопкой «Подробнее».
    logPosts('Хештег из ссылки: #' + tag, 'muted');
    logPosts('Контекст: ' + (state.groupId || '—') + ', роль: ' + (state.role || '—') + ', платформа: ' + (state.platform || '—'), 'muted');
    result.info.forEach((line) => logPosts(line, 'muted'));
    if (result.items.length) logPosts('Источник данных: ' + result.method, 'ok');
  } catch (error) {
    box.innerHTML = '';
    logPosts('Не удалось загрузить: ' + errText(error), 'err');
    $('posts-sub').textContent = '';
    logBox.hidden = false;
  }
}

/** Прячем заглушку «Загружаю…» — вызывается, когда экран уже выбран. */
function finishLoading() {
  if ($('loading-card')) $('loading-card').hidden = true;
}

function showPostsView(tag) {
  $('posts-view').hidden = false;
  $('admin-view').hidden = true;
  finishLoading();
  $('page-title').textContent = 'Умка · публикации';
  state.tag = tag || null;
  state.go = null;
  if (tag) {
    $('posts-title').textContent = '#' + tag;
    $('posts-sub').textContent = 'Все записи сообщества с этим хештегом.';
    loadPosts(tag);
  } else {
    $('posts-title').textContent = 'Разделы';
    $('posts-sub').textContent = 'Выберите раздел — покажу все записи с его хештегом.';
    renderCategoryButtons();
  }
  $('btn-admin').hidden = !isAdminUser();
  applyChromeVisibility();
}

/** Обычным подписчикам верхние блоки не нужны — оставляем только список. */
function applyChromeVisibility() {
  const admin = isAdminUser();
  const inPostsView = !$('posts-view').hidden;
  if ($('top-card')) $('top-card').hidden = inPostsView && !admin;
  if ($('posts-head-card')) $('posts-head-card').hidden = inPostsView && !admin;
}

function showAdminView() {
  $('posts-view').hidden = true;
  $('admin-view').hidden = false;
  finishLoading();
  $('page-title').textContent = 'Меню сообщества «Умка»';
  state.tag = null;
  if ($('top-card')) $('top-card').hidden = false;
  if ($('posts-head-card')) $('posts-head-card').hidden = false;
}

/** Администратор/редактор сообщества? Если роль не определена — считаем, что да
 *  (иначе админ без контекста сообщества не увидит настроек). */
function isAdminUser() {
  if (!state.role) return true;
  return state.role === 'admin' || state.role === 'editor' || state.role === 'moder';
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
    showAdminView();
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
      showAdminView();
      return;
    }
  }

  await detectLaunchParams();
  renderAll();
  await loadFromStorage();
  renderAll();

  // Определяем, что показать: сервис, посты по хештегу или настройки меню.
  launchFragment = readLaunchFragment();
  liveFragment = launchFragment;
  const go = goFromFragment(launchFragment) || goFromFragment(location.hash);
  const tag = getTagFromLaunch();
  const isAdmin = isAdminUser();
  if (go && quickLinks().some((q) => q.key === go)) {
    showService(go);
  } else if (tag) {
    showPostsView(tag);
  } else if (isAdmin) {
    showAdminView();
  } else {
    showPostsView(null);
  }
  applyChromeVisibility();
  watchFragmentChanges();
  startTagWatch();
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
    const opt = ICON_OPTIONS[$('iconmode').value] || ICON_OPTIONS.dot;
    state.iconMode = opt.iconMode;
    state.icon = opt.icon;
    renderPreview();
    renderLinks();
  });
  $('type').addEventListener('change', () => {
    state.widgetType = $('type').value;
    renderPreview();
  });
  if ($('quicklinks')) {
    $('quicklinks').addEventListener('change', () => {
      state.quickLinksOn = $('quicklinks').value === 'on';
      renderPreview();
    });
  }
  if ($('btn-refresh')) {
    $('btn-refresh').addEventListener('click', refreshFromLink);
  }
  if ($('btn-vk-search')) $('btn-vk-search').addEventListener('click', openVkSearch);
  if ($('btn-details')) {
    $('btn-details').addEventListener('click', () => {
      const box = $('posts-log');
      box.hidden = !box.hidden;
    });
  }
  if ($('btn-admin')) $('btn-admin').addEventListener('click', showAdminView);
  if ($('btn-preview-user')) {
    $('btn-preview-user').addEventListener('click', () => showPostsView(state.tag || null));
  }
  init();
});
