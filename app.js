/* =========================================================================
   Меню сообщества «Умка» — бесплатный «виджет сообщества» ВКонтакте.

   Пункты меню ведут на поиск по хештегу внутри сообщества.

   ЧТО МЕНЯТЬ ПЕРЕД ПУБЛИКАЦИЕЙ:
   1. CONFIG.community — короткое имя сообщества (из адреса vk.ru/ymka32020).
   2. CONFIG.title     — заголовок блока.
   3. CONFIG.items     — пункты меню: text (подпись) + hashtag (без # или с #).
      Ссылка собирается автоматически.
   4. CONFIG.columns   — число колонок таблицы (2 или 3; максимум 6).

   ВАЖНО: виджеты сообществ принимают только внутренние ссылки ВК
   (vk.com / vk.ru / vk.me). Внешние сайты — нельзя.
   ========================================================================= */

const CONFIG = {
  community: 'ymka32020', // короткое имя вашего сообщества
  title: 'Добрый день, Ульяна!',
  widgetType: 'table', // 'table' | 'list' | 'compact_list'
  columns: 2,
  // Режим ссылки на поиск:
  //  'community' — поиск внутри сообщества:   vk.com/<community>?q=%23хештег
  //  'hashtag'   — общий поиск ВК по хештегу: vk.com/feed?section=search&q=%23хештег
  // Оставьте 'community'. Если на каком-то клиенте такая ссылка не сработает,
  // поменяйте на 'hashtag' и переустановите виджет.
  searchMode: 'community',
  // Необязательный футер блока. Пусто — футера не будет.
  more: '',
  moreUrl: '',
  items: [
    { text: '🍊 «Умка» — это люди', hashtag: 'УмкаЭтоЛюди' },
    { text: '🍊 Итоги недели', hashtag: 'УмкаИтогиНедели' },
    { text: '🍊 Умка готовится к…', hashtag: 'УмкаГотовится' },
    { text: '🍊 Умка знает правила', hashtag: 'УмкаЗнаетПравила' },
    { text: '🍊 Умкины истории', hashtag: 'УмкиныИстории' },
    { text: '🍊 Умка благодарит', hashtag: 'УмкаБлагодарит' },
    { text: '🍊 Умка в деле', hashtag: 'УмкаВДеле' },
    { text: '🍊 Умкины будни', hashtag: 'УмкиныБудни' },
    { text: '🍊 Умка рекомендует', hashtag: 'УмкаРекомендует' },
    { text: '🍊 Добро начинается с тебя', hashtag: 'ДоброНачинаетсяСТебя' },
  ],
};

const MAX_LIST_ITEMS = 6;
const MAX_TABLE_COLUMNS = 6;
const MAX_TABLE_ROWS = 11;

/** Ссылка пункта меню. Если задан url — берём его, иначе строим из хештега. */
function itemUrl(item, mode) {
  if (item.url) return item.url;
  const m = mode || CONFIG.searchMode;
  const tag = '%23' + encodeURIComponent(String(item.hashtag || '').replace(/^#/, ''));
  if (m === 'hashtag') {
    return 'https://vk.com/feed?section=search&q=' + tag;
  }
  return 'https://vk.com/' + CONFIG.community + '?q=' + tag;
}

/** Собирает VKScript-код виджета из CONFIG. */
function buildWidgetCode(mode) {
  const items = CONFIG.items.filter((i) => i && i.text);
  const widget = { title: CONFIG.title };

  if (CONFIG.widgetType === 'table') {
    const columns = Math.min(Math.max(1, CONFIG.columns), MAX_TABLE_COLUMNS);
    const rows = items.slice(0, columns * MAX_TABLE_ROWS);
    const body = [];
    for (let i = 0; i < rows.length; i += columns) {
      const row = [];
      for (let j = 0; j < columns; j++) {
        const item = rows[i + j];
        // пустые ячейки нужны, чтобы последняя строка не «съезжала»
        row.push(item ? { text: item.text, url: itemUrl(item, mode) } : { text: '\u00A0' });
      }
      body.push(row);
    }
    widget.body = body;
  } else {
    widget.rows = items.slice(0, MAX_LIST_ITEMS).map((item) => ({
      title: item.text,
      title_url: itemUrl(item, mode),
    }));
  }

  if (CONFIG.more && CONFIG.moreUrl) {
    widget.more = CONFIG.more;
    widget.more_url = CONFIG.moreUrl;
  }

  // ВАЖНО: параметр code — это строка с VKScript, заканчивающаяся точкой с запятой.
  return 'return ' + JSON.stringify(widget) + ';';
}

/* ------------------------------ UI -------------------------------------- */

const $ = (id) => document.getElementById(id);

function log(el, message, kind) {
  const line = document.createElement('div');
  if (kind) line.className = kind;
  line.textContent = message;
  el.appendChild(line);
}

function renderPreview(mode) {
  const box = $('preview');
  box.innerHTML = '';

  const title = document.createElement('div');
  title.className = 'widget-title';
  title.textContent = CONFIG.title;
  box.appendChild(title);

  if (CONFIG.widgetType === 'table') {
    const grid = document.createElement('div');
    grid.className = 'widget-grid';
    grid.style.gridTemplateColumns = `repeat(${Math.min(CONFIG.columns, 3)}, minmax(0, 1fr))`;
    CONFIG.items.forEach((item) => {
      const a = document.createElement('a');
      a.href = itemUrl(item, mode);
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = item.text;
      grid.appendChild(a);
    });
    box.appendChild(grid);
  } else {
    const list = document.createElement('div');
    list.className = 'widget-rows';
    CONFIG.items.slice(0, MAX_LIST_ITEMS).forEach((item) => {
      const a = document.createElement('a');
      a.href = itemUrl(item, mode);
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = item.text;
      list.appendChild(a);
    });
    box.appendChild(list);
  }

  if (CONFIG.more) {
    const more = document.createElement('div');
    more.className = 'widget-title';
    more.style.marginTop = '12px';
    more.style.marginBottom = '0';
    more.textContent = CONFIG.more;
    box.appendChild(more);
  }
}

let selectedGroupId = null;

function renderLinks(mode) {
  const box = $('links');
  if (!box) return;
  box.innerHTML = '';
  CONFIG.items.forEach((item) => {
    const url = itemUrl(item, mode);
    const row = document.createElement('div');
    row.className = 'linkrow';

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = item.text + ' → ' + url;

    const code = document.createElement('code');
    code.textContent = 'хештег: #' + String(item.hashtag || '').replace(/^#/, '');

    row.appendChild(a);
    row.appendChild(code);
    box.appendChild(row);
  });
}

function initBridge() {
  if (typeof vkBridge === 'undefined') {
    $('outside').hidden = false;
    return;
  }
  vkBridge
    .send('VKWebAppInit')
    .then(() => vkBridge.send('VKWebAppGetLaunchParams').catch(() => null))
    .then((params) => {
      const groupId = params && (params.vk_group_id || params.group_id);
      if (groupId) {
        selectedGroupId = String(groupId);
        $('group').value = selectedGroupId.replace(/^-/, '');
      }
    })
    .catch(() => {
      $('outside').hidden = false;
    });
}

function addToCommunity() {
  const out = $('log-add');
  out.textContent = '';
  if (typeof vkBridge === 'undefined') {
    log(out, 'Откройте приложение внутри ВКонтакте.', 'err');
    return;
  }
  log(out, 'Открываю выбор сообщества…', 'muted');
  vkBridge
    .send('VKWebAppAddToCommunity')
    .then((data) => {
      selectedGroupId = String(data.group_id);
      $('group').value = selectedGroupId.replace(/^-/, '');
      log(out, 'Готово: приложение добавлено в сообщество ' + selectedGroupId, 'ok');
      log(out, 'Теперь нажмите «Установить виджет».', 'muted');
    })
    .catch((error) => {
      log(out, 'Ошибка: ' + (error && (error.error_msg || error.message || JSON.stringify(error))), 'err');
    });
}

function installWidget() {
  const out = $('log-install');
  out.textContent = '';

  if (typeof vkBridge === 'undefined') {
    log(out, 'Откройте приложение внутри ВКонтакте.', 'err');
    return;
  }

  const raw = ($('group').value || selectedGroupId || '').trim().replace(/^-/, '');
  if (!raw) {
    log(out, 'Укажите ID сообщества (число без минуса).', 'err');
    return;
  }

  const payload = {
    group_id: Number(raw),
    type: CONFIG.widgetType,
    code: buildWidgetCode($('mode').value),
  };

  log(out, 'Показываю предпросмотр виджета…', 'muted');
  vkBridge
    .send('VKWebAppShowCommunityWidgetPreviewBox', payload)
    .then((data) => {
      if (data && data.result) {
        log(out, 'Экран предпросмотра открыт. Подтвердите установку в открывшемся окне.', 'ok');
      } else {
        log(out, 'Предпросмотр не открылся, ответ: ' + JSON.stringify(data), 'err');
      }
    })
    .catch((error) => {
      log(out, 'Ошибка: ' + (error && (error.error_msg || error.message || JSON.stringify(error))), 'err');
    });
}

function toggleCode() {
  const area = $('code');
  area.hidden = !area.hidden;
  area.value = buildWidgetCode($('mode').value);
}

document.addEventListener('DOMContentLoaded', () => {
  const modeSelect = $('mode');
  modeSelect.value = CONFIG.searchMode;
  renderPreview(modeSelect.value);
  renderLinks(modeSelect.value);
  modeSelect.addEventListener('change', () => {
    renderPreview(modeSelect.value);
    renderLinks(modeSelect.value);
  });
  initBridge();
  $('btn-add').addEventListener('click', addToCommunity);
  $('btn-install').addEventListener('click', installWidget);
  $('btn-code').addEventListener('click', toggleCode);
});
