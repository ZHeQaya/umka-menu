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
  icon: '🐻',              // иконка перед пунктами: 🐻 или 🐻❄️
  community: 'ymka32020',  // короткое имя сообщества
  appId: 54809979,         // ID мини-приложения (короткий адрес vk.com/app54809979)
  groupId: 212278594,      // ID сообщества Умка (vk.com/club212278594)
  columns: 2,              // колонок в таблице-виджете (2 или 3, максимум 6)
  widgetType: 'table',     // 'table' (до 6×11) или 'list' (до 6 пунктов)
  searchMode: 'community', // 'community' — поиск в сообществе, 'hashtag' — общий поиск ВК
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

/* ------------------------------------------------------------------ */
/* Логика меню — от здесь и до разделителя ниже нет обращений к DOM.   */
/* ------------------------------------------------------------------ */

/** Состояние: копия CONFIG, которую правит пользователь. */
const state = {
  title: CONFIG.title,
  icon: CONFIG.icon,
  columns: CONFIG.columns,
  widgetType: CONFIG.widgetType,
  searchMode: CONFIG.searchMode,
  items: CONFIG.items.map((i) => Object.assign({}, i)),
  groupId: CONFIG.groupId ? String(CONFIG.groupId) : null,
  role: null,
  platform: null,
  appId: CONFIG.appId ? String(CONFIG.appId) : null,
  bridgeOk: false,
};

/** Подпись пункта: общая иконка + текст. */
function itemLabel(item) {
  return (state.icon ? state.icon + ' ' : '') + item.text;
}

/** Ссылка пункта: либо заданная явно, либо поиск по хештегу. */
function itemUrl(item) {
  if (item.url) return item.url;
  const tag = '%23' + encodeURIComponent(String(item.hashtag || '').replace(/^#/, ''));
  if (state.searchMode === 'hashtag') {
    return 'https://vk.com/feed?section=search&q=' + tag;
  }
  return 'https://vk.com/' + CONFIG.community + '?q=' + tag;
}

/** Собирает VKScript-код виджета из текущего состояния. */
function buildWidgetCode() {
  const items = state.items.filter((i) => i && i.text);
  const widget = { title: state.title };

  if (state.widgetType === 'table') {
    const columns = Math.min(Math.max(1, state.columns), MAX_TABLE_COLUMNS);
    const rows = items.slice(0, columns * MAX_TABLE_ROWS);
    const body = [];
    for (let i = 0; i < rows.length; i += columns) {
      const row = [];
      for (let j = 0; j < columns; j++) {
        const item = rows[i + j];
        row.push(item ? { text: itemLabel(item), url: itemUrl(item) } : { text: '\u00A0' });
      }
      body.push(row);
    }
    widget.body = body;
  } else {
    widget.rows = items.slice(0, MAX_LIST_ITEMS).map((item) => ({
      title: itemLabel(item),
      title_url: itemUrl(item),
    }));
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
  if (state.widgetType === 'table') {
    if (state.columns < 1 || state.columns > MAX_TABLE_COLUMNS) problems.push('Колонок должно быть от 1 до 6.');
    if (state.items.length > state.columns * MAX_TABLE_ROWS) problems.push('Слишком много пунктов для таблицы.');
  } else if (state.items.length > MAX_LIST_ITEMS) {
    problems.push('Для списка максимум 6 пунктов — сейчас ' + state.items.length + '.');
  }
  state.items.forEach((item) => {
    const url = itemUrl(item);
    if (!/^https:\/\/(vk\.com|vk\.ru|vk\.me)\//.test(url)) {
      problems.push('Ссылка пункта должна быть внутренней ВК: ' + item.text);
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
  if (typeof data.icon === 'string') state.icon = data.icon;
  if (Number(data.columns) > 0) state.columns = Number(data.columns);
  if (data.widgetType === 'table' || data.widgetType === 'list') state.widgetType = data.widgetType;
  if (data.searchMode === 'community' || data.searchMode === 'hashtag') state.searchMode = data.searchMode;
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

  const title = document.createElement('div');
  title.className = 'widget-title';
  title.textContent = state.title;
  box.appendChild(title);

  if (state.widgetType === 'table') {
    const grid = document.createElement('div');
    grid.className = 'widget-grid';
    grid.style.gridTemplateColumns = 'repeat(' + Math.min(state.columns, 3) + ', minmax(0, 1fr))';
    state.items.forEach((item) => {
      const a = document.createElement('a');
      a.href = itemUrl(item);
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = itemLabel(item);
      grid.appendChild(a);
    });
    box.appendChild(grid);
  } else {
    const list = document.createElement('div');
    list.className = 'widget-rows';
    state.items.slice(0, MAX_LIST_ITEMS).forEach((item) => {
      const a = document.createElement('a');
      a.href = itemUrl(item);
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = itemLabel(item);
      list.appendChild(a);
    });
    box.appendChild(list);
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
    log('VK Bridge инициализирован.', 'ok');
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
  init();
});
