// سرور جنگ‌سالار: حساب کاربری، دوستی، دعوت به نبرد، و پخش دستورهای بازی بین دو نفر
// (منطق بازی در مرورگرهاست، ولی «داور سرور» (referee.js) همان منطق را بدون گرافیک روی سرور هم اجرا می‌کند)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

/* ---------- داور سرور ----------
   REFEREE=off      : خاموش (رفتار قبلی)
   REFEREE=enforce  : (پیش‌فرض) نتیجهٔ بازی را خود سرور از شبیه‌سازی خودش ثبت می‌کند و گزارش بازیکن‌ها تعیین‌کننده نیست.
                      ایمنی: اگر در یک بازی هیچ‌کدام از مرورگرها با داور هماهنگ نبودند (یعنی احتمالاً خطا از داور است)،
                      برای همان بازی روش قبلی (گزارش دو طرف) استفاده می‌شود
   REFEREE=shadow   : داور فقط نگاه می‌کند و ناهماهنگی‌ها را در لاگ و پرچم‌ها ثبت می‌کند */
let referee = null;
try { referee = require('./referee'); } catch (e) { console.error('referee بارگذاری نشد:', e && e.message); }
const REF_MODE = ['off', 'shadow', 'enforce'].includes(String(process.env.REFEREE || '').toLowerCase()) ? String(process.env.REFEREE).toLowerCase() : 'enforce';
/* ---------- مرحله‌های ضدتقلب ----------
   PREVALIDATE=enforce (پیش‌فرض) | shadow | off : دستورِ نامعتبر (خارج از نوبت/فاز، مختصات و کلید بد) را داور قبل از پخش بررسی می‌کند.
                       enforce دستور را دور می‌اندازد؛ shadow فقط ثبت می‌کند.
   HIDE_DRAFT=0       : خاموش‌کردن «پنهان‌بودن انتخاب و چیدمان حریف تا پایان فاز چیدن»
   SERVER_RNG=0       : خاموش‌کردن «شانس فقط روی سرور» (اعداد تصادفی همراه هر دستور از سرور می‌آیند)
   هر دو ویژگیِ آخر فقط وقتی فعال‌اند که مرورگرِ هر دو بازیکن نسخهٔ جدید باشد (cap>=2) و داور سالم کار کند. */
const PRE_MODE = ['off', 'shadow', 'enforce'].includes(String(process.env.PREVALIDATE || '').toLowerCase()) ? String(process.env.PREVALIDATE).toLowerCase() : 'enforce';
const HIDE_DRAFT = REF_MODE === 'enforce' && process.env.HIDE_DRAFT !== '0';
const SERVER_RNG = REF_MODE === 'enforce' && process.env.SERVER_RNG !== '0';
/* STRICT=0 : برگشت به رفتار قبلی (اعتماد به گزارش مرورگرها وقتی داور خراب شد).
   پیش‌فرض (STRICT روشن): سرور تنها مرجع است؛ نتیجه فقط از شبیه‌سازی خود سرور می‌آید، گزارش «نتیجه»ٔ مرورگرها نادیده گرفته می‌شود،
   پایان خودکار نوبت را خود سرور اعمال می‌کند، و اگر داور وسط بازی خراب شود بازی بدون ثبت نتیجه باطل می‌شود (نه اعتماد به مرورگر).
 */
const STRICT = REF_MODE === 'enforce' && process.env.STRICT !== '0';   // در حالت shadow داور هیچ دخالتی در بازی ندارد
const PRE_STATS = { checked: 0, bad: 0, dropped: 0, reasons: {} };
const REF_STATS = { games: 0, resOk: 0, resBad: 0, hashChecked: 0, hashBad: 0, stopped: 0, fallback: 0 };

const PORT = process.env.PORT || 3000;
const DATA = process.env.DATA_FILE || path.join(__dirname, 'data.json');

/* ---------- ذخیره‌سازی ----------
   اگر دو متغیر UPSTASH_REDIS_REST_URL و UPSTASH_REDIS_REST_TOKEN تنظیم شده باشند، حساب‌ها در دیتابیس
   رایگان Upstash ذخیره می‌شوند (دائمی، حتی بعد از خاموش/روشن شدن سرور). وگرنه در فایل data.json. */
const REDIS_URL = String(process.env.UPSTASH_REDIS_REST_URL || '').trim().replace(/\/+$/, '');
const REDIS_TOKEN = String(process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
const USE_REDIS = !!(REDIS_URL && REDIS_TOKEN);
const DB_KEY = 'jangsalar:db';
async function redis(cmd) {
  const r = await fetch(REDIS_URL, { method: 'POST', headers: { Authorization: 'Bearer ' + REDIS_TOKEN, 'content-type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || ('HTTP ' + r.status));
  return j.result;
}
/* همهٔ جدول‌ها بدون prototype ساخته می‌شوند تا نام‌هایی مثل constructor یا __proto__ شبیه کاربر/قبیله/نشست دیده نشوند */
const np = o => Object.assign(Object.create(null), o || {});
let db = { users: np(), sessions: np(), clans: np(), chats: np() };
let saveT = 0, chain = Promise.resolve();
const persist = () => (chain = chain.then(async () => {
  const s = JSON.stringify(db);
  if (USE_REDIS) { try { await redis(['SET', DB_KEY, s]); } catch (e) { console.error('ذخیره در دیتابیس ناموفق:', e.message); } }
  else await new Promise(res => fs.writeFile(DATA + '.tmp', s, e => { if (e) return res(); fs.rename(DATA + '.tmp', DATA, () => res()); }));
}));
const save = () => { clearTimeout(saveT); saveT = setTimeout(persist, 300); };
async function loadDb() {
  if (USE_REDIS) {
    // اگر دیتابیس در دسترس نباشد، عمداً با دیتابیس خالی شروع نمی‌کنیم (تا حساب‌های قبلی رونویسی نشوند)
    for (let i = 0; ; i++) {
      try { const s = await redis(['GET', DB_KEY]); if (s) db = JSON.parse(s); console.log('دیتابیس Upstash وصل شد'); break; }
      catch (e) { console.error('خواندن دیتابیس ناموفق:', e.message); if (i >= 4) process.exit(1); await new Promise(r => setTimeout(r, 2000)); }
    }
  } else {
    try { db = JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch {}
    console.log('هشدار: Upstash تنظیم نشده؛ حساب‌ها در data.json ذخیره می‌شوند (ممکن است پاک شوند)');
  }
  db.users = np(db.users); db.sessions = np(db.sessions); db.clans = np(db.clans); db.chats = np(db.chats);
  if (db.pc) db.pc.m = np(db.pc.m);
  const now0 = Date.now();                                          // نشست‌های قدیمی (رشته) به قالب جدید با زمان تبدیل می‌شوند
  for (const t of Object.keys(db.sessions)) { const v = db.sessions[t]; if (typeof v === 'string') db.sessions[t] = { u: v, ts: now0, seen: now0 }; }
  { let ch = false; for (const k of Object.keys(db.users)) { const u = db.users[k]; if (u.av == null || u.av < 0 || u.av >= 60) { u.av = Math.floor(Math.random() * 60); ch = true; } } if (ch) save(); }
  buildIdx();
  pruneSessions();
  await loadChats();
}
/* ---------- چت قبیله‌ها ----------
   با Upstash: هر قبیله یک کلید جدا (jangsalar:chat:<قبیله>) تا حجم دیتابیس اصلی زیاد نشود؛ بدون Upstash: داخل data.json.
   همهٔ چت‌ها موقع روشن شدن سرور در حافظه بارگذاری می‌شوند و هر تغییر (با کمی تأخیر) ذخیره می‌شود. */
const CHAT_KEY = ck => 'jangsalar:chat:' + ck;
const chatT = new Map();
const cleanChat = a => (Array.isArray(a) ? a : []).filter(x => x && typeof x.u === 'string' && typeof x.tx === 'string').slice(-CHATMAX);
async function loadChats() {
  const cks = Object.keys(db.clans);
  if (!USE_REDIS) { for (const ck of cks) if (db.chats[ck]) clanChat.set(ck, cleanChat(db.chats[ck])); return; }
  for (let i = 0; i < cks.length; i += 100) {
    const part = cks.slice(i, i + 100);
    for (let n = 0; ; n++) {                       // اگر دیتابیس در دسترس نباشد، بدون چت شروع نمی‌کنیم (تا چت‌های قبلی رونویسی نشوند)
      try {
        const res = await redis(['MGET', ...part.map(CHAT_KEY)]);
        part.forEach((ck, j) => { if (res[j]) { try { clanChat.set(ck, cleanChat(JSON.parse(res[j]))); } catch {} } });
        break;
      } catch (e) { console.error('خواندن چت قبیله‌ها ناموفق:', e.message); if (n >= 4) process.exit(1); await new Promise(r => setTimeout(r, 2000)); }
    }
  }
}
const sendChatNow = ck => redis(['SET', CHAT_KEY(ck), JSON.stringify(clanChat.get(ck) || [])]).catch(e => console.error('ذخیرهٔ چت ناموفق:', e.message));
function saveChat(ck) {
  if (!USE_REDIS) { db.chats[ck] = clanChat.get(ck) || []; return save(); }
  clearTimeout(chatT.get(ck));
  chatT.set(ck, setTimeout(() => { chatT.delete(ck); sendChatNow(ck); }, 1000));
}
function dropChat(ck) {                            // قبیله حذف شد
  clanChat.delete(ck); clearTimeout(chatT.get(ck)); chatT.delete(ck);
  if (!USE_REDIS) { delete db.chats[ck]; return save(); }
  redis(['DEL', CHAT_KEY(ck)]).catch(e => console.error('حذف چت ناموفق:', e.message));
}
/* ---------- تگ و آیدی ----------
   تگ بازیکن: ۱۲ نویسهٔ تصادفی (حرف بزرگ + عدد)، تگ قبیله: ۱۰ نویسه. یکتا و ثابت (تغییر نمی‌کند).
   تگ فقط برای ورود دوباره به حساب است: در پروفایل و لیست دوستان نمایش داده نمی‌شود و برای جستجوی دوست هم استفاده نمی‌شود.
   آیدی: یکتا، انتخاب خود بازیکن (حروف انگلیسی بزرگ، عدد و _ ؛ ۴ تا ۲۰ نویسه) و همیشه با حروف بزرگ ذخیره می‌شود. */
const TAG_CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const userTags = new Map(), userIds = new Map(), clanTags = new Map();   // تگ/آیدی -> کلید کاربر ، تگ -> کلید قبیله
function randTag(len, taken) {
  for (;;) {
    let t = ''; const b = crypto.randomBytes(len);
    for (let i = 0; i < len; i++) t += TAG_CH[b[i] % TAG_CH.length];
    if (!taken.has(t)) return t;
  }
}
function buildIdx() {
  userTags.clear(); userIds.clear(); clanTags.clear();
  let changed = false;
  for (const [k, u] of Object.entries(db.users)) {                 // حساب‌های قدیمی هم تگ می‌گیرند
    if (!u.tag || userTags.has(u.tag)) { u.tag = randTag(12, userTags); changed = true; }
    userTags.set(u.tag, k);
    if (u.id) {
      const up = String(u.id).toUpperCase();                       // آیدی‌های قدیمی (حروف کوچک) به حروف بزرگ تبدیل می‌شوند
      if (up !== u.id) { u.id = up; changed = true; }
      if (userIds.has(u.id)) { delete u.id; changed = true; } else userIds.set(u.id, k);
    }
  }
  for (const [k, c] of Object.entries(db.clans)) {
    if (!c.tag || clanTags.has(c.tag)) { c.tag = randTag(10, clanTags); changed = true; }
    clanTags.set(c.tag, k);
  }
  if (changed) save();
}
const ID_RE = /^[A-Z0-9_]{4,20}$/;
const ID_MSG = 'آیدی باید ۴ تا ۲۰ نویسه از حروف انگلیسی، عدد یا _ باشد';
const normId = v => String(v || '').trim().replace(/^@/, '').toUpperCase();   // آیدی همیشه با حروف بزرگ
const TAG_RE = /^[A-Z0-9]{12}$/;
// قانون رمز عبور (فقط برای ثبت‌نام و تعویض رمز): حداقل ۸ نویسه، هم حرف انگلیسی و هم عدد، و حداقل یک حرف بزرگ
function pwErr(p) {
  if (p.length < 8) return 'رمز باید حداقل ۸ کاراکتر باشد';
  if (p.length > 64) return 'رمز نباید بیشتر از ۶۴ کاراکتر باشد';
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return 'رمز باید همزمان شامل حرف انگلیسی و عدد باشد';
  if (!/[A-Z]/.test(p)) return 'رمز باید حداقل یک حرف انگلیسی بزرگ داشته باشد';
  return '';
}
const flushAndExit = async () => {
  clearTimeout(saveT);
  const pend = [...chatT.keys()]; chatT.forEach(t => clearTimeout(t)); chatT.clear();
  for (const ck of pend) await sendChatNow(ck);     // چت‌هایی که هنوز ذخیره نشده‌اند
  persist().then(() => process.exit(0));
};
process.on('SIGTERM', flushAndExit); process.on('SIGINT', flushAndExit);

/* ---------- HTTP: صفحهٔ بازی و عکس لودینگ ---------- */
const MIME = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const FORCE_HTTPS = process.env.FORCE_HTTPS === '1';
const server = http.createServer((req, res) => {
  if (FORCE_HTTPS && req.headers['x-forwarded-proto'] === 'http' && req.url !== '/health') {
    res.writeHead(301, { location: 'https://' + req.headers.host + req.url }); return res.end();
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'none'");
  if (FORCE_HTTPS) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  let p; try { p = new URL(req.url, 'http://x').pathname; } catch { res.writeHead(400).end('bad'); return; }
  if (p === '/' || p === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  }
  if (p === '/referee') {                          // وضعیت داور (برای بررسی با مرورگر)
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({ mode: REF_MODE, loaded: !!referee, activeSims: referee ? referee.count() : 0, stats: REF_STATS, prevalidate: { mode: PRE_MODE, ...PRE_STATS }, hideDraft: HIDE_DRAFT, serverRng: SERVER_RNG }, null, 1));
  }
  const m = /^\/(loading|alice)(\.jpg|\.png|\.webp)$/.exec(p);   // عکس لودینگ و عکس کماندو آلیس (راهنمای توتریال)
  if (m) {
    const f = path.join(__dirname, m[1] + m[2]);
    if (fs.existsSync(f)) { res.writeHead(200, { 'content-type': MIME[m[2]], 'cache-control': 'public, max-age=300' }); return fs.createReadStream(f).pipe(res); }
  }
  if (p === '/skins.js' || p === '/warlord-engine.js') {   // کد اسکین‌ها و موتور گرافیکی (جدا از index.html، کنار server.js)
    const f = path.join(__dirname, p.slice(1));
    if (fs.existsSync(f)) { res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'no-cache' }); return fs.createReadStream(f).pipe(res); }
  }
  if (p === '/fpstest.html') {                  // صفحهٔ تست فریم گوشی
    const f = path.join(__dirname, 'fpstest.html');
    if (fs.existsSync(f)) { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' }); return fs.createReadStream(f).pipe(res); }
  }
  if (p === '/entry.mp3') {                      // موزیک ورود (اختیاری): فایل entry.mp3 کنار server.js
    const f = path.join(__dirname, 'entry.mp3');
    if (fs.existsSync(f)) { res.writeHead(200, { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=300' }); return fs.createReadStream(f).pipe(res); }
  }
  if (ADMIN_KEY && (p === '/admin/flags' || p === '/admin/flag')) {
    const u = new URL(req.url, 'http://x');
    if (!adminOk(req.headers['x-admin-key'] || u.searchParams.get('k'))) { res.writeHead(403).end('forbidden'); return; }
    return adminView(p, u.searchParams, res);
  }
  if (p === '/health') return res.end('ok');
  res.writeHead(404).end('not found');
});

/* ---------- وضعیت زنده (در حافظه) ---------- */
const conns = new Map();     // کلید کاربر -> websocket
const inMatch = new Map();   // کلید کاربر -> match
const invOut = new Map();    // دعوت‌کننده -> inv
const invIn = new Map();     // دعوت‌شونده -> inv

const key = n => String(n || '').trim().toLowerCase();
const nameOf = k => (db.users[k] ? db.users[k].name : k);
const send = (ws, o) => ws && ws.readyState === 1 && ws.send(JSON.stringify(o));
const sendU = (k, o) => send(conns.get(k), o);
const toast = (ws, msg) => send(ws, { t: 'toast', msg });
const seed = () => (Math.random() * 2147483647) | 0;
/* scrypt غیرهمزمان با سقف هم‌زمانی تا حلقهٔ سرور قفل نشود */
let scryptRun = 0; const scryptQ = [];
const SCRYPT_MAX = 3, SCRYPT_QMAX = 30;
function hashPw(p, salt) {
  return new Promise((ok, no) => {
    const go = () => { scryptRun++; crypto.scrypt(p, salt, 32, (e, b) => { scryptRun--; const n = scryptQ.shift(); if (n) n(); e ? no(e) : ok(b.toString('hex')); }); };
    if (scryptRun < SCRYPT_MAX) go();
    else if (scryptQ.length >= SCRYPT_QMAX) no(new Error('busy'));
    else scryptQ.push(go);
  });
}
const hashEq = (hex, got) => { const a = Buffer.from(hex, 'hex'), b = Buffer.from(got, 'hex'); return a.length === b.length && crypto.timingSafeEqual(a, b); };

/* نام‌ها: فقط حروف فارسی یا فقط لاتین (مخلوط نه) + عدد لاتین + _ ؛ جلوی حروف مشابه (سیریلیک، عربی ي/ك و ...) */
const FA_CH = '\u0622\u0627\u0628\u067E\u062A\u062B\u062C\u0686\u062D\u062E\u062F\u0630\u0631\u0632\u0698\u0633\u0634\u0635\u0636\u0637\u0638\u0639\u063A\u0641\u0642\u06A9\u06AF\u0644\u0645\u0646\u0648\u0647\u06CC\u0626\u0624\u0621';
const NAME_FA = new RegExp('^[' + FA_CH + '0-9_]+$'), NAME_EN = /^[A-Za-z0-9_]+$/;
function nameOk(n, space) {
  if (space) n = n.replace(/ +/g, '_');
  if (!/[^0-9_]/.test(n)) return false;                    // فقط عدد/زیرخط نباشد
  return NAME_EN.test(n) || NAME_FA.test(n);
}

/* ---------- محدودیت نرخ (در حافظه) ---------- */
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const RL_AUTH_IP = +process.env.RL_AUTH_IP || 20;        // تلاش ورود/ثبت‌نام در ۱۰ دقیقه برای هر IP
const RL_REG_IP = +process.env.RL_REG_IP || 5;           // ثبت‌نام جدید در ساعت برای هر IP
const RL_TAG_FAIL = +process.env.RL_TAG_FAIL || 8;       // رمز اشتباه در ۱۵ دقیقه برای هر حساب
const RL_REG_ALL = +process.env.RL_REG_ALL || 200;       // ثبت‌نام جدید در ساعت در کل سرور
const MAX_USERS = +process.env.MAX_USERS || 100000;
const IP_CONN_MAX = +process.env.IP_CONN_MAX || 20;
const rlMap = new Map();
function rl(k, max, win) {                               // true = مجاز (و شمرده می‌شود)
  const n = Date.now(); let e = rlMap.get(k);
  if (!e || e.r <= n) { e = { c: 0, r: n + win }; rlMap.set(k, e); }
  return ++e.c <= max;
}
const rlPeek = (k, max) => { const e = rlMap.get(k); return !e || e.r <= Date.now() || e.c < max; };
function rlSweep() { const n = Date.now(); for (const [k, e] of rlMap) if (e.r <= n) rlMap.delete(k); }
function clientIp(req) {
  if (TRUST_PROXY) { const x = String(req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean); if (x.length) return x[x.length - 1]; }
  return req.socket.remoteAddress || '?';
}
const ipConns = new Map();
function ipConnOk(ip) { const n = (ipConns.get(ip) || 0) + 1; if (n > IP_CONN_MAX) return false; ipConns.set(ip, n); return true; }
function ipConnDone(ip) { const n = (ipConns.get(ip) || 0) - 1; if (n <= 0) ipConns.delete(ip); else ipConns.set(ip, n); }

/* ---------- نشست‌ها: انقضا و سقف ---------- */
const SESS_TTL = (+process.env.SESSION_DAYS || 30) * 86400000;
const SESS_PER_USER = 5;
function pruneSessions() {
  const n = Date.now(), per = new Map();
  const arr = Object.keys(db.sessions).map(t => [t, db.sessions[t]]).sort((a, b) => b[1].seen - a[1].seen);
  let ch = false;
  for (const [t, s] of arr) {
    const c = (per.get(s.u) || 0) + 1; per.set(s.u, c);
    if (n - s.seen > SESS_TTL || !db.users[s.u] || c > SESS_PER_USER) { delete db.sessions[t]; ch = true; }
  }
  if (ch && typeof save === 'function') save();
}

function pushFL(k) {
  const u = db.users[k]; if (!u || !conns.has(k)) return;
  sendU(k, { t: 'fl',
    me: { w: u.ow | 0, tr: u.tr | 0, tag: u.tag, id: u.id || '', pc: u.pc | 0, cc: ccOf(u), av: avOf(u) },
    friends: u.friends.map(f => ({ u: nameOf(f), on: conns.has(f), busy: inMatch.has(f), w: db.users[f] ? db.users[f].ow | 0 : 0, id: db.users[f] ? db.users[f].id || '' : '' }))
      .sort((a, b) => b.w - a.w || b.on - a.on || a.u.localeCompare(b.u)),
    inc: u.inc.map(nameOf), out: u.out.map(nameOf) });
}
const pushFriendsOf = k => { const u = db.users[k]; if (u) u.friends.forEach(pushFL); };
/* ---------- نامه‌ها ---------- */
const MAILMAX = 50;
function pushMail(k) {
  const u = db.users[k]; if (!u || !conns.has(k)) return;
  sendU(k, { t: 'mail', mail: u.mail || [] });
}
function sendMail(k, m) {
  const u = db.users[k]; if (!u) return;
  u.mail = u.mail || [];
  u.mail.unshift({ id: crypto.randomBytes(6).toString('hex'), ts: Date.now(), read: false, type: 'info', ...m });
  if (u.mail.length > MAILMAX) u.mail.length = MAILMAX;
  save(); pushMail(k);
}
const drop = (arr, v) => { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); };

/* ---------- ورود / ثبت‌نام ---------- */
async function auth(ws, m) {
  const err = (msg, resume) => send(ws, { t: 'autherr', msg, resume });
  if (ws.authBusy) return;
  ws.authBusy = true;
  try { await auth2(ws, m, err); } finally { ws.authBusy = false; }
}
async function auth2(ws, m, err) {
  if (m.t === 'resume') {
    const k = key(m.u), tok = String(m.tok || '');
    const s = /^[0-9a-f]{48}$/.test(tok) ? db.sessions[tok] : null;
    if (!rl('rs:' + ws.ip, 60, 600000)) return err('تلاش زیاد؛ کمی بعد دوباره امتحان کن');
    if (s && s.u === k && db.users[k] && Date.now() - s.seen <= SESS_TTL) {
      if (Date.now() - s.seen > 86400000) { s.seen = Date.now(); save(); }
      return login(ws, k, tok);
    }
    return err('نشست منقضی شده؛ دوباره وارد شو.', true);
  }
  const pw = String(m.p || '');
  if (++ws.tries > 12) return ws.close();
  if (!pw || pw.length > 64) return err('رمز عبور را درست وارد کن');
  if (!rl('au:' + ws.ip, RL_AUTH_IP, 600000)) return err('تلاش‌های زیاد؛ ۱۰ دقیقه بعد دوباره امتحان کن');
  let k, reg = false;
  try {
    if (m.mode === 'register') {
      const name = String(m.u || '').trim(); k = key(name);
      if (name.length < 3 || name.length > 16 || !nameOk(name)) return err('نام کاربری باید ۳ تا ۱۶ حرف فارسی یا انگلیسی (جدا از هم، نه مخلوط) یا عدد باشد');
      const pe = pwErr(pw); if (pe) return err(pe);
      if (pw !== String(m.p2 || '')) return err('رمز عبور و تکرار آن یکسان نیست');
      const id = normId(m.id);
      if (!ID_RE.test(id)) return err(ID_MSG);
      if (db.users[k]) return err('این نام قبلاً گرفته شده');
      if (userIds.has(id)) return err('این آیدی قبلاً گرفته شده');
      if (Object.keys(db.users).length >= MAX_USERS) return err('ظرفیت ثبت‌نام پر است');
      if (!rl('rg:' + ws.ip, RL_REG_IP, 3600000) || !rl('rg:all', RL_REG_ALL, 3600000)) return err('ثبت‌نام‌های زیاد؛ بعداً امتحان کن');
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = await hashPw(pw, salt);
      if (db.users[k] || userIds.has(id)) return err('این نام یا آیدی قبلاً گرفته شده');   // همزمانی در طول await
      const tag = randTag(12, userTags);
      db.users[k] = { name, tag, id, salt, hash, friends: [], inc: [], out: [], mail: [], av: Math.floor(Math.random() * NAV) };
      userTags.set(tag, k); userIds.set(id, k); reg = true;
      sendMail(k, { from: 'جنگ‌سالار', title: 'خوش آمدی!', text: 'به جنگ‌سالار خوش آمدی ' + name + '. دوستانت را اضافه کن و با آن‌ها نبرد دوستانه بزن.' });
    } else {
      // ورود با «تگ» (نه نام کاربری) + رمز؛ چون تگ یکتاست، دقیقاً مشخص است وارد کدام حساب می‌شوی
      const tag = normTag(m.u);
      if (!TAG_RE.test(tag)) return err('تگ حساب را درست وارد کن (۱۲ نویسه از حروف انگلیسی و عدد)');
      if (!rlPeek('tf:' + tag, RL_TAG_FAIL)) return err('این حساب موقتاً قفل شده؛ ۱۵ دقیقه بعد امتحان کن');
      k = userTags.get(tag);
      const u = k && db.users[k];
      if (!u) { rl('tf:' + tag, RL_TAG_FAIL, 900000); return err('تگ یا رمز اشتباه است'); }
      if (!hashEq(u.hash, await hashPw(pw, u.salt))) { rl('tf:' + tag, RL_TAG_FAIL, 900000); return err('تگ یا رمز اشتباه است'); }
    }
  } catch (e) { return err('سرور شلوغ است؛ کمی بعد دوباره امتحان کن'); }
  if (ws.readyState !== 1) return;
  const tok = crypto.randomBytes(24).toString('hex'), n = Date.now();
  db.sessions[tok] = { u: k, ts: n, seen: n };
  pruneSessions(); save();
  login(ws, k, tok, reg);
}
function login(ws, k, tok, reg) {
  const old = conns.get(k);
  if (old && old !== ws) { old.u = null; send(old, { t: 'kicked' }); old.close(4001); }
  ws.u = k; ws.tok = tok; conns.set(k, ws);
  send(ws, { t: 'authok', u: nameOf(k), tok, tag: db.users[k].tag, id: db.users[k].id || '', reg: !!reg });
  pushFL(k); pushFriendsOf(k); pushMail(k); pushClan(k); pushClanLive(k);
  const mt = inMatch.get(k); if (mt) resumeMatch(mt, k, ws);
}
function leaveSession(ws) {                  // خروج یا قطع اتصال
  const k = ws.u; if (!k || conns.get(k) !== ws) return;
  conns.delete(k); ws.u = null; pushClanLive(k);
  if (invOut.has(k)) endInv(invOut.get(k), 'cancel');
  if (invIn.has(k)) endInv(invIn.get(k), 'offline');
  const mt = inMatch.get(k);
  if (mt) {
    const i = mt.p.indexOf(k);
    sendU(mt.p[1 - i], { t: 'opp', on: false });
    if (!mt.ended) mt.tmr[i] = setTimeout(() => {          // ۶۰ ثانیه فرصت بازگشت
      if (!conns.has(k) && inMatch.get(k) === mt && !mt.ended) abort(mt, 1 - i, i, 'disconnect');
    }, 60000);
  }
  pushFriendsOf(k);
}

/* ---------- دوستی ---------- */
function friends(ws, m) {
  const me = ws.u, U = db.users[me], t = m.t === 'fadd' ? (resolveUser(m.u) || key(m.u)) : key(m.u), T = db.users[t];
  if (m.t === 'fadd') {
    if (!T) return toast(ws, 'کاربری با این نام پیدا نشد');
    if (t === me) return toast(ws, 'نمی‌توانی خودت را اضافه کنی');
    if (U.friends.includes(t)) return toast(ws, 'از قبل دوست هستید');
    if (U.out.includes(t)) return toast(ws, 'درخواست قبلاً فرستاده شده');
    if (U.inc.includes(t)) { drop(U.inc, t); drop(T.out, me); U.friends.push(t); T.friends.push(me); sendMail(t, { from: U.name, title: 'دوستی قبول شد', text: U.name + ' حالا دوست توست.' }); }
    else {
      if (!rl('fr:' + me, 20, 3600000)) return toast(ws, 'درخواست‌های زیاد؛ کمی بعد امتحان کن');
      if (!rl('fp:' + me + '>' + t, 2, 86400000)) return toast(ws, 'به این کاربر زیاد درخواست فرستاده‌ای؛ فردا دوباره امتحان کن');
      if (T.mail) T.mail = T.mail.filter(x => !(x.type === 'freq' && x.from === U.name));   // نامهٔ تکراری از همین فرستنده
      U.out.push(t); T.inc.push(me); sendU(t, { t: 'toast', msg: U.name + ' درخواست دوستی فرستاد' }); sendMail(t, { type: 'freq', from: U.name, title: 'درخواست دوستی', text: U.name + ' برایت درخواست دوستی فرستاده است.' }); toast(ws, 'درخواست فرستاده شد'); }
  } else if (m.t === 'facc') {
    if (!T || !U.inc.includes(t)) return;
    drop(U.inc, t); drop(T.out, me); U.friends.push(t); T.friends.push(me);
    sendMail(t, { from: U.name, title: 'دوستی قبول شد', text: U.name + ' درخواست دوستی تو را قبول کرد.' });
  } else if (m.t === 'fdec') {
    drop(U.inc, t); if (T) drop(T.out, me);
  } else if (m.t === 'frem') {
    drop(U.friends, t); if (T) drop(T.friends, me);
  }
  save(); pushFL(me); if (T) pushFL(t);
}

/* ---------- جستجو و پروفایل ----------
   ورودی می‌تواند آیدی (@ID) یا نام کاربری باشد. تگ بازیکن برای جستجو/افزودن دوست کار نمی‌کند (فقط برای ورود است). */
const normTag = q => String(q || '').trim().replace(/^#/, '').toUpperCase();
function resolveUser(q) {
  q = String(q || '').trim(); if (!q) return null;
  if (q[0] === '#') return null;
  if (q[0] === '@') return userIds.get(normId(q)) || null;
  const k = key(q);
  if (db.users[k]) return k;
  return userIds.get(normId(q)) || null;
}
function profileOf(viewer, k) {
  const u = db.users[k], me = db.users[viewer]; if (!u) return null;
  const c = myClan(u);
  const rel = k === viewer ? 'self' : me.friends.includes(k) ? 'friend' : me.out.includes(k) ? 'out' : me.inc.includes(k) ? 'inc' : 'none';
  return { name: u.name, id: u.id || '', w: u.ow | 0, tr: u.tr | 0, pc: u.pc | 0, av: avOf(u),
    l: u.ol | 0, d: u.od | 0,
    on: conns.has(k), busy: inMatch.has(k), rel,
    clan: c ? { name: c.name, tag: c.tag, sy: csyOf(c), n: c.members.length, mode: c.mode, owner: nameOf(c.owner), role: c.owner === k ? 'owner' : 'member' } : null };
}
function search(ws, m) {
  const me = ws.u, q = String(m.q || '').trim().slice(0, 40);
  if (!q) return;
  if (++ws.searches > 60) return toast(ws, 'جستجوی زیاد؛ کمی صبر کن');
  const k = resolveUser(q);
  if (k) return send(ws, { t: 'sres', q, p: profileOf(me, k) });
  const c = findClan(q);
  send(ws, { t: 'sres', q, p: null, clan: c ? clanCard(c) : null });
}
// پیدا کردن قبیله: فقط با تگ قبیله (#...) یا با نام دقیقش؛ فهرست قبیله‌ها هرگز به کسی داده نمی‌شود
function findClan(q) {
  q = String(q || '').trim(); if (!q) return null;
  let ck = clanTags.get(normTag(q));
  if (!ck && q[0] !== '#') ck = key(q.replace(/\s+/g, ' '));
  return (ck && db.clans[ck]) || null;
}
const clanCard = c => ({ name: c.name, tag: c.tag, sy: csyOf(c), n: c.members.length, mode: c.mode, owner: nameOf(c.owner) });
async function chPw(ws, m) {                  // تعویض رمز: رمز فعلی + رمز جدید (با همان قانون ثبت‌نام) + تکرار
  const me = ws.u, U = db.users[me];
  if (++ws.tries > 12) return ws.close();
  if (!rl('cp:' + me, 10, 900000)) return toast(ws, 'تلاش زیاد؛ کمی بعد امتحان کن');
  const o = String(m.o || ''), n = String(m.n || '');
  try {
    if (!o || o.length > 64 || !hashEq(U.hash, await hashPw(o, U.salt))) return toast(ws, 'رمز فعلی اشتباه است');
    const pe = pwErr(n); if (pe) return toast(ws, pe);
    if (n !== String(m.n2 || '')) return toast(ws, 'رمز جدید و تکرار آن یکسان نیست');
    if (n === o) return toast(ws, 'رمز جدید باید با رمز فعلی فرق داشته باشد');
    const salt = crypto.randomBytes(16).toString('hex'), hash = await hashPw(n, salt);
    U.salt = salt; U.hash = hash;
  } catch (e) { return toast(ws, 'سرور شلوغ است؛ بعداً امتحان کن'); }
  for (const t of Object.keys(db.sessions)) if (db.sessions[t].u === me && t !== ws.tok) delete db.sessions[t];   // نشست‌های دستگاه‌های دیگر باطل می‌شود
  save(); send(ws, { t: 'pwok' });
}
const NCOL = 12, CC_DEF = 6;                   // تعداد رنگ‌ها (پروفایل و کادر چت) و رنگ پیش‌فرض کادر چت (مشکی)
const ccOf = u => (u.cc == null ? CC_DEF : u.cc);
const NAV = 60, avOf = u => ((u.av == null || u.av < 0 || u.av >= NAV) ? ((u.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % NAV) : u.av);   // نماد پروفایل: ۰ تا ۱۱ یا ‎-۱ = بدون نماد
function setAv(ws, m) {
  const me = ws.u, c = m.c | 0;
  if (c < 0 || c >= NAV) return;
  db.users[me].av = c; save(); pushFL(me);
}
function setCol(ws, m) {                      // رنگ پروفایل: عدد ۰ تا ۱۱
  const me = ws.u, c = m.c | 0;
  if (c < 0 || c >= NCOL) return;
  db.users[me].pc = c; save(); pushFL(me);
}
// رنگ کادر چت قبیله: فقط یکی از رنگ‌های از پیش تعیین‌شده؛ پیام‌های قبلیِ خودش هم برای همهٔ اعضا همان رنگ می‌شود
function setCc(ws, m) {
  const me = ws.u, U = db.users[me], c = m.c | 0;
  if (c < 0 || c >= NCOL) return;
  U.cc = c; save(); pushFL(me);
  const cl = myClan(U); if (!cl) return;
  const a = clanChat.get(U.clan) || [];
  a.forEach(x => { if (!x.sys && x.u === U.name) x.c = c; });
  saveChat(U.clan);
  cl.members.forEach(k => sendU(k, { t: 'clchat', msgs: a, keep: true }));
}
function setId(ws, m) {
  const me = ws.u, U = db.users[me], v = normId(m.id);
  if (!ID_RE.test(v)) return toast(ws, v ? ID_MSG : 'آیدی نمی‌تواند خالی باشد');
  if (v === U.id) return;
  if (userIds.has(v)) return toast(ws, 'این آیدی قبلاً گرفته شده');
  if (U.id) userIds.delete(U.id);
  U.id = v; userIds.set(v, me); save();
  toast(ws, 'آیدی ثبت شد: @' + v); pushFL(me); pushFriendsOf(me);
}

/* تعویض نام کاربری (نام همان کلید ورود است؛ همه‌جا جابه‌جا می‌شود). نیازمند رمز فعلی، فقط خارج از بازی */
async function setName(ws, m) {
  const old = ws.u, U = db.users[old];
  if (!U) return;
  if (++ws.tries > 12) return ws.close();
  if (!rl('sn:' + old, 5, 3600000)) return toast(ws, 'تلاش زیاد؛ کمی بعد امتحان کن');
  const name = String(m.n || '').trim(), nk = key(name), o = String(m.o || '');
  if (name.length < 3 || name.length > 16 || !nameOk(name)) return toast(ws, 'نام کاربری باید ۳ تا ۱۶ حرف فارسی یا انگلیسی (جدا از هم، نه مخلوط) یا عدد باشد');
  if (name === U.name) return toast(ws, 'این همان نام فعلی توست');
  if (inMatch.has(old) || invOut.has(old) || invIn.has(old)) return toast(ws, 'در بازی یا دعوت نمی‌شود نام را عوض کرد');
  try { if (!o || o.length > 64 || !hashEq(U.hash, await hashPw(o, U.salt))) return toast(ws, 'رمز فعلی اشتباه است'); }
  catch (e) { return toast(ws, 'سرور شلوغ است؛ بعداً امتحان کن'); }
  if (ws.u !== old || !db.users[old] || inMatch.has(old) || invOut.has(old) || invIn.has(old)) return;   // همزمانی در طول await
  if (nk !== old && db.users[nk]) return toast(ws, 'این نام قبلاً گرفته شده');
  const oldName = U.name;
  U.name = name;
  if (nk !== old) {
    db.users[nk] = U; delete db.users[old];
    for (const k of Object.keys(db.users)) { const u = db.users[k];
      for (const f of ['friends', 'inc', 'out']) if (Array.isArray(u[f])) u[f] = u[f].map(x => x === old ? nk : x); }
    for (const ck of Object.keys(db.clans)) { const c = db.clans[ck];
      if (c.owner === old) c.owner = nk;
      if (Array.isArray(c.members)) c.members = c.members.map(x => x === old ? nk : x); }
    for (const t of Object.keys(db.sessions)) if (db.sessions[t].u === old) db.sessions[t].u = nk;
    if (U.tag) userTags.set(U.tag, nk);
    if (U.id) userIds.set(U.id, nk);
    conns.delete(old); conns.set(nk, ws); ws.u = nk;
  }
  if (U.clan) { const a = clanChat.get(U.clan); if (a) { a.forEach(x => { if (!x.sys && x.u === oldName) x.u = name; }); saveChat(U.clan); } }
  save();
  send(ws, { t: 'nameok', u: name });
  toast(ws, 'نام کاربری شد: ' + name);
  pushFL(nk); pushFriendsOf(nk); pushClan(nk); pushClanLive(nk);
  (U.friends || []).forEach(pushFL);
}

/* ---------- قبیله ----------
   وضعیت: open = همه می‌توانند عضو شوند، closed = کسی نمی‌تواند عضو شود، invite = فقط با دعوتِ سازنده (از پروفایل بازیکن) */
const CMODES = new Set(['open', 'closed', 'invite']);
const clanChat = new Map();   // کلید قبیله -> آخرین پیام‌های چت (در حافظه؛ ذخیرهٔ دائمی با saveChat)
const CHATMAX = 50;
const myClan = u => (u && u.clan && db.clans[u.clan]) || null;
const clanInfo = (c, k) => ({ name: c.name, tag: c.tag, sy: csyOf(c), mode: c.mode, owner: nameOf(c.owner), mine: c.owner === k,
  on: c.members.filter(m => conns.has(m)).length, members: c.members.map(m => ({ u: nameOf(m), on: conns.has(m) })) });
function pushClanInfo(k) {                      // فقط مشخصات قبیله (برای به‌روز شدن تعداد آنلاین‌ها)
  const u = db.users[k]; if (!u || !conns.has(k)) return;
  const c = myClan(u); sendU(k, { t: 'clan', clan: c ? clanInfo(c, k) : null });
}
function pushClan(k) {
  const u = db.users[k]; if (!u || !conns.has(k)) return;
  pushClanInfo(k);
  if (myClan(u)) sendU(k, { t: 'clchat', msgs: clanChat.get(u.clan) || [] });
}
const pushClanLive = k => { const c = myClan(db.users[k]); if (c) c.members.forEach(pushClanInfo); };   // ورود/خروج یک عضو
const CLAN_MAX = +process.env.CLAN_MAX || 50;
const csyOf = c => (Number.isInteger(c.sy) && c.sy >= 0 && c.sy < NAV) ? c.sy : ((c.name || '').split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) % NAV);   // نماد قبیله: ۰ تا ۵۹ (پیش‌فرض از روی نام)
function sysSay(ck, kind, name, except) {          // اعلام ورود/خروج در چت قبیله (کادر طلایی/سیاه)؛ برای سازنده نامه‌ای نمی‌رود
  const c = db.clans[ck]; if (!c) return;
  const a = clanChat.get(ck) || [], msg = { sys: kind, u: name, tx: '', ts: Date.now() };
  a.push(msg); if (a.length > CHATMAX) a.shift();
  clanChat.set(ck, a); saveChat(ck);
  c.members.forEach(k => { if (k !== except) sendU(k, { t: 'clmsg', m: msg }); });
}
function joinClan(k, ck) {
  const c = db.clans[ck], u = db.users[k]; if (!c || !u) return;
  if (c.members.length >= CLAN_MAX) { toast(conns.get(k), 'این قبیله پر است'); return; }
  c.members.push(k); u.clan = ck; save();
  sysSay(ck, 'join', u.name, k);
  c.members.forEach(m => m === k ? pushClan(m) : pushClanInfo(m));
}
function clans(ws, m) {
  const me = ws.u, U = db.users[me];
  if (m.t === 'clcreate') {
    if (myClan(U)) return toast(ws, 'تو الان عضو یک قبیله هستی');
    const name = String(m.name || '').trim().replace(/\s+/g, ' '), ck = key(name);
    if (name.length < 3 || name.length > 20 || !nameOk(name, true)) return toast(ws, 'نام قبیله باید ۳ تا ۲۰ حرف فارسی یا انگلیسی (نه مخلوط) یا عدد باشد');
    if (!CMODES.has(m.mode)) return;
    if (db.clans[ck]) return toast(ws, 'این نام قبلاً گرفته شده');
    const ctag = randTag(10, clanTags);
    const sy = Number.isInteger(m.sy) && m.sy >= 0 && m.sy < NAV ? m.sy : undefined;
    db.clans[ck] = { name, tag: ctag, owner: me, mode: m.mode, members: [me], ts: Date.now(), ...(sy !== undefined ? { sy } : {}) };
    clanTags.set(ctag, ck);
    U.clan = ck; save(); pushClan(me); send(ws, { t: 'clmade' });
  } else if (m.t === 'clfind') {                 // جستجوی قبیله برای پیوستن: فقط با نام یا تگ
    const q = String(m.q || '').trim().slice(0, 40); if (!q) return;
    if (++ws.searches > 60) return toast(ws, 'جستجوی زیاد؛ کمی صبر کن');
    const c = findClan(q);
    send(ws, { t: 'clres', q, clan: c ? clanCard(c) : null });
  } else if (m.t === 'cljoin') {
    if (myClan(U)) return toast(ws, 'تو الان عضو یک قبیله هستی');
    const ck = key(m.name), c = db.clans[ck];
    if (!c) return toast(ws, 'این قبیله وجود ندارد');
    if (c.mode !== 'open') return toast(ws, 'این قبیله باز نیست');
    joinClan(me, ck);
  } else if (m.t === 'clinv') {
    const c = myClan(U), t = key(m.u), T = db.users[t];
    if (!c || c.owner !== me) return toast(ws, 'فقط سازندهٔ قبیله می‌تواند دعوت کند');
    if (c.mode !== 'invite') return toast(ws, 'قبیلهٔ تو «با دعوت» نیست');
    if (!T) return toast(ws, 'کاربری با این نام پیدا نشد');
    if (t === me) return toast(ws, 'نمی‌توانی خودت را دعوت کنی');
    if (myClan(T)) return toast(ws, nameOf(t) + ' عضو یک قبیله است');
    if (c.members.length >= CLAN_MAX) return toast(ws, 'قبیله پر است');
    if ((T.mail || []).some(x => x.type === 'cinv' && key(x.clan) === key(c.name))) return toast(ws, 'قبلاً دعوت شده');
    sendMail(t, { type: 'cinv', from: U.name, clan: c.name, title: 'دعوت به قبیله', text: U.name + ' تو را به قبیلهٔ «' + c.name + '» دعوت کرده است.' });
    toast(ws, 'دعوت برای ' + nameOf(t) + ' فرستاده شد');
  } else if (m.t === 'clsetsy') {                // تغییر نماد قبیله: فقط سازنده
    const c = myClan(U); if (!c) return;
    if (c.owner !== me) return toast(ws, 'فقط سازندهٔ قبیله می‌تواند نماد را عوض کند');
    if (!Number.isInteger(m.sy) || m.sy < 0 || m.sy >= NAV) return;
    if (!rl('cs:' + me, 20, 60000)) return toast(ws, 'کمی آهسته‌تر');
    c.sy = m.sy; save();
    c.members.forEach(pushClanInfo);
  } else if (m.t === 'clleave') {
    const c = myClan(U); if (!c) return;
    const ck = U.clan;
    drop(c.members, me); delete U.clan;
    if (!c.members.length) { delete db.clans[ck]; clanTags.delete(c.tag); dropChat(ck); }   // قبیلهٔ خالی حذف می‌شود
    else {
      if (c.owner === me) {                       // اگر سازنده برود، قدیمی‌ترین عضو سازنده می‌شود
        c.owner = c.members[0];
        sendMail(c.owner, { from: 'جنگ‌سالار', title: 'سازندهٔ قبیله', text: 'سازندهٔ قبیله رفت و تو حالا سازندهٔ قبیلهٔ «' + c.name + '» هستی.' });
      }
      sysSay(ck, 'leave', U.name);
      c.members.forEach(pushClanInfo);
    }
    save(); pushClan(me); toast(ws, 'قبیله را ترک کردی');
  } else if (m.t === 'clsay') {
    const c = myClan(U); if (!c) return;
    const tx = String(m.tx || '').replace(/\s+/g, ' ').trim().slice(0, 500);
    if (!tx) return;
    const now = Date.now();
    if (now - (ws.lastSay || 0) < 800 || !rl('sy:' + me, 30, 60000)) return toast(ws, 'کمی آهسته‌تر پیام بده');
    ws.lastSay = now;
    const a = clanChat.get(U.clan) || [], msg = { u: U.name, tx, ts: now, c: ccOf(U) };
    a.push(msg); if (a.length > CHATMAX) a.shift();
    clanChat.set(U.clan, a); saveChat(U.clan);
    c.members.forEach(k => sendU(k, { t: 'clmsg', m: msg }));
  } else if (m.t === 'clacc' || m.t === 'cldec') {
    const a = U.mail || [], i = a.findIndex(e => e.id === m.u && e.type === 'cinv'); if (i < 0) return;
    const x = a[i]; a.splice(i, 1); save(); pushMail(me);
    if (m.t === 'cldec') return;
    if (myClan(U)) return toast(ws, 'تو الان عضو یک قبیله هستی');
    const ck = key(x.clan), c = db.clans[ck];
    if (!c || c.mode !== 'invite') return toast(ws, 'این دعوت دیگر معتبر نیست');
    joinClan(me, ck);
  }
}

/* ---------- دعوت به نبرد ---------- */
function endInv(inv, why) {
  clearTimeout(inv.timer); invOut.delete(inv.from); invIn.delete(inv.to);
  if (why) sendU(inv.from, { t: 'invend', why, who: nameOf(inv.to) });
  sendU(inv.to, { t: 'invgone' });
}
function invite(ws, m) {
  const me = ws.u, t = key(m.u);
  if (!db.users[me].friends.includes(t)) return toast(ws, 'فقط دوستانت را می‌توانی دعوت کنی');
  if (!conns.has(t)) return toast(ws, nameOf(t) + ' آنلاین نیست');
  if (inMatch.has(me)) return;
  if (inMatch.has(t)) return toast(ws, nameOf(t) + ' در حال بازی است');
  if (invOut.has(me)) return toast(ws, 'یک دعوت فعال داری');
  if (invIn.has(me)) return toast(ws, 'اول به دعوتِ دریافتی جواب بده');
  if (invIn.has(t) || invOut.has(t)) return toast(ws, nameOf(t) + ' الان مشغول است');
  const inv = { from: me, to: t, timer: setTimeout(() => endInv(inv, 'timeout'), 30000) };
  invOut.set(me, inv); invIn.set(t, inv);
  sendU(t, { t: 'invin', from: nameOf(me) });
  send(ws, { t: 'invwait', to: nameOf(t) });
}

/* ---------- نبرد ---------- */
function newMatch(a, b, official = false) {   // official فقط برای مسابقات رسمی true می‌شود؛ نبردهای دوستانه (دعوت از دوستان) همیشه false
  const mt = { official, p: [a, b], log: [], g: 0, ended: false, abort: null, tmr: [null, null], res: [null, null], counted: false, resT: null, hs: new Map(), desync: null, noRec: false, rl: [{ t: 0, n: 0 }, { t: 0, n: 0 }], cnt: [0, 0], flagged: new Set(), rlen: 0, pre: [0, 0], v2: false, hide: false, hideEnd: 0, rng: false };
  { const wa = conns.get(a), wb = conns.get(b); mt.v2 = !!(wa && wb && (wa.cap | 0) >= 2 && (wb.cap | 0) >= 2); }   // هر دو مرورگر نسخهٔ جدید؟
  if (official) [a, b].forEach(k => { const u = db.users[k]; if (u) u.mg = (u.mg | 0) + 1; });
  inMatch.set(a, mt); inMatch.set(b, mt);
  [a, b].forEach((k, i) => sendU(k, { t: 'match', me: i, opp: nameOf(i ? a : b) }));
  push(mt, { a: 'init', seed: seed() });
  [a, b].forEach(k => { pushFL(k); pushFriendsOf(k); });
}
const DRAFTC = new Set(['cell', 'shop', 'dr', 'to']);
const isDraftCmd = c => DRAFTC.has(c.a) && (c.o === 0 || c.o === 1);
// در فاز چیدن، هر بازیکن فقط دستورهای خودش را می‌بیند؛ اگر بازیکنی وسط فاز وصل شود، دستورهای حریف از لاگش حذف می‌شود
const logFor = (mt, i) => mt.hide ? mt.log.filter(c => !(isDraftCmd(c) && c.o !== i)) : mt.log;
// پایان فاز چیدن (یا خرابی داور): کل لاگ به هر دو نفر داده می‌شود تا از ابتدا با ترتیب یکسان بازپخش کنند
function endHide(mt) {
  mt.hide = false; mt.hideEnd = mt.log.length;
  const r = { t: 'redo', g: mt.g, log: mt.log, t0: mt.t0, now: Date.now() };
  mt.p.forEach(k => sendU(k, r));
}
function push(mt, c) {
  if (c.a === 'init') { mt.g++; mt.log = []; mt.res = [null, null]; mt.counted = false; clearTimeout(mt.resT); mt.resT = null; mt.t0 = Date.now(); mt.hs = new Map(); mt.desync = null; mt.noRec = false; mt.rl = [{ t: 0, n: 0 }, { t: 0, n: 0 }]; mt.cnt = [0, 0]; mt.flagged = new Set(); mt.pre = [0, 0]; mt.hide = false; mt.hideEnd = 0; mt.rng = !!(mt.v2 && SERVER_RNG && referee && REF_MODE !== 'off');
    // پایان زمان انتخاب/چیدن را خود سرور هم اعلام می‌کند (۱۶۰ ثانیه + ۳ ثانیه لودینگ + کمی مهلت)؛ اگر مرورگر بازیکنی بسته باشد هم بازی گیر نمی‌کند
    clearTimeout(mt.draftT); const g0 = mt.g;
    mt.draftT = setTimeout(() => { if (mt.ended || mt.g !== g0) return; push(mt, { a: 'to', o: 0 }); push(mt, { a: 'to', o: 1 }); }, 165500); }
  if (mt.log.length > 6000) return;
  mt.log.push(c);
  const n = mt.log.length - 1;
  const rn = refFeed(mt, c, n);
  const simOk = !!(mt.sim && !mt.sim.broken && REF_MODE !== 'off');
  if (c.a === 'init') {
    if (!simOk) mt.rng = false;
    mt.hide = !!(mt.v2 && HIDE_DRAFT && simOk);
    mt.hideEnd = mt.hide ? Infinity : 0;
  }
  if (mt.rng && Array.isArray(rn)) c.rn = rn;      // اعداد تصادفیِ همین دستور؛ فقط از سرور می‌آید
  if (mt.hide) {
    if (!simOk || mt.sim.ph === 'play') return endHide(mt);       // فاز چیدن تمام شد (یا داور خراب شد): همه‌چیز آشکار
    if (isDraftCmd(c)) { sendU(mt.p[c.o], { t: 'cmd', g: mt.g, n, c, now: Date.now() }); return; }   // فقط صاحبِ دستور
  }
  const m = { t: 'cmd', g: mt.g, n, c, now: Date.now(), t0: c.a === 'init' ? mt.t0 : undefined };
  mt.p.forEach(k => sendU(k, m));
}
function refFeed(mt, c, n) {
  if (REF_MODE === 'off' || !referee) return null;
  try {
    if (c.a === 'init') {
      if (mt.sim) mt.sim.dispose();
      mt.sim = referee.create(!!mt.rng); mt.resync = [0, 0]; mt.simDone = false; mt.simWin = undefined; mt.refOk = [0, 0]; mt.refBad = [0, 0];
      if (mt.sim) REF_STATS.games++;
    }
    const sim = mt.sim; if (!sim || sim.broken) return null;
    const rn = sim.feed(c, n);
    if (sim.broken) { REF_STATS.stopped++; console.log('referee: شبیه‌سازی این بازی متوقف شد:', sim.why); if (STRICT) voidMatch(mt, 'توقف شبیه‌ساز: ' + sim.why); return null; }
    if (sim.over && !mt.simDone) {
      mt.simDone = true; mt.simWin = sim.winner;
      if (REF_MODE === 'enforce') {
        // فقط وقتی حداقل یک مرورگر با داور هماهنگ بوده و هر دو مرورگر با داور اختلاف نداشته‌اند، نتیجه را خود سرور ثبت می‌کند
        const bothBad = mt.refBad[0] > 0 && mt.refBad[1] > 0;
        const ok = STRICT ? !bothBad : ((mt.refOk[0] + mt.refOk[1]) > 0 && !bothBad);
        if (ok) record(mt, sim.winner, true);
        else if (STRICT) { mt.counted = true; REF_STATS.fallback++; console.log('referee: هر دو مرورگر با داور فرق داشتند؛ بازی بدون ثبت نتیجه باطل شد'); }
        else { REF_STATS.fallback++; console.log('referee: داور و مرورگرها هماهنگ نبودند؛ نتیجه با روش قبلی ثبت می‌شود'); }
      }
    }
    if (sim.over && mt.simDone) { const sm = mt.sim; setTimeout(() => { try { sm.dispose(); } catch (_) {} }, 5000); }   // بازی تمام شد؛ حافظهٔ شبیه‌ساز آزاد می‌شود
    if (STRICT) schedAuto(mt);
    return rn;
  } catch (e) {
    console.error('referee error:', e && e.message);
    if (mt.sim) { try { mt.sim.dispose(); } catch (_) {} }
    if (STRICT) voidMatch(mt, 'خطای داور');
    return null;
  }
}
// بازیِ بدون داور سالم در حالت STRICT قابل اعتماد نیست: نتیجه‌اش ثبت نمی‌شود (به نفع هیچ‌کس تمام نمی‌شود)
function voidMatch(mt, why) {
  if (mt.counted || mt.ended) return;
  mt.counted = true; clearTimeout(mt.resT); clearTimeout(mt.autoT);
  console.log('referee: بازی باطل شد (' + why + '):', nameOf(mt.p[0]), 'و', nameOf(mt.p[1]));
  mt.p.forEach(k => sendU(k, { t: 'toast', msg: 'نتیجهٔ این بازی به‌دلیل خطای سرور ثبت نخواهد شد' }));
}
// پایان خودکار نوبت: وقتی بازیکنِ نوبتی هیچ حرکتی ندارد، سرور خودش «end» را اعمال می‌کند (مرورگر دروغگو یا بسته‌شده بازی را گیر نمی‌اندازد)
function schedAuto(mt) {
  clearTimeout(mt.autoT);
  const sim = mt.sim;
  if (!sim || sim.broken || sim.over || sim.ph !== 'play' || mt.ended) return;
  const n = mt.log.length, g0 = mt.g;
  mt.autoT = setTimeout(() => {
    if (mt.ended || mt.g !== g0 || mt.log.length !== n || !mt.sim || mt.sim.broken) return;
    const who = mt.sim.autoEnd();
    if (who >= 0) push(mt, { a: 'end', s: who });
  }, 1600);
}
// هش وضعیت هر مرورگر با هش وضعیت داور سرور مقایسه می‌شود (فقط فاز بازی)
function refHash(mt, i, m) {
  if (REF_MODE === 'off' || !mt.sim || mt.sim.broken || m.p !== 1 || m.g !== mt.g) return;
  const sh = mt.sim.hs[m.n];
  if (sh === undefined) return;
  REF_STATS.hashChecked++;
  if (sh === (m.h | 0)) { mt.refOk[i]++; return; }
  mt.refBad[i]++;
  REF_STATS.hashBad++;
  // سرور مرجع است: مرورگرِ ناهماهنگ کل تاریخچهٔ بازی را از ابتدا دوباره می‌گیرد و بازپخش می‌کند (حداکثر ۳ بار در هر بازی)
  if (STRICT) {
    mt.resync = mt.resync || [0, 0];
    if (mt.resync[i] < 3) { mt.resync[i]++; sendU(mt.p[i], { t: 'redo', g: mt.g, log: logFor(mt, i), t0: mt.t0, now: Date.now() }); }
  }
  console.log('referee: وضعیت مرورگر', nameOf(mt.p[i]), 'با داور فرق دارد - دستور', m.n);
  // فقط وقتی حریفش با داور هماهنگ است مقصر دانسته می‌شود (وگرنه احتمال خطای داور هست)
  flagMatch(mt, 'refdiff', { n: m.n, who: i }, (REF_MODE === 'enforce' && mt.refOk[1 - i] > 0) ? [i] : []);
}
function refCompare(mt, w) {
  if (REF_MODE === 'off' || !mt.simDone) return;
  if (mt.simWin === w) { REF_STATS.resOk++; return; }
  REF_STATS.resBad++;
  console.log('referee: نتیجهٔ داور (' + mt.simWin + ') با نتیجهٔ ثبت‌شده (' + w + ') فرق دارد:', nameOf(mt.p[0]), 'و', nameOf(mt.p[1]));
  flagMatch(mt, 'refres', { sim: mt.simWin, rec: w }, []);
}
function resumeMatch(mt, k, ws) {
  const i = mt.p.indexOf(k); clearTimeout(mt.tmr[i]);
  send(ws, { t: 'match', me: i, opp: nameOf(mt.p[1 - i]) });
  send(ws, { t: 'hello', g: mt.g, log: logFor(mt, i), t0: mt.t0, now: Date.now() });
  if (mt.abort) send(ws, mt.abort);
  send(ws, { t: 'opp', on: conns.has(mt.p[1 - i]) });
  sendU(mt.p[1 - i], { t: 'opp', on: true });
}
function abort(mt, winner, by, reason) {
  if (mt.ended) return;
  mt.ended = true; mt.abort = { t: 'abort', winner, by, reason };
  clearTimeout(mt.draftT); clearTimeout(mt.autoT);
  if (mt.sim) { try { mt.sim.dispose(); } catch (_) {} }
  clearTimeout(mt.resT);
  mt.p.forEach(k => sendU(k, mt.abort));
  if (!mt.counted) record(mt, winner, true);          // تسلیم یا قطع اتصال را خود سرور می‌بیند
}

/* ---------- ثبت نتیجه ----------
   مرورگر هر بازیکن در پایان بازی خودکار نتیجه را می‌فرستد؛ سرور فقط وقتی ثبت می‌کند که هر دو یکی بگویند
   (یکی «برد» و دیگری «باخت»، یا هر دو «مساوی»). اگر ناهمخوان باشند ثبت نمی‌شود.
   اگر فقط یکی گزارش بدهد، بعد از ۳۰ ثانیه همان گزارش پذیرفته می‌شود. */
const RES = new Set(['win', 'loss', 'draw']);
function record(mt, w, trusted) {                // w: ۰ یا ۱ = برنده، -۱ = مساوی ؛ trusted: نتیجه را خود سرور دیده (تسلیم/قطع اتصال)
  if (mt.counted) return;
  refCompare(mt, w);
  mt.counted = true; clearTimeout(mt.resT);
  if (mt.noRec && !trusted) { console.log('بازی ناهمگام بود؛ نتیجه ثبت نشد:', nameOf(mt.p[0]), 'و', nameOf(mt.p[1]), '(دستور ' + (mt.desync && mt.desync.n) + ')'); return; }
  if (!mt.official) return;                      // نبرد دوستانه: هیچ اثری روی برد و جام ندارد
  if (pairCapHit(mt)) {                          // سقف روزانه بین دو حساب (جلوگیری از جام‌سازی با هماهنگی)
    mt.p.forEach(k => sendU(k, { t: 'toast', msg: 'سقف روزانهٔ نبرد رسمی با این حریف پر شده؛ این بازی ثبت نشد' }));
    return;
  }
  mt.p.forEach((k, i) => {
    const u = db.users[k]; if (!u) return;
    if (w === i) u.ow = (u.ow | 0) + 1;          // فقط بردِ مسابقهٔ رسمی
    else if (w < 0) u.od = (u.od | 0) + 1;       // مساوی رسمی (برای درصد برد)
    else u.ol = (u.ol | 0) + 1;                  // باخت رسمی (برای درصد برد)
  });
  save();
  mt.p.forEach(k => { pushFL(k); pushFriendsOf(k); });
}
// جام: فقط با این تابع و فقط از مسابقات رسمی/تورنمنت اضافه می‌شود (نبرد دوستانه هرگز آن را صدا نمی‌زند)
function awardTrophy(k, n = 1) {
  const u = db.users[k]; if (!u) return;
  u.tr = (u.tr | 0) + n; save(); pushFL(k); pushFriendsOf(k);
}
function report(mt, i, m) {
  if (mt.ended || mt.counted || !RES.has(m.r) || m.g !== mt.g) return;
  // STRICT: وقتی داور سالم است نتیجه فقط از خود سرور می‌آید؛ ادعای مرورگر (حتی هماهنگ دو نفر) تأثیری ندارد
  if (STRICT && REF_MODE === 'enforce' && mt.sim && !mt.sim.broken) return;
  mt.res[i] = m.r;
  const a = mt.res[0], b = mt.res[1];
  if (a && b) {
    if (a === 'win' && b === 'loss') return record(mt, 0);
    if (a === 'loss' && b === 'win') return record(mt, 1);
    if (a === 'draw' && b === 'draw') return record(mt, -1);
    mt.counted = true; clearTimeout(mt.resT);    // ناهمخوان: ثبت نمی‌شود
    console.log('نتیجهٔ ناهمخوان؛ ثبت نشد:', nameOf(mt.p[0]), a, '|', nameOf(mt.p[1]), b);
    flagMatch(mt, 'mismatch', { res: [a, b] });
  } else if (!mt.resT) {
    mt.rlen = mt.log.length;
    mt.resT = setTimeout(() => {
      mt.resT = null;
      if (mt.counted || mt.ended) return;
      const a2 = mt.res[0], b2 = mt.res[1];
      if (a2 && b2) return;
      const j = a2 ? 0 : 1, r = mt.res[j];
      if (!r) return;
      // گزارش تک‌طرفهٔ «باخت» امن است (کسی به ضرر خودش دروغ نمی‌گوید)؛ «برد» و «مساوی» تک‌طرفه هرگز پذیرفته نمی‌شود
      if (r === 'loss') return record(mt, 1 - j);
      // ادعای برد/مساوی بدون تأیید حریف، در حالی که بازی بعد از ادعا ادامه داشته → مشکوک
      if (mt.log.length > mt.rlen) flagMatch(mt, 'lone', { claim: r }, [j]);
    }, 30000);
  }
}
// مقایسهٔ هش وضعیت دو مرورگر (فقط فاز بازی)؛ ناهمخوانی = دستکاری یا باگ → بازی ثبت نمی‌شود (HASH_STRICT=0: فقط لاگ)
const HASH_STRICT = process.env.HASH_STRICT !== '0';
function checkHash(mt, i, m) {
  if (m.p !== 1 || m.g !== mt.g || !Number.isInteger(m.n) || m.n < 0 || m.n > 6000 || !Number.isInteger(m.h)) return;
  const e = mt.hs.get(m.n) || [undefined, undefined];
  e[i] = m.h; mt.hs.set(m.n, e);
  if (!mt.desync && e[0] !== undefined && e[1] !== undefined && e[0] !== e[1]) {
    mt.desync = { n: m.n };
    console.log('ناهمگامی در بازی', nameOf(mt.p[0]), 'و', nameOf(mt.p[1]), '- دستور', m.n);
    if (HASH_STRICT) mt.noRec = true;
    flagMatch(mt, 'desync', { n: m.n });
  }
}

/* ---------- پرچم‌گذاری بازی‌های مشکوک ----------
   هر بازیِ مشکوک (ناهمگامی، نتیجهٔ ناهمخوان، ادعای برد بدون تأیید، سیل دستور) با لاگ کاملش ذخیره می‌شود
   (Upstash: ۳۰ روز، وگرنه پوشهٔ flags کنار data.json) و برای هر حساب شمارنده‌اش (فقط مسابقات رسمی) بالا می‌رود.
   مشاهده: GET /admin/flags?k=ADMIN_KEY (یا هدر x-admin-key) ؛ جزئیات یک بازی: /admin/flag?id=...&k=ADMIN_KEY
   اگر ADMIN_KEY تنظیم نشده باشد، این آدرس‌ها غیرفعال‌اند. */
const RATE_MAX = 15, CMD_MAX = 2500;                       // دستور در ثانیه و دستور در هر بازی برای هر بازیکن
const PAIR_CAP = Math.max(1, parseInt(process.env.PAIR_DAILY_CAP, 10) || 5);   // بازی رسمی ثبت‌شده بین هر دو حساب در روز
const ADMIN_KEY = String(process.env.ADMIN_KEY || '');
const FLAG_DIR = path.join(path.dirname(DATA), 'flags');
function persistFlag(rec) {
  const s = JSON.stringify(rec);
  if (USE_REDIS) return redis(['SET', 'jangsalar:flag:' + rec.id, s, 'EX', 2592000]).catch(e => console.error('ذخیرهٔ پرچم ناموفق:', e.message));
  fs.mkdir(FLAG_DIR, { recursive: true }, () => fs.writeFile(path.join(FLAG_DIR, rec.id + '.json'), s, () => {}));
}
function flagMatch(mt, kind, extra = {}, blame = [0, 1]) {
  const tag = kind + (extra.who != null ? extra.who : '');
  if (mt.flagged.has(tag)) return;
  mt.flagged.add(tag);
  const id = Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
  const names = mt.p.map(nameOf);
  const head = { id, ts: Date.now(), kind, official: !!mt.official, p: names, g: mt.g, ...extra };
  db.flags = db.flags || [];
  db.flags.unshift(head); if (db.flags.length > 300) db.flags.length = 300;
  if (mt.official) blame.forEach(i => {
    const u = db.users[mt.p[i]]; if (!u) return;
    u.fl = u.fl || {}; u.fl[kind] = (u.fl[kind] | 0) + 1;
  });
  save();
  persistFlag({ ...head, log: mt.log.slice(0, 4000) });
  console.log('بازی مشکوک (' + kind + '):', names.join(' / '), 'id=' + id);
}
function pairCapHit(mt) {
  const day = new Date().toISOString().slice(0, 10);
  if (!db.pc || db.pc.d !== day) db.pc = { d: day, m: {} };
  const k = [...mt.p].sort().join('|');
  if ((db.pc.m[k] | 0) >= PAIR_CAP) return true;
  db.pc.m[k] = (db.pc.m[k] | 0) + 1;
  return false;
}
const adminOk = v => crypto.timingSafeEqual(crypto.createHash('sha256').update(String(v || '')).digest(), crypto.createHash('sha256').update(ADMIN_KEY).digest());
async function adminView(p, q, res) {
  const out = o => { res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(o, null, 1)); };
  if (p === '/admin/flags') {
    const users = Object.values(db.users).filter(u => u.fl).map(u => {
      const n = Object.values(u.fl).reduce((a, b) => a + b, 0);
      return { name: u.name, id: u.id || '', official_matches: u.mg | 0, flags: u.fl, ratio: +(n / Math.max(1, u.mg | 0)).toFixed(2) };
    }).sort((a, b) => b.ratio - a.ratio);
    return out({ users, recent: (db.flags || []).slice(0, 100) });
  }
  const id = String(q.get('id') || '');
  if (!/^[a-z0-9]{6,30}$/.test(id)) { res.writeHead(400).end('bad id'); return; }
  try {
    let s;
    if (USE_REDIS) s = await redis(['GET', 'jangsalar:flag:' + id]);
    else s = await new Promise(r => fs.readFile(path.join(FLAG_DIR, id + '.json'), 'utf8', (e, d) => r(e ? null : d)));
    if (!s) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(s);
  } catch (e) { res.writeHead(500).end('error'); }
}
const CMDS = new Set(['cell', 'ab', 'shop', 'spc', 'cast', 'dr', 'to', 'end']);

function inGame(ws, m) {
  const me = ws.u, mt = inMatch.get(me); if (!mt) return;
  const i = mt.p.indexOf(me);
  if (m.t === 'cmd') {
    if (mt.ended || !m.c || typeof m.c !== 'object' || !CMDS.has(m.c.a) || !mt.log.length) return;
    if (JSON.stringify(m.c).length > 4000) return;   // سقف حجم هر دستور (جلوگیری از پر شدن حافظه)
    if (m.c.o != null && m.c.o !== i) return;   // انتخاب هم‌زمان: هر بازیکن فقط برای خودش دستور می‌دهد
    const now = Date.now(), r = mt.rl[i];       // محدودیت سرعت و سقف دستور هر بازیکن (جلوگیری از پر کردن لاگ بازی)
    if (now - r.t >= 1000) { r.t = now; r.n = 0; }
    if (r.n >= RATE_MAX || mt.cnt[i] >= CMD_MAX) {
      if (!mt.flagged.has('flood' + i)) flagMatch(mt, 'flood', { who: i }, [i]);
      return;
    }
    r.n++; mt.cnt[i]++;
    // زمان‌سنجِ چیدن را سرور تعیین می‌کند: «to» از طرف مرورگر فقط بعد از پایان واقعی مهلت (۱۶۰ ثانیه از شروع) پذیرفته می‌شود
    if (STRICT && m.c.a === 'to' && mt.sim && !mt.sim.broken && mt.sim.ph !== 'play' && Date.now() < mt.t0 + 160000) return;
    if (PRE_MODE !== 'off' && mt.sim && !mt.sim.broken) {      // پیش‌اعتبارسنجی با داور، قبل از پخش
      PRE_STATS.checked++;
      const why = mt.sim.check(m.c, i);
      if (why) {
        PRE_STATS.bad++; PRE_STATS.reasons[why] = (PRE_STATS.reasons[why] | 0) + 1;
        if (PRE_STATS.bad <= 50) console.log('prevalidate(' + PRE_MODE + '):', why, nameOf(me), JSON.stringify(m.c).slice(0, 160));
        if (PRE_MODE === 'enforce') {
          PRE_STATS.dropped++;
          if (++mt.pre[i] >= 25 && !mt.flagged.has('prebad' + i)) flagMatch(mt, 'prebad', { who: i }, [i]);
          return;
        }
      }
    }
    push(mt, { ...m.c, s: i });                 // مُهر فرستنده را فقط سرور می‌زند؛ مرورگرها در فاز بازی دستور غیرِ بازیکنِ نوبتی را رد می‌کنند
  } else if (m.t === 'h') {
    if (!Number.isInteger(m.g) || !Number.isInteger(m.n) || !Number.isInteger(m.h)) return;
    if (!mt.v2 || m.n >= mt.hideEnd) sendU(mt.p[1 - i], { t: 'h', g: m.g, n: m.n, h: m.h });   // هش‌های فاز پنهانِ چیدن رد و بدل نمی‌شود
    checkHash(mt, i, m);
    refHash(mt, i, m);
  } else if (m.t === 'result') {
    report(mt, i, m);
  } else if (m.t === 'forfeit') {
    abort(mt, 1 - i, i, 'forfeit');
  } else if (m.t === 'leave') {
    clearTimeout(mt.tmr[i]); inMatch.delete(me);
    const o = mt.p[1 - i]; if (inMatch.get(o) === mt) sendU(o, { t: 'opp', on: false });
    else if (mt.sim) { try { mt.sim.dispose(); } catch (_) {} }     // هر دو رفته‌اند: شبیه‌ساز دیگر لازم نیست
    pushFL(me); pushFriendsOf(me);
  }
}

/* ---------- WebSocket ---------- */
process.on('uncaughtException', e => console.error('uncaughtException', e && e.stack || e));
process.on('unhandledRejection', e => console.error('unhandledRejection', e && e.stack || e));
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });
wss.on('connection', (ws, req) => {
  req.ip = clientIp(req);
  ws.u = null; ws.tries = 0; ws.searches = 0; ws.isAlive = true; ws.ip = req.ip; ws.msgs = 0;
  if (!ipConnOk(ws.ip)) return ws.close(1013);
  ws.on('close', () => ipConnDone(ws.ip));
  ws.on('error', () => {});
  ws.on('pong', () => (ws.isAlive = true));
  ws.on('message', raw => {
    try {
      if (++ws.msgs > 600) return ws.close(1008);           // سیل پیام (در هر دقیقه)
      handleMsg(ws, raw);
    } catch (e) { console.error('msg error', e && e.stack || e); }
  });
});
function handleMsg(ws, raw) {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m !== 'object' || typeof m.t !== 'string') return;
    if (m.t === 'auth' || m.t === 'resume') { auth(ws, m).catch(e => console.error('auth error', e && e.stack || e)); return; }
    if (!ws.u) return;
    const me = ws.u;
    switch (m.t) {
      case 'fadd': case 'facc': case 'fdec': case 'frem': return friends(ws, m);
      case 'mrd': { const x = (db.users[me].mail || []).find(e => e.id === m.id); if (x && !x.read) { x.read = true; save(); pushMail(me); } return; }
      case 'mdel': { const a = db.users[me].mail || []; const i = a.findIndex(e => e.id === m.id); if (i >= 0) { a.splice(i, 1); save(); pushMail(me); } return; }
      case 'search': return search(ws, m);
      case 'setid': return setId(ws, m);
      case 'setname': return setName(ws, m);
      case 'setcol': return setCol(ws, m);
      case 'setcc': return setCc(ws, m);
      case 'setav': return setAv(ws, m);
      case 'chpw': return chPw(ws, m);
      case 'pfget': { const k = resolveUser(m.u); if (k) send(ws, { t: 'pf', p: profileOf(me, k) }); return; }
      case 'clcreate': case 'clsetsy': case 'clfind': case 'cljoin': case 'clinv': case 'clacc': case 'cldec': case 'clsay': case 'clleave': return clans(ws, m);
      case 'inv': return invite(ws, m);
      case 'invcancel': { const v = invOut.get(me); if (v) endInv(v, 'cancel'); return; }
      case 'invdec': { const v = invIn.get(me); if (v && v.from === key(m.u)) endInv(v, 'declined'); return; }
      case 'invacc': {
        const v = invIn.get(me); if (!v || v.from !== key(m.u)) return;
        endInv(v, null);
        if (!conns.has(v.from) || inMatch.has(v.from) || inMatch.has(me)) return toast(ws, 'دعوت دیگر معتبر نیست');
        return newMatch(v.from, me);
      }
      case 'logout': delete db.sessions[ws.tok]; save(); return leaveSession(ws);
      case 'cap': ws.cap = Math.min(9, m.v | 0); return;      // نسخهٔ قابلیت‌های مرورگر (۲ = شانس سروری + چیدن پنهان)
      case 'cmd': case 'h': case 'result': case 'forfeit': case 'leave': return inGame(ws, m);
    }
}
wss.on('connection', ws => ws.on('close', () => leaveSession(ws)));
setInterval(() => wss.clients.forEach(w => { w.searches = 0; w.msgs = 0; }), 60000);
setInterval(() => { pruneSessions(); rlSweep(); }, 3600000);
setInterval(() => wss.clients.forEach(w => { if (!w.isAlive) return w.terminate(); w.isAlive = false; w.ping(); }), 10000);

loadDb().then(() => server.listen(PORT, () => console.log('http://localhost:' + PORT)));
