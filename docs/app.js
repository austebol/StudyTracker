'use strict';

/* Study Tracker — a local-only PWA. Courses, sessions, settings and the
   running timer all live in localStorage on this device. Every figure on
   screen is derived from Session rows; no aggregates are stored. */

// ───────────────────────── constants

const STORE_KEY = 'study-tracker:v1';
const COURSE_COLORS = ['#968ae0', '#b5abfc', '#7972a9', '#d2cefd', '#9397ab'];
const HEAT_STEPS = ['#292b31', '#423a6a', '#5d5294', '#796cbf', '#b5abfc'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const RING_C = 653.5;
const DAY_MS = 86400000;

// Phosphor (regular) glyph paths, 256 viewBox
const ICONS = {
  today: 'M240,128a8,8,0,0,1-8,8H204.94l-37.78,75.58A8,8,0,0,1,160,216h-.4a8,8,0,0,1-7.08-5.14L95.350,60.76,63.28,131.31A8,8,0,0,1,56,136H24a8,8,0,0,1,0-16H50.85L88.72,36.69a8,8,0,0,1,14.76.46l57.51,151,31.85-63.71A8,8,0,0,1,200,120h32A8,8,0,0,1,240,128Z',
  courses: 'M231.65,194.55,198.46,36.75a16,16,0,0,0-19-12.39L132.65,34.42a16.08,16.08,0,0,0-12.3,19l33.19,157.8A16,16,0,0,0,169.16,224a16.250,16.250,0,0,0,3.38-.36l46.81-10.06A16.09,16.09,0,0,0,231.65,194.55ZM136,50.15c0-.06,0-.09,0-.09l46.8-10,3.33,15.87L139.33,66Zm6.62,31.47,46.82-10.05,3.34,15.9L146,97.53Zm6.64,31.57,46.82-10.06,13.3,63.24-46.82,10.06ZM216,197.94l-46.8,10-3.33-15.87L212.67,182,216,197.85C216,197.91,216,197.94,216,197.94ZM104,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V48A16,16,0,0,0,104,32ZM56,48h48V64H56Zm0,32h48v96H56Zm48,128H56V192h48v16Z',
  stats: 'M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z',
  log: 'M184,112a8,8,0,0,1-8,8H112a8,8,0,0,1,0-16h64A8,8,0,0,1,184,112Zm-8,24H112a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16Zm48-88V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H208A16,16,0,0,1,224,48ZM48,208H72V48H48Zm160,0V48H88V208H208Z',
  gear: 'M128,80a48,48,0,1,0,48,48A48.050,48.050,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm109.94-52.79a8,8,0,0,0-3.89-5.4l-29.83-17-.12-33.62a8,8,0,0,0-2.83-6.08,111.910,111.910,0,0,0-36.72-20.67,8,8,0,0,0-6.46.59L128,41.85,97.88,25a8,8,0,0,0-6.47-.6A112.100,112.100,0,0,0,54.73,45.15a8,8,0,0,0-2.83,6.07l-.15,33.65-29.83,17a8,8,0,0,0-3.89,5.4,106.470,106.470,0,0,0,0,41.56,8,8,0,0,0,3.89,5.4l29.830,17,.12,33.62a8,8,0,0,0,2.83,6.08,111.910,111.910,0,0,0,36.72,20.67,8,8,0,0,0,6.46-.59L128,214.150,158.12,231a7.910,7.910,0,0,0,3.9,1,8.090,8.090,0,0,0,2.57-.42,112.100,112.100,0,0,0,36.68-20.73,8,8,0,0,0,2.83-6.07l.15-33.65,29.83-17a8,8,0,0,0,3.89-5.4A106.470,106.470,0,0,0,237.94,107.21Zm-15,34.91-28.57,16.25a8,8,0,0,0-3,3c-.58,1-1.19,2.06-1.81,3.06a7.940,7.940,0,0,0-1.22,4.21l-.15,32.25a95.890,95.890,0,0,1-25.37,14.3L134,199.13a8,8,0,0,0-3.91-1h-.19c-1.21,0-2.43,0-3.64,0a8.080,8.080,0,0,0-4.1,1l-28.84,16.1A96,96,0,0,1,67.88,201l-.11-32.2a8,8,0,0,0-1.22-4.22c-.62-1-1.23-2-1.8-3.06a8.090,8.090,0,0,0-3-3.06l-28.6-16.29a90.490,90.490,0,0,1,0-28.26L61.67,97.63a8,8,0,0,0,3-3c.58-1,1.19-2.06,1.81-3.06a7.940,7.940,0,0,0,1.22-4.21l.15-32.25a95.890,95.890,0,0,1,25.37-14.3L122,56.87a8,8,0,0,0,4.1,1c1.21,0,2.43,0,3.64,0a8.080,8.080,0,0,0,4.1-1l28.84-16.1A96,96,0,0,1,188.12,55l.11,32.2a8,8,0,0,0,1.22,4.22c.62,1,1.23,2,1.8,3.06a8.090,8.090,0,0,0,3,3.06l28.6,16.29A90.490,90.490,0,0,1,222.9,142.12Z',
};
const TABS = [
  { key: 'today', label: 'Today' },
  { key: 'courses', label: 'Courses' },
  { key: 'stats', label: 'Stats' },
  { key: 'log', label: 'Log' },
];
const SETTING_DEFS = {
  focusMinutes:     { label: 'Focus',             min: 5,   max: 90, step: 5,   fmt: v => v + ' min' },
  breakMinutes:     { label: 'Short break',       min: 1,   max: 30, step: 1,   fmt: v => v + ' min' },
  longBreakMinutes: { label: 'Long break',        min: 5,   max: 60, step: 5,   fmt: v => v + ' min' },
  cyclesBeforeLong: { label: 'Cycles before long break', min: 2, max: 8, step: 1, fmt: v => String(v) },
  dailyTargetHrs:   { label: 'Daily target',      min: 0.5, max: 16, step: 0.5, fmt: v => hm(v * 3600) },
  termWeeks:        { label: 'Term length',       min: 4,   max: 52, step: 1,   fmt: v => v + ' weeks' },
};

// ───────────────────────── small helpers

const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2, '0');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sum = arr => arr.reduce((a, b) => a + b, 0);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function icon(name, size = 22) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;
}
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function startOfWeek(d) { const x = startOfDay(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function dayKey(d) { d = new Date(d); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function parseDay(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
function clockHM(ts) { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
/** "1h 20m" / "45m" / "4h" — hours only when non-zero, minutes zero-padded after an hour. */
function hm(sec) {
  const m = Math.round(sec / 60);
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60), r = m % 60;
  return r ? h + 'h ' + pad(r) + 'm' : h + 'h';
}
/** Whole-hours label for totals: "42h", "3.5h", "0h". */
function hrs(sec) {
  const h = sec / 3600;
  if (h >= 10) return Math.round(h) + 'h';
  return (Math.round(h * 10) / 10) + 'h';
}
function longDate(d) { return WEEKDAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }

// ───────────────────────── persistence

function defaultSettings() {
  return {
    focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLong: 4,
    dailyTargetHrs: 4, termStart: dayKey(startOfWeek(new Date())), termWeeks: 18,
    autoStart: false,       // false: stop at each phase end and wait for the user
    backgroundAudio: true,  // silent audio while running keeps Android from freezing the timer
  };
}
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return {
        courses: Array.isArray(d.courses) ? d.courses : [],
        sessions: Array.isArray(d.sessions) ? d.sessions : [],
        settings: { ...defaultSettings(), ...(d.settings || {}) },
        active: d.active || null,
      };
    }
  } catch (e) { /* fall through to a fresh store */ }
  return { courses: [], sessions: [], settings: defaultSettings(), active: null };
}
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, ...db }));
  } catch (e) {
    toast('Could not save — device storage is full or blocked.');
  }
}

const db = load();
save(); // pins the default term start on first run

// UI-only state (not persisted)
const ui = {
  tab: 'today',
  stack: [],              // pushed views: 'timer' | 'detail' | 'form' | 'session' | 'settings'
  detailId: null,
  sessionId: null,
  form: null,             // { mode, id, code, name, color, goal, error }
  range: 'week',          // stats hours-per-day range
  showAllRecent: false,
  logDays: 30,
  armedDelete: null,
  draft: '',
};

// ───────────────────────── timer engine (wall-clock anchored)

function phaseLen(phase) {
  const s = db.settings;
  return 60 * (phase === 'focus' ? s.focusMinutes : phase === 'break' ? s.breakMinutes : s.longBreakMinutes);
}
function newActive(courseId) {
  return {
    courseId, startedAt: null, phase: 'focus', cycle: 1, running: false,
    remaining: phaseLen('focus'), endsAt: null, stretchStart: null,
    focusBank: 0, pomodoros: 0, interruptions: 0, tasks: [],
  };
}
function remainingNow(a, now = Date.now()) {
  return a.running ? Math.max(0, (a.endsAt - now) / 1000) : a.remaining;
}
function liveFocus(a, now = Date.now()) {
  let f = a.focusBank;
  if (a.running && a.phase === 'focus') f += Math.max(0, (Math.min(now, a.endsAt) - a.stretchStart) / 1000);
  return f;
}
function isPristine(a) {
  return !a.running && a.focusBank === 0 && a.pomodoros === 0 && a.phase === 'focus' && a.cycle === 1 && !a.startedAt;
}
function courseLocked(a) { return liveFocus(a) >= 1 || a.pomodoros > 0; }
function nextPhase(a) {
  if (a.phase === 'focus') return a.cycle >= db.settings.cyclesBeforeLong ? 'long' : 'break';
  return 'focus';
}
function bankStretch(a, until) {
  if (a.running && a.phase === 'focus') {
    a.focusBank += Math.max(0, (Math.min(until, a.endsAt) - a.stretchStart) / 1000);
  }
  a.stretchStart = until;
}
function enterPhase(a, phase, at) {
  if (phase === 'focus') a.cycle = a.phase === 'long' ? 1 : a.cycle + 1;
  a.phase = phase;
  const len = phaseLen(phase);
  if (a.running) { a.stretchStart = at; a.endsAt = at + len * 1000; }
  else { a.remaining = len; a.endsAt = null; }
}
function pauseAt(a, at) {
  bankStretch(a, at);
  a.remaining = Math.max(0, (a.endsAt - at) / 1000);
  a.running = false;
  a.endsAt = null;
}
/** Advance through every phase boundary that has passed. Returns the transitions made. */
function advance(a, now, catchingUp) {
  const transitions = [];
  let guard = 0;
  while (a.running && now >= a.endsAt && guard++ < 500) {
    const end = a.endsAt;
    bankStretch(a, end);
    const was = a.phase;
    if (was === 'focus') {
      a.pomodoros++;
      const t = a.tasks.find(t => !t.done);
      if (t) t.pomodoros++;
    }
    enterPhase(a, nextPhase(a), end);
    transitions.push({ from: was, to: a.phase });
    // Without auto-start, every phase end waits for the user. With it, still stop
    // after a full set when the app was away rather than logging hours nobody saw.
    if (!db.settings.autoStart || (catchingUp && was === 'long')) {
      pauseAt(a, end);
      a.awaiting = true;
    }
  }
  return transitions;
}

// ───────────────────────── derived data

function courseById(id) {
  return db.courses.find(c => c.id === id) || { id, code: 'Removed course', name: '', color: 'var(--color-neutral-600)', weeklyGoalHrs: 0, archived: true };
}
function activeCourses() { return db.courses.filter(c => !c.archived); }
/** All sessions plus the live, unsaved one (so today's totals move while the timer runs). */
function allSessions(now = Date.now()) {
  const list = db.sessions.slice();
  const a = db.active;
  if (a && a.startedAt) {
    const f = liveFocus(a, now);
    if (f >= 1) list.push({ id: 'live', live: true, courseId: a.courseId, startedAt: a.startedAt, endedAt: now, focusSeconds: f, pomodoros: a.pomodoros, interruptions: a.interruptions });
  }
  return list;
}
function byDay(sessions, courseId) {
  const m = new Map();
  for (const s of sessions) {
    if (courseId && s.courseId !== courseId) continue;
    const k = dayKey(s.startedAt);
    m.set(k, (m.get(k) || 0) + s.focusSeconds);
  }
  return m;
}
function termStartDate() { return startOfWeek(parseDay(db.settings.termStart)); }
function termWeek(now = new Date()) {
  return Math.floor((startOfDay(now) - termStartDate()) / (7 * DAY_MS)) + 1;
}
function weekDays(now = new Date()) {
  const mon = startOfWeek(now);
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}
function sessionMeta(s, withTime) {
  const parts = [];
  if (withTime) parts.push(clockHM(s.startedAt) + ' – ' + clockHM(s.endedAt));
  parts.push(plural(s.pomodoros || 0, 'pomodoro'));
  if (s.interruptions) parts.push(plural(s.interruptions, 'interruption'));
  return parts.join(' · ');
}

// ───────────────────────── views

function viewToday() {
  const now = new Date();
  const sessions = allSessions();
  const todayK = dayKey(now);
  const today = sessions.filter(s => dayKey(s.startedAt) === todayK);
  const perCourse = new Map();
  for (const s of today) perCourse.set(s.courseId, (perCourse.get(s.courseId) || 0) + s.focusSeconds);
  const split = [...perCourse].sort((a, b) => b[1] - a[1]);
  const total = sum(split.map(x => x[1]));
  const wk = termWeek(now);
  const weekPill = wk >= 1 && wk <= db.settings.termWeeks ? 'Week ' + wk : 'Settings';
  const a = db.active;
  const actionLabel = a && !isPristine(a)
    ? (a.running ? 'Return to session · ' : 'Resume session · ') + hm(liveFocus(a))
    : 'Start focus session';
  const weekStart = startOfWeek(now).getTime();
  const courses = activeCourses();

  let hero;
  if (total < 60) {
    hero = `<div class="empty" style="margin:4px 0 22px">No sessions yet today.</div>`;
  } else {
    hero = `
      <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:6px">
        <div class="num" style="font-size:46px;line-height:1;letter-spacing:-.02em">${hm(total)}</div>
        <div style="font-size:12px;color:var(--color-neutral-400);padding-bottom:6px">of ${hm(db.settings.dailyTargetHrs * 3600)} target</div>
      </div>
      <div style="display:flex;height:6px;border-radius:3px;overflow:hidden;gap:2px;margin:12px 0 8px">
        ${split.map(([id, sec]) => `<div style="width:${(sec / total) * 100}%;background:${courseById(id).color}"></div>`).join('')}
      </div>
      <div style="display:flex;flex-wrap:wrap;column-gap:14px;row-gap:2px;font-size:11px;color:var(--color-neutral-400);margin-bottom:22px">
        ${split.map(([id, sec]) => `<span>${esc(courseById(id).code)} · ${hm(sec)}</span>`).join('')}
      </div>`;
  }

  const rows = courses.map(c => {
    const week = sum(sessions.filter(s => s.courseId === c.id && s.startedAt >= weekStart).map(s => s.focusSeconds));
    const pct = c.weeklyGoalHrs ? Math.min(100, (week / (c.weeklyGoalHrs * 3600)) * 100) : 0;
    return `
      <div class="card elev-sm press" style="gap:8px;padding:12px" data-act="openDetail" data-id="${c.id}">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="dot" style="width:8px;height:8px;background:${c.color}"></div>
          <div style="flex:1;min-width:0">
            <div class="num" style="font-size:14px">${esc(c.code)}</div>
            <div class="ellipsis" style="font-size:11px;color:var(--color-neutral-500)">${esc(c.name)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:13px">${hm(week)}</div>
            <div style="font-size:11px;color:var(--color-neutral-500)">/ ${hm(c.weeklyGoalHrs * 3600)}</div>
          </div>
        </div>
        <div style="height:3px;border-radius:2px;background:var(--color-neutral-800);overflow:hidden">
          <div style="height:100%;background:${c.color};width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="screen">
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:18px">
        <div>
          <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent)">${longDate(now)}</div>
          <h4 style="margin:4px 0 0;font-size:20px">Today</h4>
        </div>
        <button class="btn btn-secondary" style="min-height:36px;font-size:12px;white-space:nowrap;flex:none" data-act="push" data-view="settings" aria-label="${weekPill}, open settings">${icon('gear', 14)}${weekPill}</button>
      </div>
      ${hero}
      <button class="btn btn-primary btn-block" style="min-height:48px;font-size:15px;margin-bottom:22px" data-act="openTimer">${actionLabel}</button>
      <div class="row-between" style="margin-bottom:10px">
        <h6 style="margin:0;color:var(--color-neutral-400)">This week by course</h6>
        <span style="font-size:11px;color:var(--color-neutral-500)">goal</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${rows || `<div class="empty">No courses yet. Add one to start tracking.</div>
          <button class="btn btn-secondary btn-block" style="min-height:44px" data-act="openAdd">+ Add course</button>`}
      </div>
    </div>`;
}

function viewCourses() {
  const sessions = allSessions();
  const days = weekDays();
  const card = c => {
    const mine = sessions.filter(s => s.courseId === c.id);
    const total = sum(mine.map(s => s.focusSeconds));
    const perDay = byDay(mine);
    const vals = days.map(d => perDay.get(dayKey(d)) || 0);
    const max = Math.max(7200, ...vals);
    return `
      <div class="card elev-sm press" style="padding:14px;gap:12px;${c.archived ? 'opacity:.55' : ''}" data-act="openDetail" data-id="${c.id}">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
              <div class="dot" style="width:8px;height:8px;background:${c.color}"></div>
              <span class="num" style="font-size:15px">${esc(c.code)}</span>
              ${c.archived ? '<span class="tag tag-neutral" style="padding:1px 7px;font-size:10px">Archived</span>' : ''}
            </div>
            <div class="ellipsis" style="font-size:12px;color:var(--color-neutral-400)">${esc(c.name)}</div>
            <div style="font-size:11px;color:var(--color-neutral-500);margin-top:6px">${hrs(total)} total · ${plural(mine.length, 'session')}</div>
          </div>
          <div style="display:flex;align-items:flex-end;gap:2px;height:34px" aria-hidden="true">
            ${vals.map(v => `<div style="width:5px;border-radius:1px;background:${v ? c.color : 'var(--color-neutral-800)'};height:${v ? Math.max(4, Math.round((v / max) * 34)) : 3}px"></div>`).join('')}
          </div>
        </div>
      </div>`;
  };
  const list = [...activeCourses(), ...db.courses.filter(c => c.archived)];
  return `
    <div class="screen">
      <div class="row-between" style="margin-bottom:18px">
        <h4 style="margin:0;font-size:20px">Courses</h4>
        <button class="btn btn-primary" style="min-height:36px;font-size:12px" data-act="openAdd">+ Add</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${list.map(card).join('') || '<div class="empty">No courses yet.</div>'}
      </div>
    </div>`;
}

function viewDetail() {
  const c = courseById(ui.detailId);
  const sessions = allSessions().filter(s => s.courseId === c.id).sort((a, b) => b.startedAt - a.startedAt);
  const weekStart = startOfWeek(new Date()).getTime();
  const week = sum(sessions.filter(s => s.startedAt >= weekStart).map(s => s.focusSeconds));
  const total = sum(sessions.map(s => s.focusSeconds));
  const avg = sessions.length ? total / sessions.length : 0;
  const ints = sum(sessions.map(s => s.interruptions || 0));
  const perDay = byDay(sessions);
  const vals = weekDays().map(d => perDay.get(dayKey(d)) || 0);
  const max = Math.max(7200, ...vals);
  const shown = ui.showAllRecent ? sessions : sessions.slice(0, 10);
  const stat = (label, value) => `
    <div class="card elev-sm" style="padding:12px;gap:2px">
      <div class="label-sm">${label}</div>
      <div class="num" style="font-size:22px">${value}</div>
    </div>`;
  return `
    <div class="screen push-in">
      <div class="row-between" style="margin-bottom:8px">
        <button class="btn btn-ghost" style="min-height:40px;font-size:13px" data-act="back">← Courses</button>
        <button class="btn btn-ghost" style="min-height:40px;font-size:13px" data-act="openEdit" data-id="${c.id}">Edit</button>
      </div>
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:2px">
        <div class="dot" style="width:10px;height:10px;background:${c.color}"></div>
        <h4 style="margin:0;font-size:22px">${esc(c.code)}</h4>
      </div>
      <div style="font-size:13px;color:var(--color-neutral-400);margin-bottom:18px">${esc(c.name)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px">
        ${stat('This week', hm(week))}
        ${stat('Total', hrs(total))}
        ${stat('Avg session', sessions.length ? hm(avg) : '—')}
        ${stat('Interruptions', ints)}
      </div>
      <h6 style="margin:0 0 10px;color:var(--color-neutral-400)">This week</h6>
      <div class="bars" style="gap:6px;height:104px;margin-bottom:6px">
        ${vals.map((v, i) => `
          <div class="bar-col">
            <div class="bar" style="background:${v ? c.color : 'var(--color-neutral-800)'};height:${v ? Math.max(4, Math.round((v / max) * 86)) : 3}px"></div>
            <div class="bar-label">${DAY_INITIALS[i]}</div>
          </div>`).join('')}
      </div>
      <div class="fade-rule" style="margin:16px 0 14px"></div>
      <h6 style="margin:0 0 10px;color:var(--color-neutral-400)">Recent sessions</h6>
      <div style="display:flex;flex-direction:column">
        ${shown.map(s => {
          const d = new Date(s.startedAt);
          return `
          <div class="list-row ${s.live ? '' : 'press'}" ${s.live ? '' : `data-act="openSession" data-id="${s.id}"`} style="gap:12px;padding:10px 2px">
            <div style="flex:1;min-width:0">
              <div style="font-size:13px">${WEEKDAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${clockHM(s.startedAt)} – ${s.live ? 'now' : clockHM(s.endedAt)}</div>
              <div style="font-size:11px;color:var(--color-neutral-500)">${sessionMeta(s, false)}${s.interruptions ? '' : ' · 0 interruptions'}</div>
            </div>
            <div class="num" style="font-size:14px">${hm(s.focusSeconds)}</div>
          </div>`;
        }).join('') || '<div class="empty">No sessions for this course yet.</div>'}
      </div>
      ${sessions.length > 10 && !ui.showAllRecent ? `<button class="btn btn-ghost" style="min-height:44px;font-size:13px;margin-top:6px" data-act="seeAllRecent">See all ${sessions.length}</button>` : ''}
      <div class="fade-rule"></div>
      <button class="btn btn-secondary btn-block" style="min-height:44px;font-size:13px" data-act="toggleArchive" data-id="${c.id}">${c.archived ? 'Restore course' : 'Archive course'}</button>
      <p style="font-size:11px;color:var(--color-neutral-500);margin-top:10px">${c.archived ? 'Archived courses are hidden from Today and the timer. Their sessions still count in Stats.' : 'Archiving hides the course from Today and the timer. Its sessions stay in Stats and the Log.'}</p>
    </div>`;
}

function viewForm() {
  const f = ui.form;
  const goalMax = 16;
  return `
    <div class="screen push-in">
      <button class="btn btn-ghost" style="min-height:40px;font-size:13px;margin-bottom:8px" data-act="back">← Cancel</button>
      <h4 style="margin:0 0 18px;font-size:20px">${f.mode === 'edit' ? 'Edit course' : 'Add course'}</h4>
      <div class="field" style="margin-bottom:14px">
        <label for="f-code">Course code</label>
        <input id="f-code" class="input" placeholder="CHEM 150" autocomplete="off" autocapitalize="characters" value="${esc(f.code)}" data-model="form.code" data-enter="submitForm">
        ${f.error ? `<div class="field-error">${esc(f.error)}</div>` : ''}
      </div>
      <div class="field" style="margin-bottom:14px">
        <label for="f-name">Course name</label>
        <input id="f-name" class="input" placeholder="Organic Chemistry I" autocomplete="off" value="${esc(f.name)}" data-model="form.name" data-enter="submitForm">
      </div>
      <div class="field" style="margin-bottom:16px">
        <label>Colour</label>
        <div style="display:flex;gap:10px;margin-top:4px">
          ${COURSE_COLORS.map(col => `<button class="swatch" aria-label="Colour ${col}" aria-pressed="${f.color === col}" style="background:${col};box-shadow:${f.color === col ? '0 0 0 2px var(--color-bg), 0 0 0 4px ' + col : 'none'}" data-act="pickColor" data-color="${col}"></button>`).join('')}
        </div>
      </div>
      <div class="field" style="margin-bottom:20px">
        <label>Weekly goal · ${hm(f.goal * 3600)}</label>
        <div style="display:flex;align-items:center;gap:10px;margin-top:6px">
          <button class="btn btn-secondary btn-icon" style="width:44px;height:44px;font-size:18px" data-act="goal" data-d="-0.5" aria-label="Less">−</button>
          <div style="flex:1;height:4px;border-radius:2px;background:var(--color-neutral-800);overflow:hidden">
            <div style="height:100%;background:var(--color-accent);width:${(f.goal / goalMax) * 100}%"></div>
          </div>
          <button class="btn btn-secondary btn-icon" style="width:44px;height:44px;font-size:18px" data-act="goal" data-d="0.5" aria-label="More">+</button>
        </div>
      </div>
      <button class="btn btn-primary btn-block" style="min-height:48px;font-size:15px" data-act="submitForm">${f.mode === 'edit' ? 'Save changes' : 'Add course'}</button>
      <p style="font-size:11px;color:var(--color-neutral-500);margin-top:12px">Sessions started from the timer are filed under the course you pick there.</p>
    </div>`;
}

function viewTimer() {
  const a = db.active;
  const c = courseById(a.courseId);
  const locked = courseLocked(a);
  const phaseNames = { focus: 'Focus', break: 'Short break', long: 'Long break' };
  const ringColor = a.phase === 'focus' ? 'var(--color-accent)' : 'var(--color-accent-2-400)';
  const done = a.tasks.filter(t => t.done).length;
  const chips = activeCourses().concat(c.archived && db.courses.includes(c) ? [c] : []);
  return `
    <div class="screen push-in" style="display:flex;flex-direction:column">
      <div class="row-between" style="margin-bottom:6px">
        <button class="btn btn-ghost" style="min-height:40px;font-size:13px;white-space:nowrap;flex:none" data-act="back">← Today</button>
        <span style="font-size:11px;color:var(--color-neutral-500)">Cycle ${a.cycle} of ${db.settings.cyclesBeforeLong}</span>
      </div>
      <div class="chips" role="radiogroup" aria-label="Course">
        ${chips.map(x => {
          const sel = x.id === a.courseId;
          return `<button class="chip" role="radio" aria-checked="${sel}" ${!sel && locked ? 'disabled' : ''} style="${sel ? `color:${x.color};box-shadow:inset 0 0 0 1px ${x.color}` : ''}" data-act="pickCourse" data-id="${x.id}">${esc(x.code)}</button>`;
        }).join('')}
      </div>
      ${locked ? '<div style="font-size:11px;color:var(--color-neutral-500);margin:-6px 0 4px">Course is fixed once focus time is logged. End the session to switch.</div>' : ''}
      <div style="display:flex;flex-direction:column;align-items:center;padding:10px 0 4px">
        <div class="ring-wrap">
          <svg width="236" height="236" viewBox="0 0 236 236" aria-hidden="true">
            <circle cx="118" cy="118" r="104" fill="none" stroke="#292b31" stroke-width="10"></circle>
            <circle id="t-ring" cx="118" cy="118" r="104" fill="none" stroke="${ringColor}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C}"></circle>
          </svg>
          <div class="ring-center">
            <div class="phase-label ${a.running ? 'breathe' : ''}" style="color:${ringColor}">${phaseNames[a.phase]}</div>
            <div class="clock" id="t-clock" role="timer">0:00</div>
            <div class="ellipsis" style="font-size:11px;color:var(--color-neutral-500);max-width:180px">${esc(c.name || c.code)}</div>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin:18px 0 10px">
        <button class="btn btn-primary" style="flex:1;min-height:48px;font-size:15px" data-act="toggleTimer">${toggleLabel(a)}</button>
        <button class="btn btn-secondary" style="min-height:48px;font-size:13px;padding:0 14px" data-act="skip">Skip</button>
      </div>
      ${a.awaiting ? `<div style="font-size:12px;color:var(--color-accent-300);margin:-2px 0 10px">${a.phase === 'focus' ? 'Break over. Start focusing when you are ready.' : 'Focus phase done. Start your ' + PHASE_WORD[a.phase] + ' when you are ready, or skip it.'}</div>` : ''}
      <button class="btn btn-secondary btn-block" style="min-height:44px;font-size:13px" data-act="interrupt">Log interruption · ${a.interruptions}</button>
      <div class="fade-rule" style="margin:20px 0 14px"></div>
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px">
        <h6 style="margin:0;color:var(--color-neutral-400)">Tasks this session</h6>
        <span style="font-size:11px;color:var(--color-neutral-500)">${a.tasks.length ? done + ' of ' + a.tasks.length + ' done' : ''}</span>
      </div>
      <div style="display:flex;flex-direction:column">
        ${a.tasks.map((t, i) => `
          <div class="list-row press" role="checkbox" aria-checked="${t.done}" data-act="toggleTask" data-i="${i}">
            <div class="check" style="background:${t.done ? 'var(--color-accent)' : 'transparent'};box-shadow:${t.done ? 'none' : 'inset 0 0 0 1.5px var(--color-neutral-600)'}"></div>
            <span style="flex:1;font-size:13px;color:${t.done ? 'var(--color-neutral-500)' : 'var(--color-text)'};text-decoration:${t.done ? 'line-through' : 'none'}">${esc(t.label)}</span>
            <span style="font-size:11px;color:var(--color-neutral-500)">${t.pomodoros ? plural(t.pomodoros, 'pomo') : '—'}</span>
          </div>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <input id="t-draft" class="input" style="flex:1" placeholder="Add a task" autocomplete="off" enterkeyhint="done" value="${esc(ui.draft)}" data-model="draft" data-enter="addTask">
        <button class="btn btn-secondary" style="min-height:44px;padding:0 14px" data-act="addTask">Add</button>
      </div>
      <div style="flex:1"></div>
      <button class="btn btn-secondary btn-block" id="t-end" style="min-height:44px;font-size:13px;margin-top:18px" data-act="endSession">End session</button>
    </div>`;
}

function toggleLabel(a) {
  if (a.running) return 'Pause';
  if (isPristine(a)) return 'Start';
  if (a.remaining >= phaseLen(a.phase)) return 'Start ' + PHASE_WORD[a.phase];
  return 'Resume';
}

function updateTimerDom() {
  const a = db.active;
  if (!a || currentView() !== 'timer') return;
  const rem = Math.ceil(remainingNow(a));
  const len = phaseLen(a.phase);
  const clock = $('#t-clock'), ring = $('#t-ring'), end = $('#t-end');
  if (clock) clock.textContent = Math.floor(rem / 60) + ':' + pad(rem % 60);
  if (ring) ring.setAttribute('stroke-dashoffset', String(RING_C * (1 - clamp((len - remainingNow(a)) / len, 0, 1))));
  if (end) end.textContent = 'End session · ' + hm(liveFocus(a)) + ' logged';
}

function viewStats() {
  const now = new Date();
  const sessions = allSessions();
  const perDay = byDay(sessions);
  const termStart = termStartDate().getTime();
  const termSessions = sessions.filter(s => s.startedAt >= termStart);
  const termTotal = sum(termSessions.map(s => s.focusSeconds));

  // streak: consecutive days with focus, ending today (or yesterday if today is still empty)
  let streak = 0;
  let d = startOfDay(now);
  if (!(perDay.get(dayKey(d)) >= 60)) d = addDays(d, -1);
  while ((perDay.get(dayKey(d)) || 0) >= 60) { streak++; d = addDays(d, -1); }

  // hours per day
  let days, labels;
  if (ui.range === 'week') {
    days = weekDays(now);
    labels = DAY_INITIALS;
  } else {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const n = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    days = Array.from({ length: n }, (_, i) => addDays(first, i));
    labels = days.map(x => [1, 8, 15, 22, 29].includes(x.getDate()) ? String(x.getDate()) : '');
  }
  const todayK = dayKey(now);
  const dayVals = days.map(x => perDay.get(dayKey(x)) || 0);
  const dayMax = Math.max(3600, ...dayVals);
  const barsHtml = days.map((x, i) => {
    const v = dayVals[i], isToday = dayKey(x) === todayK;
    return `
      <div class="bar-col">
        <div class="bar" style="background:${!v ? 'var(--color-neutral-800)' : isToday ? 'var(--color-accent-500)' : 'var(--color-accent-600)'};height:${v ? Math.max(4, Math.round((v / dayMax) * 90)) : 3}px${ui.range === 'month' ? ';border-radius:2px 2px 0 0' : ''}"></div>
        <div class="bar-label" style="${isToday ? 'color:var(--color-accent)' : ''}">${labels[i]}</div>
      </div>`;
  }).join('');
  const rangeTotal = sum(dayVals);

  // course split · term
  const split = new Map();
  for (const s of termSessions) split.set(s.courseId, (split.get(s.courseId) || 0) + s.focusSeconds);
  const splitArr = [...split].sort((a, b) => b[1] - a[1]);
  const C = 2 * Math.PI * 44;
  let cum = 0;
  const arcs = splitArr.map(([id, sec]) => {
    const frac = sec / (termTotal || 1);
    const gap = splitArr.length > 1 ? 2 : 0;
    const len = Math.max(0.5, frac * C - gap);
    const out = `<circle cx="54" cy="54" r="44" fill="none" stroke="${courseById(id).color}" stroke-width="13" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-cum * C).toFixed(2)}"></circle>`;
    cum += frac;
    return out;
  }).join('');

  // when you study — distribute each session's focus across the hours it spans
  const buckets = new Array(24).fill(0);
  for (const s of termSessions) {
    const span = Math.max(1, s.endedAt - s.startedAt);
    let t = s.startedAt;
    while (t < s.endedAt) {
      const hourEnd = new Date(t); hourEnd.setMinutes(60, 0, 0);
      const seg = Math.min(hourEnd.getTime(), s.endedAt) - t;
      buckets[new Date(t).getHours()] += s.focusSeconds * (seg / span);
      t += seg;
    }
    if (s.endedAt <= s.startedAt) buckets[new Date(s.startedAt).getHours()] += s.focusSeconds;
  }
  const bMax = Math.max(...buckets);
  const W = 364;
  const pts = buckets.map((v, h) => [((h + 0.5) / 24) * W, 92 - (bMax ? (v / bMax) * 82 : 0)]);
  const line = 'M0 ' + pts[0][1].toFixed(1) + ' ' + pts.map(p => 'L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ') + ' L' + W + ' ' + pts[23][1].toFixed(1);
  const peaks = (() => {
    if (!bMax) return 'Not enough sessions yet to show a pattern.';
    const win = buckets.map((v, h) => v + buckets[(h + 1) % 24]);
    const order = win.map((v, h) => [v, h]).sort((a, b) => b[0] - a[0]);
    const first = order[0];
    const second = order.find(([v, h]) => v > 0 && Math.min(Math.abs(h - first[1]), 24 - Math.abs(h - first[1])) >= 3 && v >= first[0] * 0.5);
    const fmt = h => pad(h) + ':00–' + pad((h + 2) % 24) + ':00';
    const ws = [first[1], second && second[1]].filter(x => x !== undefined).sort((a, b) => a - b);
    return 'Peak focus ' + ws.map(fmt).join(' and ');
  })();

  // cumulative hours · term
  const weeksSoFar = clamp(termWeek(now), 1, db.settings.termWeeks);
  const weeklyGoal = sum(activeCourses().map(c => c.weeklyGoalHrs || 0)) * 3600;
  const actualPts = [0], targetPts = [0];
  for (let w = 1; w <= weeksSoFar; w++) {
    const end = Math.min(termStart + w * 7 * DAY_MS, Date.now());
    actualPts.push(sum(termSessions.filter(s => s.startedAt < end).map(s => s.focusSeconds)));
    targetPts.push(weeklyGoal * w);
  }
  const cMax = Math.max(3600, ...actualPts, ...targetPts);
  const toPath = arr => arr.map((v, i) => (i ? 'L' : 'M') + ((i / (arr.length - 1)) * W).toFixed(1) + ' ' + (100 - (v / cMax) * 96).toFixed(1)).join(' ');

  // heatmap — last 18 weeks, Monday rows first
  const heatStart = addDays(startOfWeek(now), -17 * 7);
  const cells = [];
  for (let i = 0; i < 18 * 7; i++) { const x = addDays(heatStart, i); cells.push({ k: dayKey(x), future: x > now, v: perDay.get(dayKey(x)) || 0 }); }
  const nz = cells.filter(x => x.v > 0).map(x => x.v).sort((a, b) => a - b);
  const q = p => nz.length ? nz[Math.min(nz.length - 1, Math.floor(p * nz.length))] : Infinity;
  const th = [q(0.25), q(0.5), q(0.75)];
  const level = v => !v ? 0 : v >= th[2] ? 4 : v >= th[1] ? 3 : v >= th[0] ? 2 : 1;
  let heat = '';
  for (let w = 0; w < 18; w++) {
    heat += '<div class="heat-col">';
    for (let dd = 0; dd < 7; dd++) {
      const cell = cells[w * 7 + dd];
      heat += `<div class="heat-cell" style="background:${HEAT_STEPS[level(cell.v)]}${cell.future ? ';opacity:.35' : ''}"></div>`;
    }
    heat += '</div>';
  }

  const card = (label, value) => `
    <div class="card elev-sm" style="flex:1;padding:12px;gap:2px">
      <div class="label-sm">${label}</div>
      <div class="num" style="font-size:24px">${value}</div>
    </div>`;

  return `
    <div class="screen">
      <h4 style="margin:0 0 14px;font-size:20px">Stats</h4>
      <div style="display:flex;gap:8px;margin-bottom:20px">
        ${card('Term total', hrs(termTotal))}
        ${card('Streak', plural(streak, 'day'))}
      </div>

      <div class="row-between" style="margin-bottom:10px">
        <h6 style="margin:0;color:var(--color-neutral-400)">Hours per day</h6>
        <div class="seg" role="radiogroup" aria-label="Range">
          <label class="seg-opt"><input type="radio" name="range" value="week" data-change="range" ${ui.range === 'week' ? 'checked' : ''}><span>Week</span></label>
          <label class="seg-opt"><input type="radio" name="range" value="month" data-change="range" ${ui.range === 'month' ? 'checked' : ''}><span>Month</span></label>
        </div>
      </div>
      <div class="bars" style="gap:${ui.range === 'week' ? 7 : 2}px;height:112px">${barsHtml}</div>
      <div style="font-size:11px;color:var(--color-neutral-500);margin-top:8px">${ui.range === 'week' ? 'This week' : MONTHS[now.getMonth()] + ' ' + now.getFullYear()} · ${hm(rangeTotal)}</div>

      <div class="fade-rule"></div>
      <h6 style="margin:0 0 10px;color:var(--color-neutral-400)">Course split · term</h6>
      ${splitArr.length ? `
      <div style="display:flex;align-items:center;gap:18px;margin-bottom:4px">
        <svg width="108" height="108" viewBox="0 0 108 108" style="flex:none;transform:rotate(-90deg)" aria-hidden="true">
          <circle cx="54" cy="54" r="44" fill="none" stroke="#292b31" stroke-width="13"></circle>
          ${arcs}
        </svg>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:7px">
          ${splitArr.map(([id, sec]) => `<div style="display:flex;align-items:center;gap:8px;font-size:12px"><span class="dot" style="width:7px;height:7px;background:${courseById(id).color}"></span><span class="ellipsis" style="flex:1">${esc(courseById(id).code)}</span><span style="color:var(--color-neutral-400)">${hrs(sec)}</span></div>`).join('')}
        </div>
      </div>` : '<div class="empty">No sessions this term yet.</div>'}

      <div class="fade-rule"></div>
      <h6 style="margin:0 0 4px;color:var(--color-neutral-400)">When you study</h6>
      <div style="font-size:11px;color:var(--color-neutral-500);margin-bottom:10px">${peaks}</div>
      <svg width="100%" height="96" viewBox="0 0 364 96" preserveAspectRatio="none" style="display:block" aria-hidden="true">
        <path d="${line} L364 96 L0 96 Z" fill="#2b2741"></path>
        <path d="${line}" fill="none" stroke="#968ae0" stroke-width="2" vector-effect="non-scaling-stroke"></path>
      </svg>
      <div class="axis">
        ${[6, 10, 14, 18, 22].map(h => `<span style="left:${(h / 24) * 100}%">${h <= 12 ? h + 'a' : (h - 12) + 'p'}</span>`).join('')}
      </div>

      <div class="fade-rule"></div>
      <h6 style="margin:0 0 10px;color:var(--color-neutral-400)">Cumulative hours · term</h6>
      <svg width="100%" height="104" viewBox="0 0 364 104" preserveAspectRatio="none" style="display:block" aria-hidden="true">
        <path d="${toPath(targetPts)}" fill="none" stroke="#595d6c" stroke-width="1.5" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"></path>
        <path d="${toPath(actualPts)}" fill="none" stroke="#b5abfc" stroke-width="2.5" vector-effect="non-scaling-stroke"></path>
      </svg>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--color-neutral-500);margin-top:6px">
        <span>Actual ${hrs(actualPts[actualPts.length - 1])}</span><span>Target to week ${weeksSoFar} · ${hrs(targetPts[targetPts.length - 1])}</span>
      </div>

      <div class="fade-rule"></div>
      <h6 style="margin:0 0 10px;color:var(--color-neutral-400)">18 weeks</h6>
      <div class="heat" aria-hidden="true">${heat}</div>
      <div style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--color-neutral-500);margin-top:10px">
        <span>less</span>
        ${HEAT_STEPS.map(c => `<span style="width:11px;height:11px;border-radius:2px;background:${c}"></span>`).join('')}
        <span>more</span>
      </div>
    </div>`;
}

function viewLog() {
  const now = new Date();
  const todayK = dayKey(now), yestK = dayKey(addDays(now, -1));
  const sessions = allSessions().sort((a, b) => b.startedAt - a.startedAt);
  const groups = new Map();
  for (const s of sessions) {
    const k = dayKey(s.startedAt);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(s);
  }
  const keys = [...groups.keys()];
  const shown = keys.slice(0, ui.logDays);
  const title = k => {
    const d = parseDay(k);
    const tail = d.getDate() + ' ' + MONTHS[d.getMonth()] + (d.getFullYear() !== now.getFullYear() ? ' ' + d.getFullYear() : '');
    return (k === todayK ? 'Today' : k === yestK ? 'Yesterday' : WEEKDAYS[d.getDay()]) + ' · ' + tail;
  };
  return `
    <div class="screen">
      <h4 style="margin:0 0 16px;font-size:20px">Session log</h4>
      ${shown.map(k => {
        const items = groups.get(k).slice().sort((a, b) => a.startedAt - b.startedAt);
        return `
        <div style="margin-bottom:18px">
          <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px">
            <h6 style="margin:0;color:var(--color-accent)">${title(k)}</h6>
            <span style="font-size:11px;color:var(--color-neutral-500)">${hm(sum(items.map(s => s.focusSeconds)))}</span>
          </div>
          <div style="display:flex;flex-direction:column">
            ${items.map(s => {
              const c = courseById(s.courseId);
              return `
              <div class="list-row ${s.live ? '' : 'press'}" ${s.live ? '' : `data-act="openSession" data-id="${s.id}"`}>
                <div class="dot" style="width:8px;height:8px;background:${c.color}"></div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px">${esc(c.code)}${s.live ? ' <span style="font-size:11px;color:var(--color-accent)">· in progress</span>' : ''}</div>
                  <div class="ellipsis" style="font-size:11px;color:var(--color-neutral-500)">${s.live ? clockHM(s.startedAt) + ' – now · ' + sessionMeta(s, false) : sessionMeta(s, true)}</div>
                </div>
                <div class="num" style="font-size:14px">${hm(s.focusSeconds)}</div>
              </div>`;
            }).join('')}
          </div>
        </div>`;
      }).join('') || '<div class="empty">No sessions logged yet. Start one from Today.</div>'}
      ${keys.length > shown.length ? `<button class="btn btn-secondary btn-block" style="min-height:44px;font-size:13px" data-act="moreLog">Show older days</button>` : ''}
      ${sessions.length ? '<p style="font-size:11px;color:var(--color-neutral-500);margin-top:8px">Tap a session to change its course, adjust its time or delete it.</p>' : ''}
    </div>`;
}

function viewSession() {
  const s = db.sessions.find(x => x.id === ui.sessionId);
  if (!s) return '<div class="screen"><div class="empty">Session not found.</div></div>';
  const c = courseById(s.courseId);
  const d = new Date(s.startedAt);
  const choices = activeCourses().concat(db.courses.includes(c) && c.archived ? [c] : []);
  return `
    <div class="screen push-in">
      <button class="btn btn-ghost" style="min-height:40px;font-size:13px;margin-bottom:8px" data-act="back">← Log</button>
      <h4 style="margin:0 0 4px;font-size:20px">Edit session</h4>
      <div style="font-size:13px;color:var(--color-neutral-400);margin-bottom:18px">${longDate(d)} · ${clockHM(s.startedAt)} – ${clockHM(s.endedAt)}</div>
      <div class="field" style="margin-bottom:16px">
        <label>Course</label>
        <div class="chips" style="flex-wrap:wrap;padding:2px 0">
          ${choices.map(x => {
            const sel = x.id === s.courseId;
            return `<button class="chip" role="radio" aria-checked="${sel}" style="${sel ? `color:${x.color};box-shadow:inset 0 0 0 1px ${x.color}` : ''}" data-act="sessionCourse" data-id="${x.id}">${esc(x.code)}</button>`;
          }).join('')}
        </div>
      </div>
      <div class="field" style="margin-bottom:8px">
        <label>Focus time</label>
        <div class="set-row" style="border:0;padding:0">
          <span class="num" style="font-size:22px">${hm(s.focusSeconds)}</span>
          <div class="stepper">
            <button class="btn btn-secondary btn-icon" data-act="sessionTime" data-d="-300" aria-label="5 minutes less">−</button>
            <span class="set-val" style="min-width:40px;font-size:12px;color:var(--color-neutral-500)">5 min</span>
            <button class="btn btn-secondary btn-icon" data-act="sessionTime" data-d="300" aria-label="5 minutes more">+</button>
          </div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--color-neutral-500);margin-bottom:22px">${sessionMeta(s, false)}${s.tasks && s.tasks.length ? ' · ' + s.tasks.filter(t => t.done).length + ' of ' + plural(s.tasks.length, 'task') + ' done' : ''}</div>
      ${s.tasks && s.tasks.length ? `
        <h6 style="margin:0 0 6px;color:var(--color-neutral-400)">Tasks</h6>
        <div style="display:flex;flex-direction:column;margin-bottom:22px">
          ${s.tasks.map(t => `<div class="list-row"><div class="check" style="background:${t.done ? 'var(--color-accent)' : 'transparent'};box-shadow:${t.done ? 'none' : 'inset 0 0 0 1.5px var(--color-neutral-600)'}"></div><span style="flex:1;font-size:13px;color:${t.done ? 'var(--color-neutral-500)' : 'var(--color-text)'};text-decoration:${t.done ? 'line-through' : 'none'}">${esc(t.label)}</span><span style="font-size:11px;color:var(--color-neutral-500)">${t.pomodoros ? plural(t.pomodoros, 'pomo') : '—'}</span></div>`).join('')}
        </div>` : ''}
      <button class="btn btn-secondary btn-block btn-danger ${ui.armedDelete === s.id ? 'armed' : ''}" style="min-height:44px;font-size:13px" data-act="deleteSession" data-id="${s.id}">${ui.armedDelete === s.id ? 'Tap again to delete' : 'Delete session'}</button>
    </div>`;
}

function notifStatus() {
  if (!('Notification' in window)) return 'Not supported in this browser.';
  if (Notification.permission === 'granted') return 'Allowed. Test plays the alarm and sends a notification in 5 seconds.';
  if (Notification.permission === 'denied') return 'Blocked. Allow them in Chrome: ⋮ → Settings → Site settings → Notifications.';
  return 'Needed for alerts when the app is in the background.';
}
function toggleRow(key, label, hint) {
  const on = !!db.settings[key];
  return `
      <div class="set-row">
        <div><div class="set-label">${label}</div><div class="set-hint">${hint}</div></div>
        <button class="btn ${on ? 'btn-primary' : 'btn-secondary'}" style="min-height:44px;min-width:64px;font-size:13px;flex:none" role="switch" aria-checked="${on}" data-act="toggleSetting" data-key="${key}">${on ? 'On' : 'Off'}</button>
      </div>`;
}

function viewSettings() {
  const s = db.settings;
  const row = (key, hint) => {
    const def = SETTING_DEFS[key];
    return `
      <div class="set-row">
        <div><div class="set-label">${def.label}</div>${hint ? `<div class="set-hint">${hint}</div>` : ''}</div>
        <div class="stepper">
          <button class="btn btn-secondary btn-icon" data-act="setting" data-key="${key}" data-d="-1" aria-label="Decrease" ${s[key] <= def.min ? 'disabled' : ''}>−</button>
          <span class="set-val">${def.fmt(s[key])}</span>
          <button class="btn btn-secondary btn-icon" data-act="setting" data-key="${key}" data-d="1" aria-label="Increase" ${s[key] >= def.max ? 'disabled' : ''}>+</button>
        </div>
      </div>`;
  };
  const wk = termWeek();
  return `
    <div class="screen push-in">
      <button class="btn btn-ghost" style="min-height:40px;font-size:13px;margin-bottom:8px" data-act="back">← Back</button>
      <h4 style="margin:0 0 18px;font-size:20px">Settings</h4>

      <h6 style="margin:0 0 4px;color:var(--color-neutral-400)">Pomodoro</h6>
      ${row('focusMinutes')}${row('breakMinutes')}${row('longBreakMinutes')}${row('cyclesBeforeLong')}
      <div class="fade-rule"></div>

      <h6 style="margin:0 0 4px;color:var(--color-neutral-400)">Alerts</h6>
      ${toggleRow('autoStart', 'Auto-start next phase', s.autoStart ? 'Breaks and focus phases follow on without stopping.' : 'The timer stops at each phase end and waits for you.')}
      ${toggleRow('backgroundAudio', 'Keep timer alive in background', 'Plays silent audio while the timer runs so Android does not freeze it. Adds a media control to your notifications.')}
      <div class="set-row">
        <div><div class="set-label">Notifications</div><div class="set-hint">${notifStatus()}</div></div>
        ${'Notification' in window && Notification.permission === 'default'
          ? '<button class="btn btn-primary" style="min-height:44px;font-size:13px;flex:none" data-act="enableNotifications">Allow</button>'
          : '<button class="btn btn-secondary" style="min-height:44px;font-size:13px;flex:none" data-act="testAlert">Test</button>'}
      </div>
      <div class="fade-rule"></div>

      <h6 style="margin:0 0 4px;color:var(--color-neutral-400)">Targets &amp; term</h6>
      ${row('dailyTargetHrs')}
      <div class="set-row">
        <div><div class="set-label">Term starts</div><div class="set-hint">${wk >= 1 ? 'Now in week ' + wk : 'Term has not started'}</div></div>
        <input type="date" class="input" style="width:auto;flex:none" value="${s.termStart}" data-change="termStart" aria-label="Term start date">
      </div>
      ${row('termWeeks')}
      <div class="fade-rule"></div>

      <h6 style="margin:0 0 8px;color:var(--color-neutral-400)">Data</h6>
      <p style="font-size:12px;color:var(--color-neutral-400)">Everything is stored on this device only — ${plural(db.courses.length, 'course')}, ${plural(db.sessions.length, 'session')}. Clearing the browser's site data or uninstalling the app erases it, so export a backup now and then.</p>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary" style="flex:1;min-height:44px;font-size:13px" data-act="export">Export backup</button>
        <button class="btn btn-secondary" style="flex:1;min-height:44px;font-size:13px" data-act="import">Import backup</button>
      </div>
      <p id="persist-note" style="font-size:11px;color:var(--color-neutral-500);margin-top:10px">${persistNote}</p>
      ${installPrompt ? '<button class="btn btn-primary btn-block" style="min-height:48px;margin-top:10px" data-act="install">Install app</button>' : ''}
    </div>`;
}

// ───────────────────────── navigation (with Android back support)

function currentView() { return ui.stack.length ? ui.stack[ui.stack.length - 1] : 'tab'; }
function push(view) {
  ui.stack.push(view);
  history.pushState({ depth: ui.stack.length }, '');
  render();
}
function back() {
  if (ui.stack.length) history.back();
}
// The history entry depth is the source of truth, so fast taps (back, then a tab)
// cannot leave the view stack and the browser history out of step.
window.addEventListener('popstate', e => {
  const depth = (e.state && e.state.depth) || 0;
  if (ui.stack.length > depth) {
    ui.stack.length = depth;
    ui.armedDelete = null;
    render();
  }
});
function goTab(tab) {
  if (ui.stack.length) {
    history.go(-ui.stack.length);
    ui.stack = [];
  }
  ui.tab = tab;
  ui.armedDelete = null;
  render();
}

// ───────────────────────── actions

const actions = {
  tab: el => goTab(el.dataset.tab),
  push: el => push(el.dataset.view),
  back: () => back(),

  openTimer() {
    const courses = activeCourses();
    if (!courses.length) { toast('Add a course first.'); return actions.openAdd(); }
    if (!db.active) db.active = newActive(courses[0].id);
    const a = db.active;
    if (!db.courses.some(c => c.id === a.courseId && !c.archived) && isPristine(a)) a.courseId = courses[0].id;
    if (isPristine(a)) a.remaining = phaseLen('focus');
    save();
    push('timer');
  },
  openDetail(el) { ui.detailId = el.dataset.id; ui.showAllRecent = false; push('detail'); },
  openAdd() {
    const used = new Set(db.courses.map(c => c.color));
    ui.form = { mode: 'add', id: null, code: '', name: '', color: COURSE_COLORS.find(c => !used.has(c)) || COURSE_COLORS[0], goal: 4, error: '' };
    if (ui.tab !== 'courses' && !ui.stack.length) ui.tab = 'courses';
    push('form');
  },
  openEdit(el) {
    const c = courseById(el.dataset.id);
    ui.form = { mode: 'edit', id: c.id, code: c.code, name: c.name, color: c.color, goal: c.weeklyGoalHrs, error: '' };
    push('form');
  },
  pickColor(el) { ui.form.color = el.dataset.color; render(); },
  goal(el) { ui.form.goal = clamp(ui.form.goal + Number(el.dataset.d), 0.5, 16); render(); },
  submitForm() {
    const f = ui.form;
    const code = f.code.trim().replace(/\s+/g, ' ');
    if (!code) { f.error = 'Enter a course code.'; return render(); }
    const dup = db.courses.find(c => c.code.toLowerCase() === code.toLowerCase() && c.id !== f.id);
    if (dup) { f.error = `${dup.code} already exists${dup.archived ? ' (archived)' : ''}.`; return render(); }
    if (f.mode === 'edit') {
      const c = db.courses.find(x => x.id === f.id);
      Object.assign(c, { code, name: f.name.trim(), color: f.color, weeklyGoalHrs: f.goal });
    } else {
      db.courses.push({ id: uid(), code, name: f.name.trim(), color: f.color, weeklyGoalHrs: f.goal, archived: false, createdAt: Date.now() });
    }
    save();
    toast(f.mode === 'edit' ? 'Course updated.' : code + ' added.');
    back();
  },
  toggleArchive(el) {
    const c = db.courses.find(x => x.id === el.dataset.id);
    if (!c) return;
    if (!c.archived && db.active && db.active.courseId === c.id && !isPristine(db.active)) { toast('End the running session for this course first.'); return; }
    c.archived = !c.archived;
    if (db.active && isPristine(db.active) && db.active.courseId === c.id) db.active = null;
    save();
    render();
  },
  seeAllRecent() { ui.showAllRecent = true; render(); },
  moreLog() { ui.logDays += 30; render(); },

  // timer
  pickCourse(el) {
    const a = db.active;
    if (courseLocked(a) && el.dataset.id !== a.courseId) return;
    a.courseId = el.dataset.id; save(); render();
  },
  toggleTimer() {
    const a = db.active, now = Date.now();
    a.awaiting = false;
    stopAlarmRepeat();
    closePhaseNotifications();
    if (a.running) {
      pauseAt(a, now);
      releaseWakeLock();
      stopKeepAlive();
    } else {
      if (!a.startedAt) a.startedAt = now;
      a.running = true;
      a.stretchStart = now;
      a.endsAt = now + a.remaining * 1000;
      ensureNotificationPermission();
      primeAudio();
      startKeepAlive();
      requestWakeLock();
    }
    save(); render();
  },
  skip() {
    const a = db.active, now = Date.now();
    a.awaiting = false;
    stopAlarmRepeat();
    if (a.running) bankStretch(a, now);
    enterPhase(a, nextPhase(a), now);
    save(); render(); updateMediaSession();
  },
  interrupt() {
    const a = db.active;
    a.interruptions++;
    if (a.running) { pauseAt(a, Date.now()); releaseWakeLock(); stopKeepAlive(); }
    save(); render();
  },
  toggleTask(el) {
    const t = db.active.tasks[Number(el.dataset.i)];
    t.done = !t.done; save(); render();
  },
  addTask() {
    const label = ui.draft.trim();
    if (!label) return;
    db.active.tasks.push({ label, done: false, pomodoros: 0 });
    ui.draft = '';
    save(); render();
    const inp = $('#t-draft'); if (inp) inp.focus();
  },
  endSession() {
    const a = db.active, now = Date.now();
    if (a.running) pauseAt(a, now);
    releaseWakeLock();
    stopAlarmRepeat();
    closePhaseNotifications();
    const focus = Math.round(a.focusBank);
    if (focus >= 1) {
      db.sessions.push({
        id: uid(), courseId: a.courseId, startedAt: a.startedAt, endedAt: now,
        focusSeconds: focus, pomodoros: a.pomodoros, interruptions: a.interruptions,
        tasks: a.tasks.map(t => ({ label: t.label, done: t.done, pomodoros: t.pomodoros })),
      });
      toast(hm(focus) + ' logged to ' + courseById(a.courseId).code + '.');
    } else {
      toast('Nothing logged — no focus time yet.');
    }
    db.active = null;
    ui.draft = '';
    save();
    stopKeepAlive();
    goTab('log');
  },

  // log / session edit
  openSession(el) { ui.sessionId = el.dataset.id; ui.armedDelete = null; push('session'); },
  sessionCourse(el) {
    const s = db.sessions.find(x => x.id === ui.sessionId);
    s.courseId = el.dataset.id; save(); render();
  },
  sessionTime(el) {
    const s = db.sessions.find(x => x.id === ui.sessionId);
    s.focusSeconds = clamp(s.focusSeconds + Number(el.dataset.d), 60, 24 * 3600);
    const span = s.endedAt - s.startedAt;
    if (s.focusSeconds * 1000 > span) s.endedAt = s.startedAt + s.focusSeconds * 1000;
    save(); render();
  },
  deleteSession(el) {
    const id = el.dataset.id;
    if (ui.armedDelete !== id) { ui.armedDelete = id; render(); return; }
    db.sessions = db.sessions.filter(s => s.id !== id);
    ui.armedDelete = null;
    save();
    toast('Session deleted.');
    back();
  },

  // settings
  setting(el) {
    const key = el.dataset.key, def = SETTING_DEFS[key];
    db.settings[key] = clamp(Math.round((db.settings[key] + def.step * Number(el.dataset.d)) * 10) / 10, def.min, def.max);
    if (db.active && isPristine(db.active)) db.active.remaining = phaseLen('focus');
    save(); render();
  },
  toggleSetting(el) {
    const k = el.dataset.key;
    db.settings[k] = !db.settings[k];
    if (k === 'backgroundAudio') {
      if (db.settings[k] && db.active && db.active.running) startKeepAlive(); else if (!db.settings[k]) stopKeepAlive();
    }
    save(); render();
  },
  enableNotifications() {
    Notification.requestPermission().then(() => render()).catch(() => {});
  },
  testAlert() {
    primeAudio();
    toast('Test alert in 5 seconds — you can lock the screen.');
    const wasPlaying = audio.keep && !audio.keep.paused;
    if (!wasPlaying && db.settings.backgroundAudio) {
      if (!audio.keep) { audio.keep = new Audio(silenceUrl()); audio.keep.loop = true; }
      audio.keep.play().catch(() => {});
    }
    setTimeout(() => {
      playAlarm();
      if (document.visibilityState !== 'visible') showPhaseNotification('Test alert', 'Alerts are working.', null);
      else toast('Test alert.');
      if (!wasPlaying && audio.keep && !(db.active && db.active.running)) setTimeout(() => audio.keep.pause(), 4000);
    }, 5000);
  },
  export() {
    const data = JSON.stringify({ app: 'study-tracker', version: 1, exportedAt: new Date().toISOString(), courses: db.courses, sessions: db.sessions, settings: db.settings }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'study-tracker-backup-' + dayKey(new Date()) + '.json';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },
  import() { $('#importFile').click(); },
  async install() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => {});
    installPrompt = null; render();
  },
};

const changes = {
  range(el) { ui.range = el.value; render(); },
  termStart(el) { if (el.value) { db.settings.termStart = el.value; save(); render(); } },
};

// ───────────────────────── rendering

let lastViewKey = '';
function render() {
  const view = currentView();
  const key = view === 'tab' ? 'tab:' + ui.tab : view + ':' + (ui.detailId || '') + (ui.sessionId || '');
  const main = $('#main');
  const scroll = main.scrollTop;
  const focused = document.activeElement && document.activeElement.id;
  const html = view === 'timer' ? (db.active ? viewTimer() : viewToday())
    : view === 'detail' ? viewDetail()
    : view === 'form' ? viewForm()
    : view === 'session' ? viewSession()
    : view === 'settings' ? viewSettings()
    : ui.tab === 'courses' ? viewCourses()
    : ui.tab === 'stats' ? viewStats()
    : ui.tab === 'log' ? viewLog()
    : viewToday();
  main.innerHTML = html;
  if (key === lastViewKey) {
    main.scrollTop = scroll;
    main.querySelectorAll('.push-in').forEach(n => n.classList.remove('push-in'));
  } else {
    main.scrollTop = 0;
  }
  lastViewKey = key;
  if (focused) { const el = document.getElementById(focused); if (el) el.focus({ preventScroll: true }); }

  $('#tabbar').innerHTML = TABS.map(t => `
    <button class="tab" data-act="tab" data-tab="${t.key}" ${view === 'tab' && ui.tab === t.key ? 'aria-current="page"' : ''}>
      ${icon(t.key)}<span>${t.label}</span>
    </button>`).join('');
  updateTimerDom();
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// ───────────────────────── events

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) fn(el, e);
});
document.addEventListener('input', e => {
  const m = e.target.dataset && e.target.dataset.model;
  if (!m) return;
  if (m === 'draft') ui.draft = e.target.value;
  else if (m.startsWith('form.') && ui.form) { ui.form[m.slice(5)] = e.target.value; if (m === 'form.code') ui.form.error = ''; }
});
document.addEventListener('change', e => {
  const c = e.target.dataset && e.target.dataset.change;
  if (c && changes[c]) changes[c](e.target);
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const a = e.target.dataset && e.target.dataset.enter;
  if (a && actions[a]) { e.preventDefault(); actions[a](e.target); }
});
$('#importFile').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const d = JSON.parse(await file.text());
    if (!Array.isArray(d.courses) || !Array.isArray(d.sessions)) throw new Error('shape');
    if (!confirm(`Replace the data on this device with this backup? (${plural(d.courses.length, 'course')}, ${plural(d.sessions.length, 'session')})`)) return;
    db.courses = d.courses;
    db.sessions = d.sessions;
    db.settings = { ...defaultSettings(), ...(d.settings || {}) };
    db.active = null;
    save();
    toast('Backup imported.');
    render();
  } catch (err) {
    toast('That file is not a Study Tracker backup.');
  }
});

// ───────────────────────── ticking, alerts, wake lock

let lastTick = Date.now();
let lastMinute = -1;
function tick() {
  const now = Date.now();
  const a = db.active;
  const catchingUp = now - lastTick > 5000;
  lastTick = now;
  if (!a || !a.running) return;
  const transitions = advance(a, now, catchingUp);
  if (transitions.length) {
    save();
    if (!a.running) releaseWakeLock();
    alertPhase(transitions[transitions.length - 1], a, catchingUp);
    render();
    return;
  }
  const v = currentView();
  if (v === 'timer') updateTimerDom();
  const minute = Math.floor(liveFocus(a, now) / 60);
  if (minute !== lastMinute) {
    lastMinute = minute;
    if (v === 'tab' && (ui.tab === 'today' || ui.tab === 'log')) render();
  }
}
setInterval(tick, 250);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    tick();
    render();
    closePhaseNotifications();
    if (db.active && db.active.running) { requestWakeLock(); startKeepAlive(); }
  }
});

// Audio is generated as WAV blobs so it plays through <audio> elements, which
// Android keeps running in the background (Web Audio gets suspended there).
function wavUrl(samples, rate) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, clamp(samples[i], -1, 1) * 32767, true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}
function silenceUrl() {
  // Near-silent rather than digital zero, so no platform treats it as "not playing".
  const rate = 8000, s = new Float32Array(rate * 6);
  for (let i = 0; i < s.length; i++) s[i] = (i % 2 ? 1 : -1) * 0.00004;
  return wavUrl(s, rate);
}
function alarmUrl() {
  const rate = 22050, len = 3.4, s = new Float32Array(Math.floor(rate * len));
  // three rising two-note chimes
  const notes = [[0, 659], [0.22, 880], [1.1, 659], [1.32, 880], [2.2, 659], [2.42, 988]];
  for (const [at, f] of notes) {
    const start = Math.floor(at * rate), dur = Math.floor(0.9 * rate);
    for (let i = 0; i < dur && start + i < s.length; i++) {
      const t = i / rate;
      const env = Math.min(1, t / 0.01) * Math.exp(-t * 4.5);
      s[start + i] += 0.45 * env * (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t));
    }
  }
  return wavUrl(s, rate);
}
const audio = { keep: null, alarm: null, repeat: null };
function startKeepAlive() {
  if (!db.settings.backgroundAudio) return;
  try {
    if (!audio.keep) { audio.keep = new Audio(silenceUrl()); audio.keep.loop = true; }
    audio.keep.play().catch(() => {});
  } catch (e) {}
  updateMediaSession();
}
function stopKeepAlive() {
  if (audio.keep) audio.keep.pause();
  updateMediaSession();
}
function primeAudio() {
  // Called from a tap so later background playback is allowed.
  try {
    if (!audio.alarm) { audio.alarm = new Audio(alarmUrl()); audio.alarm.preload = 'auto'; }
    audio.alarm.load();
  } catch (e) {}
}
function playAlarm() {
  try {
    if (!audio.alarm) audio.alarm = new Audio(alarmUrl());
    audio.alarm.currentTime = 0;
    audio.alarm.onended = () => { if (!db.active || !db.active.running) stopKeepAlive(); };
    audio.alarm.play().catch(() => {});
  } catch (e) {}
  try { navigator.vibrate && navigator.vibrate([300, 150, 300, 150, 300]); } catch (e) {}
}
function stopAlarmRepeat() { clearInterval(audio.repeat); audio.repeat = null; }

const PHASE_WORD = { focus: 'focus', break: 'short break', long: 'long break' };
function alertPhase(tr, a, catchingUp) {
  const title = tr.from === 'focus' ? 'Focus phase done' : 'Break over';
  const next = PHASE_WORD[tr.to];
  const body = a.running
    ? next[0].toUpperCase() + next.slice(1) + ' started — until ' + clockHM(a.endsAt) + '.'
    : 'Tap “Start ' + next + '” when you are ready.';
  const hidden = document.visibilityState !== 'visible';
  if (!catchingUp || !hidden) playAlarm();
  toast(title + '. ' + body);
  if (hidden) showPhaseNotification(title, body, a.running ? null : next);
  // Keep nagging gently while the app is open and waiting, for up to a minute.
  stopAlarmRepeat();
  if (a.awaiting) {
    let n = 0;
    audio.repeat = setInterval(() => {
      if (!db.active || !db.active.awaiting || ++n > 5) return stopAlarmRepeat();
      if (document.visibilityState === 'visible') playAlarm();
    }, 12000);
  }
}
function showPhaseNotification(title, body, startWord) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !navigator.serviceWorker) return;
  navigator.serviceWorker.ready.then(reg => reg.showNotification(title, {
    body, tag: 'phase', renotify: true, requireInteraction: !!startWord,
    vibrate: [300, 150, 300, 150, 300], icon: 'icons/icon-192.png',
    actions: startWord ? [{ action: 'start', title: 'Start ' + startWord }] : [],
  })).catch(() => {});
}
function closePhaseNotifications() {
  if (!navigator.serviceWorker) return;
  navigator.serviceWorker.ready
    .then(reg => reg.getNotifications({ tag: 'phase' }))
    .then(list => list.forEach(n => n.close()))
    .catch(() => {});
}
function ensureNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(() => { if (currentView() === 'settings') render(); }).catch(() => {});
  }
}
if (navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener('message', e => {
    const a = db.active;
    if (e.data && e.data.type === 'start-next' && a && !a.running) actions.toggleTimer();
  });
}

// Lock-screen / notification-shade controls while the timer runs.
function updateMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const a = db.active;
  const playing = !!(a && a.running && audio.keep && !audio.keep.paused);
  if (!a || !playing) {
    navigator.mediaSession.playbackState = 'paused';
    if (!a) navigator.mediaSession.metadata = null;
    return;
  }
  const name = PHASE_WORD[a.phase];
  navigator.mediaSession.metadata = new MediaMetadata({
    title: name[0].toUpperCase() + name.slice(1) + ' · until ' + clockHM(a.endsAt),
    artist: courseById(a.courseId).code + ' · cycle ' + a.cycle + ' of ' + db.settings.cyclesBeforeLong,
    album: 'Study Tracker',
    artwork: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  });
  navigator.mediaSession.playbackState = 'playing';
}
if ('mediaSession' in navigator) {
  const set = (k, fn) => { try { navigator.mediaSession.setActionHandler(k, fn); } catch (e) {} };
  set('play', () => { if (db.active && !db.active.running) actions.toggleTimer(); });
  set('pause', () => { if (db.active && db.active.running) actions.toggleTimer(); });
  set('nexttrack', () => { if (db.active) actions.skip(); });
}

let wakeLock = null;
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator && document.visibilityState === 'visible' && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    }
  } catch (e) { wakeLock = null; }
}
function releaseWakeLock() { if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; } }

// ───────────────────────── install & storage persistence

let installPrompt = null;
let persistNote = '';
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; if (currentView() === 'settings') render(); });
window.addEventListener('appinstalled', () => { installPrompt = null; toast('Installed.'); });

if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persisted().then(p => p || navigator.storage.persist()).then(p => {
    persistNote = p ? 'Storage is marked persistent — the browser will not clear it to free space.' : 'Storage is not yet marked persistent. Installing the app usually fixes this.';
    const el = document.getElementById('persist-note'); if (el) el.textContent = persistNote;
  }).catch(() => {});
}
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ───────────────────────── boot

history.replaceState({ depth: 0 }, '');
tick();
if (db.active && db.active.running) { requestWakeLock(); startKeepAlive(); }
render();
