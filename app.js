'use strict';

/* =========================================================
   Meu Sistema Pessoal — agenda + dashboard
   Todos os dados ficam só neste aparelho:
   - textos em localStorage
   - imagens da wishlist em IndexedDB
   ========================================================= */

const KEY = 'msp-data-v1';

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = d => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));
const todayStr = () => ymd(new Date());
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dayOfYear = d => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
const haptic = () => { try { navigator.vibrate && navigator.vibrate(8); } catch {} };

const DOW = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DOW_LONG = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MONTHS_S = MONTHS.map(m => m.slice(0, 3));
const AREA_NAME = { pessoal: 'Pessoal', trabalho: 'Trabalho' };

const REMINDS = [['', 'Sem lembrete'], ['0', 'Na hora'], ['10', '10 min antes'], ['30', '30 min antes'], ['60', '1 hora antes'], ['1440', '1 dia antes']];
const IDEA_COLORS = ['#feefb8', '#c4dae8', '#fff7d9', '#e2edf4', '#f1e6de'];

const QUOTES = [
  'Um passo pequeno ainda é um passo.',
  'Você não precisa dar conta de tudo hoje. Só do próximo item.',
  'Cabeça organizada, coração mais leve.',
  'Feito é melhor do que perfeito.',
  'Respira. Uma coisa de cada vez.',
  'Descansar também é parte do plano.',
  'O que você planta hoje, colhe com calma depois.',
  'Seja gentil com você enquanto aprende.',
  'Não é sobre ter tempo, é sobre escolher onde colocá-lo.',
  'Começar já é metade do caminho.',
  'Constância vence intensidade.',
  'Seu ritmo é válido.',
  'Hoje é um bom dia para riscar algo da lista.',
  'Pequenas rotinas constroem grandes mudanças.',
  'Escreva. O que está no papel sai da cabeça.',
  'Progresso, não perfeição.',
  'Você já chegou longe. Olhe para trás de vez em quando.',
  'Dizer não para algo é dizer sim para você.',
  'Clareza vem com movimento.',
  'Organize o dia, mas deixe espaço para o inesperado.',
  'Faça o difícil primeiro, e o resto fica leve.',
  'Celebre as pequenas vitórias.',
  'Tudo bem recomeçar quantas vezes precisar.',
  'Foco no que dá para controlar.',
  'Uma mente calma enxerga melhor.',
  'Os seus sonhos merecem um lugar na agenda.',
  'Menos pressa, mais presença.',
  'Cuide de você como cuida das suas tarefas.',
  'O dia de hoje não volta. Viva ele com intenção.',
  'Disciplina é lembrar o que você quer.',
  'Às vezes o mais produtivo é pausar.',
  'Você é capaz de coisas que ainda nem imagina.',
  'Termine o dia com orgulho, não com culpa.',
  'Bons hábitos são presentes para o seu eu do futuro.',
  'Faça hoje algo que o seu eu de amanhã vai agradecer.',
  'Simplicidade também é sofisticação.',
  'Uma ideia anotada é uma ideia salva.',
  'Não compare o seu capítulo 1 com o capítulo 20 de ninguém.',
  'Calma: o que é seu está no caminho.',
  'Sua energia é preciosa. Gaste com o que importa.',
  'Hoje, escolha uma coisa para fazer muito bem.',
  'Devagar também se chega.',
  'Seja a sua própria torcida.',
  'Planejar é cuidar do futuro com carinho.',
  'Leveza é uma escolha diária.'
];

const ICON = {
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  dots: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>'
};

/* ---------- state ---------- */
function defaults() {
  return {
    version: 1,
    name: '',
    hideInstall: false,
    items: [],   // {id, area, type:'tarefa'|'evento', title, date, time, endTime, notes, remind, done, notified, created}
    ideas: [],   // {id, text, color, rot, created}
    wishes: [],  // {id, text, img, got, created}
    habits: [    // {id, name, emoji, log:{'YYYY-MM-DD':true}}
      { id: uid(), name: 'Beber água', emoji: '💧', log: {} },
      { id: uid(), name: 'Ler um pouco', emoji: '📖', log: {} },
      { id: uid(), name: 'Mexer o corpo', emoji: '🌿', log: {} }
    ]
  };
}

let S;
try { S = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY))); } catch { S = defaults(); }

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch { toast('Não consegui salvar: armazenamento cheio.'); }
}

const UI = {
  tab: 'inicio',
  area: {
    pessoal: { view: 'dia', date: todayStr() },
    trabalho: { view: 'dia', date: todayStr() }
  },
  showGot: false
};

/* ---------- images (IndexedDB) ---------- */
const IDB = (() => {
  let p;
  const db = () => p || (p = new Promise((res, rej) => {
    const r = indexedDB.open('msp-img', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('imgs');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const run = async (mode, fn) => {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction('imgs', mode);
      const req = fn(t.objectStore('imgs'));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    });
  };
  return {
    get: k => run('readonly', s => s.get(k)),
    set: (k, v) => run('readwrite', s => s.put(v, k)),
    del: k => run('readwrite', s => s.delete(k))
  };
})();

const imgCache = new Map();
async function imgURL(id) {
  if (imgCache.has(id)) return imgCache.get(id);
  const blob = await IDB.get(id);
  if (!blob) return '';
  const url = URL.createObjectURL(blob);
  imgCache.set(id, url);
  return url;
}
function hydrateImages(root = document) {
  $$('img[data-img]', root).forEach(async el => {
    try { const u = await imgURL(el.dataset.img); if (u) el.src = u; } catch {}
  });
}
async function compressImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const max = 1200, sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * sc);
    c.height = Math.round(img.naturalHeight * sc);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(r, 'image/jpeg', 0.82));
  } finally { URL.revokeObjectURL(url); }
}
const blobToDataURL = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });

/* ---------- queries ---------- */
const byTime = (a, b) => (a.time || '').localeCompare(b.time || '') || (a.created || 0) - (b.created || 0);
const itemsOn = (area, ds) => S.items.filter(i => i.area === area && i.date === ds).sort(byTime);
const findItem = id => S.items.find(i => i.id === id);
const whenOf = it => new Date(`${it.date}T${it.time || '09:00'}`).getTime();

function streak(h) {
  let d = new Date(), n = 0;
  if (!h.log[ymd(d)]) d = addDays(d, -1);
  while (h.log[ymd(d)]) { n++; d = addDays(d, -1); }
  return n;
}

/* ---------- render ---------- */
function render(anim) {
  const main = $('#main');
  const isArea = UI.tab === 'pessoal' || UI.tab === 'trabalho';
  main.className = 'view' + (isArea ? ' area-' + UI.tab : '');
  void main.offsetWidth; // reinicia a animação
  if (anim) main.classList.add(anim);
  const views = {
    inicio: renderHome,
    pessoal: () => renderAgenda('pessoal'),
    trabalho: () => renderAgenda('trabalho'),
    ideias: renderIdeas,
    wishlist: renderWish
  };
  main.innerHTML = views[UI.tab]();
  $$('.nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === UI.tab));
  const fab = $('#fab');
  fab.hidden = !(isArea || UI.tab === 'wishlist');
  fab.className = 'fab' + (isArea ? ' area-' + UI.tab : '');
  hydrateImages(main);
}

function itemRow(it, opts = {}) {
  const isTask = it.type === 'tarefa';
  const time = it.time ? `${it.time}${it.endTime ? '–' + it.endTime : ''}` : '';
  return `<div class="item ${isTask ? 'task' : 'event'} ${it.done ? 'done' : ''}" data-a="item-edit" data-id="${it.id}">
    ${isTask ? `<button class="check" data-a="item-toggle" data-id="${it.id}" aria-label="Concluir">${ICON.check}</button>` : ''}
    <div class="item-body">
      <span class="item-title">${esc(it.title)}</span>
      ${time ? `<span class="item-time ${it.endTime ? 'range' : ''}">${time}</span>` : ''}
    </div>
    ${it.remind !== '' && it.remind != null ? `<span class="bell">${ICON.bell}</span>` : ''}
  </div>`;
}

/* ----- início ----- */
function greeting() { const h = new Date().getHours(); return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }

function installBanner() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone || S.hideInstall) return '';
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<div class="banner"><p><b>Instale na tela inicial</b><br>${ios
    ? 'No Safari, toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.'
    : 'No Chrome, abra o menu <b>⋮</b> e toque em <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>).'}</p>
    <button class="icon-btn sm" data-a="hide-install" aria-label="Fechar">✕</button></div>`;
}

function renderHome() {
  const t = new Date(), ts = ymd(t);
  const q = QUOTES[dayOfYear(t) % QUOTES.length];
  return `
  <header class="top">
    <div><p class="eyebrow">${DOW_LONG[t.getDay()]}, ${t.getDate()} de ${MONTHS[t.getMonth()]}</p>
    <h1>${greeting()}${S.name ? ', ' + esc(S.name) : ''}</h1></div>
    <button class="icon-btn" data-a="settings" aria-label="Ajustes">${ICON.gear}</button>
  </header>
  ${installBanner()}
  <section class="quote"><span class="quote-mark">“</span><p>${esc(q)}</p><small>frase do dia</small></section>
  <section class="today-grid">${['pessoal', 'trabalho'].map(a => todayCard(a, ts)).join('')}</section>
  <section class="block">
    <div class="block-head"><h2>Hábitos de hoje</h2><button class="link" data-a="habit-new">+ novo hábito</button></div>
    ${renderHabits(ts)}
  </section>`;
}

function todayCard(area, ts) {
  const its = itemsOn(area, ts);
  const tasks = its.filter(i => i.type === 'tarefa'), done = tasks.filter(i => i.done).length;
  const pct = tasks.length ? done / tasks.length : 0;
  const C = 2 * Math.PI * 18;
  const events = its.filter(i => i.type === 'evento').length;
  const sub = its.length
    ? [tasks.length && `${done}/${tasks.length} tarefas`, events && `${events} evento${events > 1 ? 's' : ''}`].filter(Boolean).join(' · ')
    : 'nada marcado hoje';
  const shown = its.slice(0, 4);
  return `<article class="tcard area-${area}">
    <div class="tcard-head">
      <div class="ring"><svg viewBox="0 0 44 44"><circle class="bg" cx="22" cy="22" r="18"/><circle class="fg" cx="22" cy="22" r="18" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" stroke-linecap="round"/></svg><b>${tasks.length ? Math.round(pct * 100) + '%' : '·'}</b></div>
      <h3>${AREA_NAME[area]}<small>${sub}</small></h3>
    </div>
    ${shown.length ? `<div class="list">${shown.map(i => itemRow(i)).join('')}</div>` : ''}
    <div class="tcard-foot">
      <button class="link" data-a="item-new" data-area="${area}" data-date="${ts}">+ adicionar</button>
      <button class="link" data-a="go-area" data-area="${area}">${its.length > 4 ? `ver mais ${its.length - 4} →` : 'abrir agenda →'}</button>
    </div>
  </article>`;
}

function renderHabits(ts) {
  if (!S.habits.length) return `<p class="empty">Nenhum hábito ainda. Que tal começar com um?</p>`;
  const days = [...Array(7)].map((_, i) => addDays(new Date(), i - 6));
  return `<div class="habits">${S.habits.map(h => {
    const st = streak(h);
    return `<div class="habit">
      <button class="habit-main ${h.log[ts] ? 'on' : ''}" data-a="habit-toggle" data-id="${h.id}" data-day="${ts}">
        <span class="habit-emoji">${esc(h.emoji || '✨')}</span>
        <span class="habit-name">${esc(h.name)}</span>
        <span class="habit-check">${ICON.check}</span>
      </button>
      <div class="habit-foot">
        <div class="habit-week">${days.map(d => {
          const k = ymd(d);
          return `<button class="hd ${h.log[k] ? 'on' : ''} ${k === ts ? 'today' : ''}" data-a="habit-toggle" data-id="${h.id}" data-day="${k}" aria-label="${DOW_LONG[d.getDay()]}">${DOW[d.getDay()][0]}</button>`;
        }).join('')}</div>
        <span class="streak">${st ? `🔥 ${st} dia${st > 1 ? 's' : ''}` : ''}</span>
        <button class="icon-btn sm" data-a="habit-edit" data-id="${h.id}" aria-label="Editar hábito">${ICON.dots}</button>
      </div>
    </div>`;
  }).join('')}</div>`;
}

/* ----- agenda ----- */
function dayLabel(d) {
  const k = ymd(d);
  const rel = k === todayStr() ? 'hoje'
    : k === ymd(addDays(new Date(), 1)) ? 'amanhã'
    : k === ymd(addDays(new Date(), -1)) ? 'ontem'
    : DOW_LONG[d.getDay()];
  return `${rel}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

function renderAgenda(area) {
  const st = UI.area[area], d = parseYmd(st.date);
  let label, body;
  if (st.view === 'dia') { label = dayLabel(d); body = renderDay(area, st.date); }
  else if (st.view === 'semana') {
    const s = startOfWeek(d), e = addDays(s, 6);
    label = s.getMonth() === e.getMonth()
      ? `${s.getDate()} – ${e.getDate()} de ${MONTHS[e.getMonth()]}`
      : `${s.getDate()} ${MONTHS_S[s.getMonth()]} – ${e.getDate()} ${MONTHS_S[e.getMonth()]}`;
    body = renderWeek(area, s);
  } else { label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; body = renderMonth(area, d); }

  return `<header class="top">
      <div><p class="eyebrow">agenda</p><h1>${AREA_NAME[area]}</h1></div>
      <button class="pill" data-a="go-today">Hoje</button>
    </header>
    <div class="seg">${[['dia', 'Dia'], ['semana', 'Semana'], ['mes', 'Mês']].map(([v, l]) =>
      `<button class="${st.view === v ? 'on' : ''}" data-a="view" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="datenav">
      <button class="icon-btn" data-a="nav" data-dir="-1" aria-label="Anterior">${ICON.left}</button>
      <span class="datelabel">${label}</span>
      <button class="icon-btn" data-a="nav" data-dir="1" aria-label="Próximo">${ICON.right}</button>
    </div>
    <div class="agenda-body ${st.view !== 'semana' ? 'swipe' : ''}">${body}</div>`;
}

function renderDay(area, ds) {
  const its = itemsOn(area, ds);
  if (!its.length) return `<div class="empty-state"><p>Dia livre por aqui ✨</p><button class="btn soft" data-a="item-new" data-date="${ds}">Adicionar algo</button></div>`;
  const tasks = its.filter(i => i.type === 'tarefa'), done = tasks.filter(i => i.done).length;
  const untimed = its.filter(i => !i.time), timed = its.filter(i => i.time);
  return `${tasks.length ? `<div class="progress"><div class="bar"><span style="width:${Math.round(done / tasks.length * 100)}%"></span></div><small>${done} de ${tasks.length} tarefa${tasks.length > 1 ? 's' : ''}</small></div>` : ''}
    ${untimed.length ? `<h3 class="sec">Qualquer hora</h3><div class="list">${untimed.map(i => itemRow(i)).join('')}</div>` : ''}
    ${timed.length ? `<h3 class="sec">Com horário</h3><div class="timeline">${timed.map(i => `<div class="tl-row"><span class="tl-time">${i.time}</span>${itemRow(i)}</div>`).join('')}</div>` : ''}`;
}

function renderWeek(area, s) {
  const t = todayStr();
  return `<div class="week">${[...Array(7)].map((_, i) => {
    const d = addDays(s, i), k = ymd(d), its = itemsOn(area, k);
    return `<div class="wcol ${k === t ? 'today' : ''}" ${k === t ? 'data-today' : ''}>
      <button class="wcol-head" data-a="open-day" data-date="${k}"><span>${DOW[d.getDay()]}</span><b>${d.getDate()}</b></button>
      <div class="wcol-list">${its.map(x => itemRow(x)).join('') || '<p class="wcol-empty">—</p>'}</div>
      <button class="wcol-add" data-a="item-new" data-date="${k}">+ adicionar</button>
    </div>`;
  }).join('')}</div>`;
}

function renderMonth(area, d) {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const s = startOfWeek(first);
  const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const rows = Math.ceil((((first.getDay() + 6) % 7) + dim) / 7);
  const t = todayStr(), sel = UI.area[area].date;
  let cells = '';
  for (let i = 0; i < rows * 7; i++) {
    const x = addDays(s, i), k = ymd(x), its = itemsOn(area, k);
    cells += `<button class="mcell ${x.getMonth() !== d.getMonth() ? 'out' : ''} ${k === t ? 'today' : ''} ${k === sel ? 'sel' : ''}" data-a="month-pick" data-date="${k}">
      <span class="mnum">${x.getDate()}</span>
      <span class="mdots">${its.slice(0, 3).map(it => `<i class="${it.type} ${it.done ? 'done' : ''}"></i>`).join('')}${its.length > 3 ? '<em>+</em>' : ''}</span>
    </button>`;
  }
  const selItems = itemsOn(area, sel);
  return `<div class="month">
      <div class="mhead">${['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map(h => `<span>${h}</span>`).join('')}</div>
      <div class="mgrid">${cells}</div>
    </div>
    <div class="month-detail">
      <div class="block-head"><h3 class="sec">${dayLabel(parseYmd(sel))}</h3><button class="link" data-a="item-new" data-date="${sel}">+ adicionar</button></div>
      <div class="list">${selItems.map(i => itemRow(i)).join('') || '<p class="empty">Nada marcado neste dia.</p>'}</div>
    </div>`;
}

/* ----- ideias ----- */
function fmtShort(ts) { const d = new Date(ts); return `${d.getDate()} ${MONTHS_S[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}`; }

function renderIdeas() {
  const list = [...S.ideas].sort((a, b) => b.created - a.created);
  return `<header class="top"><div><p class="eyebrow">cabeça leve</p><h1>Ideias</h1></div></header>
    <form class="quick" id="idea-form">
      <textarea name="text" rows="2" placeholder="Solte uma ideia ou pensamento…"></textarea>
      <button class="btn" type="submit">Soltar</button>
    </form>
    ${list.length
      ? `<div class="board">${list.map(i => `<article class="postit" style="--c:${i.color};--r:${i.rot}deg" data-a="idea-edit" data-id="${i.id}"><p>${esc(i.text)}</p><small>${fmtShort(i.created)}</small></article>`).join('')}</div>`
      : `<div class="empty-state"><p>Seu mural está vazio. Escreva qualquer coisa, sem filtro. 💭</p></div>`}`;
}

/* ----- wishlist ----- */
function wishCard(w) {
  return `<article class="wcard" data-a="wish-edit" data-id="${w.id}">
    ${w.img ? `<div class="wimg"><img data-img="${w.img}" alt=""></div>` : `<div class="wimg ph">✨</div>`}
    <p>${esc(w.text)}</p>
  </article>`;
}
function renderWish() {
  const sorted = [...S.wishes].sort((a, b) => b.created - a.created);
  const open = sorted.filter(w => !w.got), got = sorted.filter(w => w.got);
  return `<header class="top"><div><p class="eyebrow">um dia vai ser meu</p><h1>Wishlist</h1></div></header>
    ${open.length ? `<div class="wgrid">${open.map(wishCard).join('')}</div>`
      : `<div class="empty-state"><p>O que você anda desejando?</p><button class="btn soft" data-a="fab">Adicionar desejo</button></div>`}
    ${got.length ? `<button class="link center" data-a="toggle-got">${UI.showGot ? 'esconder' : 'ver'} conquistados (${got.length}) 🎉</button>
      ${UI.showGot ? `<div class="wgrid got">${got.map(wishCard).join('')}</div>` : ''}` : ''}`;
}

/* ---------- sheet ---------- */
function openSheet(html, mount) {
  const sh = $('#sheet');
  $('#sheet-body').innerHTML = html;
  sh.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => sh.classList.add('open')));
  if (mount) mount($('#sheet-body'));
}
function closeSheet() {
  const sh = $('#sheet');
  sh.classList.remove('open');
  setTimeout(() => { if (!sh.classList.contains('open')) { sh.hidden = true; $('#sheet-body').innerHTML = ''; } }, 260);
}

function itemSheet(it, def = {}) {
  const isNew = !it;
  it = it || { type: 'tarefa', area: def.area, date: def.date || todayStr(), time: '', endTime: '', title: '', notes: '', remind: '' };
  openSheet(`<form id="item-form" class="form area-${it.area} ${it.type === 'evento' ? 'is-event' : ''}">
    <div class="sheet-head"><h2>${isNew ? 'Novo' : 'Editar'}</h2><span class="tag">${AREA_NAME[it.area]}</span></div>
    <div class="seg">${[['tarefa', 'Tarefa'], ['evento', 'Evento']].map(([v, l]) =>
      `<label><input type="radio" name="kind" value="${v}" ${it.type === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
    <input class="field big" name="what" placeholder="O que é?" value="${esc(it.title)}" required autocomplete="off" enterkeyhint="done">
    <div class="row">
      <label class="lbl">Data<input class="field" type="date" name="date" value="${it.date}" required></label>
      <label class="lbl">Hora<input class="field" type="time" name="time" value="${it.time || ''}"></label>
      <label class="lbl end">Até<input class="field" type="time" name="endTime" value="${it.endTime || ''}"></label>
    </div>
    <label class="lbl">Lembrete
      <select class="field" name="remind">${REMINDS.map(([v, l]) => `<option value="${v}" ${String(it.remind ?? '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <span class="hint">Sem horário definido, o lembrete usa 9h do dia.</span>
    </label>
    <label class="lbl">Notas<textarea class="field" name="notes" rows="3" placeholder="Detalhes (opcional)">${esc(it.notes)}</textarea></label>
    <div class="actions">
      ${isNew ? '' : `<button type="button" class="btn ghost danger" data-a="item-del" data-id="${it.id}">Excluir</button>`}
      <button class="btn" type="submit">Salvar</button>
    </div>
  </form>`, root => {
    const f = $('#item-form', root), el = f.elements;
    $$('input[name="kind"]', f).forEach(r => r.addEventListener('change', () => f.classList.toggle('is-event', el.kind.value === 'evento')));
    if (isNew) setTimeout(() => el.what.focus(), 280);
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const data = {
        type: el.kind.value,
        title: el.what.value.trim(),
        date: el.date.value,
        time: el.time.value,
        endTime: el.kind.value === 'evento' ? el.endTime.value : '',
        remind: el.remind.value,
        notes: el.notes.value.trim(),
        notified: false
      };
      if (!data.title) return;
      if (isNew) S.items.push({ id: uid(), area: it.area, done: false, created: Date.now(), ...data });
      else Object.assign(it, data);
      save();
      closeSheet();
      render();
      if (data.remind !== '') {
        const ok = await ensureNotif();
        if (ok) toast('Lembrete marcado 🔔');
      }
    });
  });
}

function habitSheet(h) {
  const isNew = !h;
  h = h || { name: '', emoji: '✨' };
  openSheet(`<form id="habit-form" class="form">
    <div class="sheet-head"><h2>${isNew ? 'Novo hábito' : 'Editar hábito'}</h2></div>
    <div class="row">
      <label class="lbl" style="flex:0 0 76px">Emoji<input class="field big" name="emoji" value="${esc(h.emoji)}" maxlength="4" style="text-align:center"></label>
      <label class="lbl">Hábito<input class="field big" name="hname" value="${esc(h.name)}" placeholder="Ex.: meditar 5 min" required autocomplete="off"></label>
    </div>
    <div class="actions">
      ${isNew ? '' : `<button type="button" class="btn ghost danger" data-a="habit-del" data-id="${h.id}">Excluir</button>`}
      <button class="btn" type="submit">Salvar</button>
    </div>
  </form>`, root => {
    const f = $('#habit-form', root);
    if (isNew) setTimeout(() => f.elements.hname.focus(), 280);
    f.addEventListener('submit', e => {
      e.preventDefault();
      const name = f.elements.hname.value.trim(); if (!name) return;
      const emoji = f.elements.emoji.value.trim() || '✨';
      if (isNew) S.habits.push({ id: uid(), name, emoji, log: {} });
      else Object.assign(h, { name, emoji });
      save(); closeSheet(); render();
    });
  });
}

function ideaSheet(idea) {
  openSheet(`<form id="idea-edit" class="form">
    <div class="sheet-head"><h2>Ideia</h2><small class="hint">${fmtShort(idea.created)}</small></div>
    <textarea class="field" name="text" rows="6" style="background:${idea.color};border-color:transparent;font-size:17px">${esc(idea.text)}</textarea>
    <div class="swatches">${IDEA_COLORS.map(c => `<button type="button" class="swatch ${c === idea.color ? 'on' : ''}" style="background:${c}" data-a="idea-color" data-c="${c}" aria-label="Cor"></button>`).join('')}</div>
    <div class="actions">
      <button type="button" class="btn ghost danger" data-a="idea-del" data-id="${idea.id}">Excluir</button>
      <button class="btn" type="submit">Salvar</button>
    </div>
  </form>`, root => {
    const f = $('#idea-edit', root);
    f.dataset.id = idea.id;
    f.addEventListener('submit', e => {
      e.preventDefault();
      const text = f.elements.text.value.trim();
      if (!text) return;
      idea.text = text;
      idea.color = f.dataset.color || idea.color;
      save(); closeSheet(); render();
    });
  });
}

function wishSheet(w) {
  const isNew = !w;
  w = w || { text: '', img: null, got: false };
  let pending; // undefined = sem mudança, null = remover, Blob = nova imagem
  openSheet(`<form id="wish-form" class="form">
    <div class="sheet-head"><h2>${isNew ? 'Novo desejo' : 'Desejo'}</h2></div>
    <label class="img-pick">
      <input type="file" accept="image/*" name="file" hidden>
      <div class="img-prev">${w.img ? `<img data-img="${w.img}" alt="">` : '<span>📷 Anexar imagem</span>'}</div>
    </label>
    ${w.img ? `<button type="button" class="link" data-a="wish-img-remove" style="align-self:flex-start">remover imagem</button>` : ''}
    <input class="field big" name="wtext" placeholder="O que é?" value="${esc(w.text)}" required autocomplete="off">
    ${isNew ? '' : `<label class="switch"><input type="checkbox" name="got" ${w.got ? 'checked' : ''}><span>Já conquistei! 🎉</span></label>`}
    <div class="actions">
      ${isNew ? '' : `<button type="button" class="btn ghost danger" data-a="wish-del" data-id="${w.id}">Excluir</button>`}
      <button class="btn" type="submit">Salvar</button>
    </div>
  </form>`, root => {
    const f = $('#wish-form', root), prev = $('.img-prev', f);
    hydrateImages(root);
    f.elements.file.addEventListener('change', async () => {
      const file = f.elements.file.files[0]; if (!file) return;
      prev.innerHTML = '<span>carregando…</span>';
      try {
        pending = await compressImage(file);
        prev.innerHTML = `<img src="${URL.createObjectURL(pending)}" alt="">`;
      } catch { prev.innerHTML = '<span>Não consegui abrir essa imagem</span>'; }
    });
    f._removeImg = () => { pending = null; prev.innerHTML = '<span>📷 Anexar imagem</span>'; };
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const text = f.elements.wtext.value.trim(); if (!text) return;
      const old = w.img;
      if (pending instanceof Blob) {
        const id = uid();
        try { await IDB.set(id, pending); w.img = id; } catch { toast('Não consegui salvar a imagem.'); }
      } else if (pending === null) w.img = null;
      if (old && old !== w.img) { IDB.del(old).catch(() => {}); imgCache.delete(old); }
      w.text = text;
      if (!isNew) w.got = f.elements.got.checked;
      if (isNew) S.wishes.push({ id: uid(), created: Date.now(), ...w });
      save(); closeSheet(); render();
    });
  });
}

function settingsSheet() {
  const perm = 'Notification' in window ? Notification.permission : 'indisponível';
  const permTxt = { granted: 'ativadas ✅', denied: 'bloqueadas nos ajustes do celular', default: 'ainda não ativadas', 'indisponível': 'não suportadas neste navegador' }[perm];
  openSheet(`<div class="form">
    <div class="sheet-head"><h2>Ajustes</h2></div>
    <form class="setting" id="name-form">
      <h3>Como posso te chamar?</h3>
      <div class="row"><input class="field" name="nm" value="${esc(S.name)}" placeholder="Seu nome" style="flex:1"><button class="btn">Salvar</button></div>
    </form>
    <div class="setting">
      <h3>Notificações</h3>
      <p>Status: ${permTxt}.</p>
      ${perm !== 'granted' && perm !== 'indisponível' ? '<button class="btn soft" data-a="notif-on">Ativar notificações</button>' : ''}
      <button class="btn ghost" data-a="notif-test">Enviar notificação de teste</button>
    </div>
    <div class="setting">
      <h3>Backup</h3>
      <p>Seus dados ficam só neste celular. Faça um backup de vez em quando para não perder nada se trocar de aparelho.</p>
      <div class="row">
        <button class="btn soft" data-a="export">Exportar backup</button>
        <label class="btn ghost" style="text-align:center">Importar<input type="file" accept="application/json,.json" id="import-file" hidden></label>
      </div>
    </div>
  </div>`, root => {
    $('#name-form', root).addEventListener('submit', e => {
      e.preventDefault(); S.name = e.target.elements.nm.value.trim(); save(); closeSheet(); render();
    });
    $('#import-file', root).addEventListener('change', e => importBackup(e.target.files[0]));
  });
}

/* ---------- notificações ---------- */
async function ensureNotif() {
  if (!('Notification' in window)) { toast('No iPhone, as notificações só funcionam com o app aberto pelo ícone da tela inicial.'); return false; }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') { toast('Notificações bloqueadas. Libere nos ajustes do celular.'); return false; }
  const p = await Notification.requestPermission();
  return p === 'granted';
}
async function notify(title, body, tag) {
  const opts = { body, tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' };
  try {
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
    if (reg) { await reg.showNotification(title, opts); return; }
  } catch {}
  try { new Notification(title, opts); } catch {}
}
function checkReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = Date.now();
  let changed = false;
  for (const it of S.items) {
    if (it.remind === '' || it.remind == null || it.done || it.notified) continue;
    const at = whenOf(it) - Number(it.remind) * 60000;
    if (now >= at) {
      if (now - at < 12 * 3600e3) {
        const when = it.time ? `às ${it.time}` : 'hoje';
        notify(it.title, `${AREA_NAME[it.area]} · ${it.date === todayStr() ? when : it.date.split('-').reverse().join('/') + (it.time ? ' ' + it.time : '')}`, it.id);
      }
      it.notified = true; changed = true;
    }
  }
  if (changed) save();
}

/* ---------- backup ---------- */
async function exportBackup() {
  const imgs = {};
  for (const w of S.wishes) if (w.img) { try { const b = await IDB.get(w.img); if (b) imgs[w.img] = await blobToDataURL(b); } catch {} }
  const json = JSON.stringify({ app: 'meu-sistema-pessoal', exported: new Date().toISOString(), state: S, imgs });
  const name = `backup-meu-sistema-${todayStr()}.json`;
  const blob = new Blob([json], { type: 'application/json' });
  try {
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Backup Meu Sistema' }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function importBackup(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data || !data.state || !Array.isArray(data.state.items)) throw new Error('formato');
    if (!confirm('Substituir tudo o que está no app pelos dados do backup?')) return;
    for (const [id, url] of Object.entries(data.imgs || {})) {
      const b = await (await fetch(url)).blob();
      await IDB.set(id, b);
    }
    S = Object.assign(defaults(), data.state);
    imgCache.clear();
    save(); closeSheet(); render();
    toast('Backup restaurado ✨');
  } catch { toast('Esse arquivo não parece um backup válido.'); }
}

/* ---------- toast ---------- */
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ---------- ações ---------- */
function nav(dir) {
  const a = UI.area[UI.tab]; if (!a) return;
  const d = parseYmd(a.date);
  if (a.view === 'dia') a.date = ymd(addDays(d, dir));
  else if (a.view === 'semana') a.date = ymd(addDays(d, 7 * dir));
  else {
    const n = new Date(d.getFullYear(), d.getMonth() + dir, 1);
    const t = new Date();
    a.date = n.getFullYear() === t.getFullYear() && n.getMonth() === t.getMonth() ? todayStr() : ymd(n);
  }
  render(dir > 0 ? 'slide-l' : 'slide-r');
}

const A = {
  tab: el => { UI.tab = el.dataset.tab; render(); window.scrollTo(0, 0); },
  settings: () => settingsSheet(),
  'close-sheet': closeSheet,
  'hide-install': () => { S.hideInstall = true; save(); render(); },
  'go-area': el => { const a = el.dataset.area; UI.tab = a; UI.area[a].view = 'dia'; UI.area[a].date = todayStr(); render(); window.scrollTo(0, 0); },
  'go-today': () => { UI.area[UI.tab].date = todayStr(); render(); scrollWeekToToday(); },
  view: el => { UI.area[UI.tab].view = el.dataset.v; render(); scrollWeekToToday(); },
  nav: el => nav(+el.dataset.dir),
  'open-day': el => { const a = UI.area[UI.tab]; a.date = el.dataset.date; a.view = 'dia'; render(); },
  'month-pick': el => { UI.area[UI.tab].date = el.dataset.date; render(); },
  fab: () => UI.tab === 'wishlist' ? wishSheet() : itemSheet(null, { area: UI.tab, date: UI.area[UI.tab].date }),

  'item-new': el => {
    const area = el.dataset.area || UI.tab;
    itemSheet(null, { area, date: el.dataset.date || (UI.area[area] && UI.area[area].date) || todayStr() });
  },
  'item-edit': el => { const it = findItem(el.dataset.id); if (it) itemSheet(it); },
  'item-toggle': el => {
    const it = findItem(el.dataset.id); if (!it) return;
    it.done = !it.done; save(); haptic();
    render();
    if (it.done) {
      const rest = itemsOn(it.area, it.date).filter(i => i.type === 'tarefa' && !i.done);
      if (!rest.length) toast(`Tudo feito em ${AREA_NAME[it.area]}! 🎉`);
    }
  },
  'item-del': el => {
    if (!confirm('Excluir este item?')) return;
    S.items = S.items.filter(i => i.id !== el.dataset.id); save(); closeSheet(); render();
  },

  'habit-toggle': el => {
    const h = S.habits.find(x => x.id === el.dataset.id); if (!h) return;
    const k = el.dataset.day;
    if (h.log[k]) delete h.log[k]; else h.log[k] = true;
    save(); haptic(); render();
  },
  'habit-new': () => habitSheet(),
  'habit-edit': el => habitSheet(S.habits.find(x => x.id === el.dataset.id)),
  'habit-del': el => {
    if (!confirm('Excluir este hábito e o histórico dele?')) return;
    S.habits = S.habits.filter(h => h.id !== el.dataset.id); save(); closeSheet(); render();
  },

  'idea-edit': el => { const i = S.ideas.find(x => x.id === el.dataset.id); if (i) ideaSheet(i); },
  'idea-color': el => {
    const f = $('#idea-edit'); f.dataset.color = el.dataset.c;
    $$('.swatch', f).forEach(s => s.classList.toggle('on', s === el));
    f.elements.text.style.background = el.dataset.c;
  },
  'idea-del': el => {
    if (!confirm('Excluir esta ideia?')) return;
    S.ideas = S.ideas.filter(i => i.id !== el.dataset.id); save(); closeSheet(); render();
  },

  'wish-edit': el => { const w = S.wishes.find(x => x.id === el.dataset.id); if (w) wishSheet(w); },
  'wish-img-remove': el => { const f = $('#wish-form'); f._removeImg(); el.remove(); },
  'wish-del': el => {
    if (!confirm('Excluir este desejo?')) return;
    const w = S.wishes.find(x => x.id === el.dataset.id);
    if (w && w.img) IDB.del(w.img).catch(() => {});
    S.wishes = S.wishes.filter(x => x.id !== el.dataset.id); save(); closeSheet(); render();
  },
  'toggle-got': () => { UI.showGot = !UI.showGot; render(); },

  'notif-on': async () => { const ok = await ensureNotif(); if (ok) toast('Notificações ativadas 🔔'); settingsSheet(); },
  'notif-test': async () => { if (await ensureNotif()) notify('Tudo certo! 🔔', 'É assim que seus lembretes vão aparecer.', 'teste'); },
  export: () => exportBackup()
};

function scrollWeekToToday() {
  const col = $('.week [data-today]');
  if (col) col.parentElement.scrollLeft = col.offsetLeft - 16;
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const fn = A[el.dataset.a];
  if (fn) { e.preventDefault(); e.stopPropagation(); fn(el, e); }
});

document.addEventListener('submit', e => {
  if (e.target.id !== 'idea-form') return;
  e.preventDefault();
  const ta = e.target.elements.text, text = ta.value.trim();
  if (!text) { ta.focus(); return; }
  S.ideas.push({ id: uid(), text, color: IDEA_COLORS[Math.floor(Math.random() * IDEA_COLORS.length)], rot: +(Math.random() * 3 - 1.5).toFixed(2), created: Date.now() });
  save(); render(); haptic();
  setTimeout(() => $('#idea-form textarea') && $('#idea-form textarea').focus(), 50);
});

/* swipe para trocar de dia / mês */
let sx = null, sy = 0;
document.addEventListener('touchstart', e => {
  if (!e.target.closest('.swipe') || !$('#sheet').hidden) { sx = null; return; }
  sx = e.touches[0].clientX; sy = e.touches[0].clientY;
}, { passive: true });
document.addEventListener('touchend', e => {
  if (sx == null) return;
  const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
  sx = null;
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) nav(dx < 0 ? 1 : -1);
}, { passive: true });

/* ---------- start ---------- */
render();
checkReminders();
setInterval(checkReminders, 20000);
let lastDay = todayStr();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  checkReminders();
  if (todayStr() !== lastDay) { lastDay = todayStr(); render(); }
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
