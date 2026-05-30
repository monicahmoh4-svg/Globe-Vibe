// GlobeVibe — Backend API (Vercel Serverless)
// MODEL: Pay ONE activation fee → unlock ALL foreigners forever → earn KES per message sent
import express from 'express';
import cors    from 'cors';
import bcrypt  from 'bcryptjs';
import jwt     from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import axios   from 'axios';
import pkg     from 'pg';
const { Pool } = pkg;

// ─── DB ───────────────────────────────────────────────────────────────────────
let _pool, _ready = false;
const pool = () => {
  if (!_pool) _pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false }, max: 3 });
  return _pool;
};
const q  = (sql, p = []) => pool().query(sql, p).then(r => r.rows);
const q1 = (sql, p = []) => q(sql, p).then(r => r[0] || null);

async function initDB() {
  if (_ready) return;

  // Core tables
  await pool().query(`
    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      email        TEXT UNIQUE NOT NULL,
      password     TEXT NOT NULL,
      country      TEXT DEFAULT '',
      country_code TEXT DEFAULT '',
      bio          TEXT DEFAULT '',
      avatar       TEXT DEFAULT '',
      balance      NUMERIC(12,2) DEFAULT 0,
      total_earned NUMERIC(12,2) DEFAULT 0,
      is_online    BOOLEAN DEFAULT false,
      is_foreigner BOOLEAN DEFAULT false,
      is_banned    BOOLEAN DEFAULT false,
      is_verified  BOOLEAN DEFAULT false,
      is_activated BOOLEAN DEFAULT false,
      activated_at TIMESTAMPTZ,
      rating       NUMERIC(3,1) DEFAULT 5.0,
      total_chats  INT DEFAULT 0,
      language     TEXT DEFAULT 'English',
      interests    TEXT DEFAULT '[]',
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      last_seen    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS connections (
      id             TEXT PRIMARY KEY,
      user_id        TEXT REFERENCES users(id) ON DELETE CASCADE,
      foreigner_id   TEXT REFERENCES users(id) ON DELETE CASCADE,
      status         TEXT DEFAULT 'active',
      expires_at     TIMESTAMPTZ,
      created_at     TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id            TEXT PRIMARY KEY,
      connection_id TEXT REFERENCES connections(id) ON DELETE CASCADE,
      sender_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
      content       TEXT NOT NULL,
      is_read       BOOLEAN DEFAULT false,
      earned_amount NUMERIC(12,2) DEFAULT 0,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id                  TEXT PRIMARY KEY,
      user_id             TEXT REFERENCES users(id) ON DELETE CASCADE,
      amount              NUMERIC(12,2) NOT NULL,
      phone               TEXT,
      mpesa_ref           TEXT,
      checkout_request_id TEXT,
      status              TEXT DEFAULT 'pending',
      type                TEXT NOT NULL,
      description         TEXT,
      created_at          TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id           TEXT PRIMARY KEY,
      user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
      amount       NUMERIC(12,2) NOT NULL,
      phone        TEXT NOT NULL,
      status       TEXT DEFAULT 'pending',
      admin_note   TEXT DEFAULT '',
      processed_at TIMESTAMPTZ,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY, value TEXT NOT NULL,
      description TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reports (
      id          TEXT PRIMARY KEY,
      reporter_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      reported_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL, description TEXT DEFAULT '',
      status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS foreigner_applications (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      bio TEXT DEFAULT '', languages TEXT DEFAULT '',
      motivation TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Safe column migrations for existing databases
  await pool().query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_activated BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS earned_amount NUMERIC(12,2) DEFAULT 0;
  `).catch(() => {});

  // Default settings
  for (const [k, v, d] of [
    ['activation_fee',          '100',       'One-time activation fee in KES to unlock all chats'],
    ['earning_per_message',     '3',         'KES earned per message sent while chatting'],
    ['max_earn_per_session',    '500',       'Max KES a user can earn per chat session'],
    ['min_withdrawal',          '200',       'Minimum wallet withdrawal (KES)'],
    ['chat_duration_hours',     '72',        'Hours a chat session stays active after starting'],
    ['platform_name',           'GlobeVibe', 'Site name'],
    ['maintenance_mode',        'false',     'Take platform offline'],
    ['allow_registration',      'true',      'Allow new signups'],
    ['auto_approve_foreigners', 'true',      'Auto-approve foreigner applications'],
  ]) {
    await pool().query(
      `INSERT INTO platform_settings(key,value,description) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,
      [k, v, d]
    );
  }

  // Default admin
  if (!await q1(`SELECT id FROM admins WHERE username='admin'`)) {
    await pool().query(`INSERT INTO admins(id,username,password) VALUES($1,$2,$3)`,
      [uuidv4(), 'admin', await bcrypt.hash('GlobeVibe@Admin2024', 10)]);
  }

  // Seed foreigners — real profiles from various countries, many wanting to learn Kiswahili
  const { rows: [{ cnt }] } = await pool().query(`SELECT COUNT(*)::int cnt FROM users WHERE is_foreigner=true`);
  if (cnt === 0) {
    const foreigners = [
      // Kiswahili learners from English-speaking countries
      { name: 'James Mitchell',   country: 'United States', code: 'US', lang: 'English',          bio: "Hey! I'm James from New York. I'm lonely here and fascinated by East African culture. Please teach me Kiswahili — I already know 'Jambo' and 'Asante'! 😄",                          i: '["kiswahili","travel","culture","music"]' },
      { name: 'Sarah Campbell',   country: 'Canada',        code: 'CA', lang: 'English, French',   bio: "Hi from Toronto! Learning Kiswahili is my 2024 resolution. I love African music and food. Can we be language exchange friends? Karibu! 🍁",                                          i: '["kiswahili","food","music","languages"]' },
      { name: 'Michael Brown',    country: 'United Kingdom', code: 'GB', lang: 'English',           bio: "British guy from London who fell in love with East Africa after a documentary. I want to learn Swahili and understand Kenyan culture. Teach me! 🇬🇧",                                i: '["kiswahili","culture","documentary","travel"]' },
      { name: 'Emily Johnson',    country: 'Australia',     code: 'AU', lang: 'English',            bio: "G\'day! I\'m Emily from Sydney. Single and curious about Africa. Kiswahili sounds so beautiful — help me learn it and tell me about Kenya! 🦘",                                     i: '["kiswahili","kenya","travel","learning"]' },
      { name: 'Daniel Williams',  country: 'United States', code: 'US', lang: 'English, Spanish',  bio: "Habari! I\'m Daniel from California. I study linguistics and Swahili is my next language. Looking for a friendly Kenyan to practice with daily! 🌴",                                i: '["kiswahili","linguistics","culture","sports"]' },
      { name: 'Jessica Taylor',   country: 'Canada',        code: 'CA', lang: 'English',            bio: "Hello from Vancouver! I visited Nairobi last year and fell in love with Kenya. Back home now and lonely — teach me Swahili and let\'s stay connected! ❤️",                          i: '["kiswahili","nairobi","travel","food"]' },
      { name: 'Thomas Anderson',  country: 'United States', code: 'US', lang: 'English',            bio: "Hi! Tom from Chicago. I\'m retired and looking for meaningful connections. I\'d love to learn Kiswahili and hear stories about Kenyan life and wildlife! 🦁",                     i: '["kiswahili","wildlife","history","culture"]' },
      { name: 'Laura Martinez',   country: 'United States', code: 'US', lang: 'English, Spanish',  bio: "Hola y Jambo! I\'m Laura, half Mexican half American. I\'m in love with African cultures. Let\'s chat and you can teach me some Swahili! I\'m lonely! 🌍",                        i: '["kiswahili","cultures","dance","food"]' },
      // Europeans
      { name: 'Hans Mueller',     country: 'Germany',       code: 'DE', lang: 'German, English',   bio: "Guten Tag! I\'m Hans from Berlin. Planning a trip to Kenya next year and want to learn Kiswahili before I go. Looking for a patient teacher and friend! 🇩🇪",                     i: '["kiswahili","travel","safari","languages"]' },
      { name: 'Sophie Laurent',   country: 'France',        code: 'FR', lang: 'French, English',   bio: "Bonjour! Lonely Parisian girl fascinated by African languages. I\'m slowly learning Kiswahili on apps but need a real human to practice with! 🥐",                                  i: '["kiswahili","languages","art","cuisine"]' },
      { name: 'Emma Johansson',   country: 'Sweden',        code: 'SE', lang: 'Swedish, English',  bio: "Hej! Nordic girl who loves deep conversations and new cultures. I want to learn Kiswahili because it sounds like poetry. Be my language partner! ❄️",                              i: '["kiswahili","languages","sustainability","music"]' },
      { name: 'Marco Rossi',      country: 'Italy',         code: 'IT', lang: 'Italian, English',  bio: "Ciao! Italian guy from Rome who loves languages. I speak 4 already and Kiswahili is next! Looking for a Kenyan friend to chat and learn with. Sawa? 🍕",                           i: '["kiswahili","languages","history","food"]' },
      // Asia & Others
      { name: 'Yuki Tanaka',      country: 'Japan',         code: 'JP', lang: 'Japanese, English', bio: "Konnichiwa! I am lonely working-from-home and discovered Kiswahili by accident. Now I\'m obsessed! Teach me please! I will teach you some Japanese too 🗾",                     i: '["kiswahili","japanese","anime","culture"]' },
      { name: 'Priya Sharma',     country: 'India',         code: 'IN', lang: 'Hindi, English',    bio: "Namaste! I\'m Priya from Mumbai. There\'s a huge Swahili-speaking community in India\'s history. I want to learn Kiswahili and connect with Kenya! 🇮🇳",                        i: '["kiswahili","history","bollywood","languages"]' },
      { name: 'Carlos Mendoza',   country: 'Mexico',        code: 'MX', lang: 'Spanish, English',  bio: "Hola! I\'m Carlos from Mexico City. I\'m lonely and looking for friends from Africa. Teach me Kiswahili — I\'ll teach you Spanish in return! 🌮",                                i: '["kiswahili","spanish","music","food"]' },
      { name: 'Amara Osei',       country: 'Ghana',         code: 'GH', lang: 'English, Twi',      bio: "Akwaaba! I\'m Amara from Accra. We Africans should connect more! I want to learn East African Kiswahili and share Ghanaian culture. Let\'s chat! 🇬🇭",                           i: '["kiswahili","africa","culture","music"]' },
    ];

    for (const f of foreigners) {
      const slug   = f.name.toLowerCase().replace(/[^a-z]/g, '');
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(f.name)}`;
      await pool().query(
        `INSERT INTO users(id,name,email,password,country,country_code,bio,avatar,language,interests,is_foreigner,is_verified)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,true) ON CONFLICT DO NOTHING`,
        [uuidv4(), f.name, `${slug}@globevibe.com`, await bcrypt.hash('password123', 10),
         f.country, f.code, f.bio, avatar, f.lang, f.i]
      );
    }
  }

  _ready = true;
}

const setting = async k => (await q1(`SELECT value FROM platform_settings WHERE key=$1`, [k]))?.value ?? null;

// ─── Auth helpers ─────────────────────────────────────────────────────────────
const JS  = process.env.JWT_SECRET       || 'gv_dev_secret_change_in_prod';
const AJS = process.env.ADMIN_JWT_SECRET || 'gv_admin_dev_change_in_prod';
const signUser  = id => jwt.sign({ id }, JS,  { expiresIn: '7d' });
const signAdmin = id => jwt.sign({ id }, AJS, { expiresIn: '8h' });

const authUser = async (req, res, next) => {
  const t = req.headers.authorization?.split(' ')[1];
  if (!t) return res.status(401).json({ error: 'Token required' });
  try {
    const { id } = jwt.verify(t, JS);
    const u = await q1(`SELECT * FROM users WHERE id=$1`, [id]);
    if (!u)          return res.status(401).json({ error: 'User not found' });
    if (u.is_banned) return res.status(403).json({ error: 'Account suspended' });
    req.user = u; next();
  } catch { res.status(403).json({ error: 'Invalid token' }); }
};

const authAdmin = async (req, res, next) => {
  const t = req.headers.authorization?.split(' ')[1];
  if (!t) return res.status(401).json({ error: 'Token required' });
  try {
    const { id } = jwt.verify(t, AJS);
    const a = await q1(`SELECT * FROM admins WHERE id=$1`, [id]);
    if (!a) return res.status(401).json({ error: 'Admin not found' });
    req.admin = a; next();
  } catch { res.status(403).json({ error: 'Invalid token' }); }
};

// ─── M-Pesa STK Push ─────────────────────────────────────────────────────────
async function stkPush(phone, amount, ref, desc) {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0'))    p = '254' + p.slice(1);
  if (p.startsWith('+'))    p = p.slice(1);
  if (!p.startsWith('254')) p = '254' + p;
  try {
    const r = await axios.post(
      `${process.env.LIPANA_BASE_URL || 'https://api.lipanatechnologies.dev'}/v1/stk-push`,
      { phone: p, amount: Math.ceil(amount), account_reference: ref, transaction_desc: desc,
        shortcode: process.env.LIPANA_SHORTCODE, passkey: process.env.LIPANA_PASSKEY },
      { headers: { Authorization: `Bearer ${process.env.LIPANA_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 30000 }
    );
    return { ok: true, data: r.data };
  } catch (e) {
    return { ok: false, error: e.response?.data?.message || 'STK Push failed' };
  }
}

// ─── Activate user account (called after payment confirmed) ───────────────────
async function activateUser(userId, mpesaRef) {
  await pool().query(
    `UPDATE users SET is_activated=true, activated_at=NOW() WHERE id=$1`,
    [userId]
  );
  await pool().query(
    `UPDATE transactions SET status='completed', mpesa_ref=$1 WHERE user_id=$2 AND type='activation_fee' AND status='pending'`,
    [mpesaRef, userId]
  );
  console.log(`✅ User ${userId} activated`);
}

// ─── Express ──────────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.options('*', cors());
app.use(async (_, __, next) => { try { await initDB(); } catch (e) { console.error('DB init:', e.message); } next(); });

app.get('/api/health', (_, res) => res.json({ ok: true, app: 'GlobeVibe', ts: new Date() }));

// Public settings
app.get('/api/public/settings', async (_, res) => {
  try {
    const fee        = await setting('activation_fee');
    const earnPerMsg = await setting('earning_per_message');
    const minW       = await setting('min_withdrawal');
    res.json({ activation_fee: parseFloat(fee || '100'), earn_per_message: parseFloat(earnPerMsg || '3'), min_withdrawal: parseFloat(minW || '200') });
  } catch { res.json({ activation_fee: 100, earn_per_message: 3, min_withdrawal: 200 }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    if (await setting('allow_registration') === 'false')
      return res.status(403).json({ error: 'Registration is currently disabled' });

    const { name, email, password, country, country_code = '', language = 'English', bio = '', is_foreigner = false } = req.body;
    if (!name || !email || !password || !country)
      return res.status(400).json({ error: 'Name, email, password and country are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (await q1(`SELECT id FROM users WHERE email=$1`, [email.toLowerCase()]))
      return res.status(400).json({ error: 'Email already registered' });

    const id     = uuidv4();
    const hash   = await bcrypt.hash(password, 10);
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
    const setForeigner = Boolean(is_foreigner);

    await pool().query(
      `INSERT INTO users(id,name,email,password,country,country_code,language,bio,avatar,is_foreigner)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, name, email.toLowerCase(), hash, country, country_code, language, bio, avatar, setForeigner]
    );

    const user = await q1(
      `SELECT id,name,email,country,country_code,bio,avatar,balance,total_earned,is_foreigner,is_verified,is_activated,language,interests,created_at FROM users WHERE id=$1`,
      [id]
    );
    res.status(201).json({ user, token: signUser(id), message: 'Welcome to GlobeVibe 🌍' });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Registration failed' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const u = await q1(`SELECT * FROM users WHERE email=$1`, [email.toLowerCase()]);
    if (!u || !await bcrypt.compare(password, u.password))
      return res.status(401).json({ error: 'Invalid email or password' });
    if (u.is_banned) return res.status(403).json({ error: 'Account suspended. Contact support.' });
    await pool().query(`UPDATE users SET is_online=true, last_seen=NOW() WHERE id=$1`, [u.id]);
    const { password: _, ...safe } = u;
    res.json({ user: safe, token: signUser(u.id) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Login failed' }); }
});

app.post('/api/auth/logout', authUser, async (req, res) => {
  await pool().query(`UPDATE users SET is_online=false, last_seen=NOW() WHERE id=$1`, [req.user.id]);
  res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', authUser, async (req, res) => {
  const user = await q1(
    `SELECT id,name,email,country,country_code,bio,avatar,balance,total_earned,is_foreigner,is_verified,is_activated,is_online,language,interests,rating,total_chats,created_at,last_seen FROM users WHERE id=$1`,
    [req.user.id]
  );
  res.json({ user });
});

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/users/foreigners', authUser, async (req, res) => {
  try {
    const { search = '', page = 1, limit = 12 } = req.query;
    const like = `%${search}%`, lim = parseInt(limit), off = (parseInt(page) - 1) * lim;
    const [rows, [{ cnt }]] = await Promise.all([
      q(`SELECT id,name,country,country_code,bio,avatar,language,interests,rating,total_chats,is_online,is_verified,last_seen
         FROM users WHERE is_foreigner=true AND is_banned=false
         AND (name ILIKE $1 OR bio ILIKE $1 OR country ILIKE $1)
         ORDER BY is_online DESC, rating DESC LIMIT $2 OFFSET $3`, [like, lim, off]),
      q(`SELECT COUNT(*)::int cnt FROM users WHERE is_foreigner=true AND is_banned=false
         AND (name ILIKE $1 OR bio ILIKE $1 OR country ILIKE $1)`, [like]),
    ]);
    res.json({ foreigners: rows, total: cnt, page: parseInt(page), totalPages: Math.ceil(cnt / lim) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to fetch foreigners' }); }
});

app.get('/api/users/my/connections', authUser, async (req, res) => {
  try {
    const rows = await q(
      `SELECT c.*,
              u1.name user_name, u1.avatar user_avatar, u1.country user_country,
              u2.name foreigner_name, u2.avatar foreigner_avatar,
              u2.country foreigner_country, u2.country_code foreigner_country_code, u2.is_online foreigner_online
       FROM connections c
       JOIN users u1 ON c.user_id = u1.id JOIN users u2 ON c.foreigner_id = u2.id
       WHERE (c.user_id=$1 OR c.foreigner_id=$1) AND c.status='active'
       ORDER BY c.created_at DESC`, [req.user.id]
    );
    res.json({ connections: rows });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/users/my/transactions', authUser, async (req, res) => {
  try {
    const rows = await q(`SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`, [req.user.id]);
    res.json({ transactions: rows });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/users/my/withdraw', authUser, async (req, res) => {
  try {
    const { amount, phone } = req.body;
    const minW = parseFloat(await setting('min_withdrawal') || '200');
    if (!amount || Number(amount) < minW)
      return res.status(400).json({ error: `Minimum withdrawal is KES ${minW}` });
    const u = await q1(`SELECT balance FROM users WHERE id=$1`, [req.user.id]);
    if (parseFloat(u.balance) < Number(amount))
      return res.status(400).json({ error: 'Insufficient balance' });
    await pool().query(`UPDATE users SET balance=balance-$1 WHERE id=$2`, [amount, req.user.id]);
    await pool().query(`INSERT INTO withdrawal_requests(id,user_id,amount,phone) VALUES($1,$2,$3,$4)`,
      [uuidv4(), req.user.id, amount, phone]);
    res.json({ message: `Withdrawal of KES ${amount} submitted!` });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/users/:id', authUser, async (req, res) => {
  try {
    const u = await q1(
      `SELECT id,name,country,country_code,bio,avatar,language,interests,rating,total_chats,is_online,is_verified,is_foreigner,created_at,last_seen FROM users WHERE id=$1 AND is_banned=false`,
      [req.params.id]
    );
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json({ user: u });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/users/profile/update', authUser, async (req, res) => {
  try {
    const { name, bio, language, interests } = req.body;
    await pool().query(`UPDATE users SET name=$1,bio=$2,language=$3,interests=$4 WHERE id=$5`,
      [name || req.user.name, bio || '', language || 'English', JSON.stringify(interests || []), req.user.id]);
    const user = await q1(
      `SELECT id,name,email,country,country_code,bio,avatar,balance,total_earned,is_foreigner,is_verified,is_activated,language,interests,rating,total_chats FROM users WHERE id=$1`,
      [req.user.id]
    );
    res.json({ user, message: 'Profile updated' });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/users/profile/password', authUser, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!await bcrypt.compare(currentPassword, req.user.password))
      return res.status(400).json({ error: 'Current password incorrect' });
    if ((newPassword || '').length < 6) return res.status(400).json({ error: 'Min 6 characters' });
    await pool().query(`UPDATE users SET password=$1 WHERE id=$2`, [await bcrypt.hash(newPassword, 10), req.user.id]);
    res.json({ message: 'Password changed' });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/users/become-foreigner', authUser, async (req, res) => {
  try {
    if (req.user.is_foreigner) {
      await pool().query(`UPDATE users SET is_foreigner=false WHERE id=$1`, [req.user.id]);
      return res.json({ message: 'Removed from foreigners list.', is_foreigner: false });
    }
    const { bio = '', languages = '', motivation = '' } = req.body;
    if (bio) await pool().query(`UPDATE users SET bio=$1 WHERE id=$2`, [bio, req.user.id]);
    await pool().query(`UPDATE users SET is_foreigner=true WHERE id=$1`, [req.user.id]);
    await pool().query(
      `INSERT INTO foreigner_applications(id,user_id,bio,languages,motivation,status) VALUES($1,$2,$3,$4,$5,'approved')`,
      [uuidv4(), req.user.id, bio, languages, motivation]
    );
    res.json({ message: 'You are now listed as a foreigner on GlobeVibe!', is_foreigner: true, approved: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/users/report/:id', authUser, async (req, res) => {
  try {
    const { reason, description = '' } = req.body;
    await pool().query(`INSERT INTO reports(id,reporter_id,reported_id,reason,description) VALUES($1,$2,$3,$4,$5)`,
      [uuidv4(), req.user.id, req.params.id, reason, description]);
    res.json({ message: 'Report submitted' });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS — One-time activation fee unlocks ALL foreigners
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/payments/activate', authUser, async (req, res) => {
  try {
    // Already activated
    if (req.user.is_activated)
      return res.json({ success: true, already_activated: true, message: 'Account already activated! Browse and chat with all foreigners.' });

    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    const fee  = parseFloat(await setting('activation_fee') || '100');
    const txId = uuidv4();
    const ref  = `GV-ACT-${req.user.id.slice(0, 6).toUpperCase()}`;

    // Record pending transaction
    await pool().query(
      `INSERT INTO transactions(id,user_id,amount,phone,type,description) VALUES($1,$2,$3,$4,'activation_fee','One-time platform activation fee')`,
      [txId, req.user.id, fee, phone]
    );

    if (process.env.LIPANA_API_KEY) {
      const r = await stkPush(phone, fee, ref, 'GlobeVibe — Unlock all chats and start earning');
      if (r.ok) {
        const cid = r.data?.CheckoutRequestID || r.data?.checkout_request_id;
        if (cid) await pool().query(`UPDATE transactions SET checkout_request_id=$1, mpesa_ref=$1 WHERE id=$2`, [cid, txId]);
        return res.json({
          success: true, demo: false,
          message: `STK Push sent to ${phone}. Enter your M-Pesa PIN to activate your account.`,
          transaction_id: txId, amount: fee,
        });
      }
      await pool().query(`UPDATE transactions SET status='failed' WHERE id=$1`, [txId]);
      return res.status(400).json({ error: r.error });
    }

    // Demo mode
    res.json({
      success: true, demo: true,
      message: `[Demo] Activation fee of KES ${fee} simulated.`,
      transaction_id: txId, amount: fee,
    });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Activation failed' }); }
});

// Demo-only confirm activation
app.post('/api/payments/demo-activate/:txId', authUser, async (req, res) => {
  try {
    if (process.env.LIPANA_API_KEY)
      return res.status(403).json({ error: 'Not available in production' });
    const tx = await q1(`SELECT * FROM transactions WHERE id=$1 AND user_id=$2`, [req.params.txId, req.user.id]);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    if (req.user.is_activated) return res.json({ success: true, message: 'Already activated!' });
    await activateUser(req.user.id, 'DEMO-' + Date.now());
    res.json({ success: true, message: 'Account activated! You can now chat with all foreigners and earn 🎉' });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/payments/status/:txId', authUser, async (req, res) => {
  try {
    const tx = await q1(`SELECT * FROM transactions WHERE id=$1 AND user_id=$2`, [req.params.txId, req.user.id]);
    if (!tx) return res.status(404).json({ error: 'Not found' });
    const activated = (await q1(`SELECT is_activated FROM users WHERE id=$1`, [req.user.id]))?.is_activated;
    res.json({ transaction: tx, activated });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// Lipana callback
app.post('/api/payments/callback', async (req, res) => {
  try {
    const b   = req.body;
    const rc  = b?.Body?.stkCallback?.ResultCode ?? b?.ResultCode ?? b?.result_code;
    const cid = b?.Body?.stkCallback?.CheckoutRequestID ?? b?.CheckoutRequestID ?? b?.checkout_request_id;
    const ref = b?.Body?.stkCallback?.CallbackMetadata?.Item?.find(i => i.Name === 'MpesaReceiptNumber')?.Value ?? b?.mpesa_receipt_number;
    if (cid) {
      const tx = await q1(`SELECT * FROM transactions WHERE checkout_request_id=$1`, [cid]);
      if (tx) {
        if (rc === 0 || rc === '0') await activateUser(tx.user_id, ref || cid);
        else await pool().query(`UPDATE transactions SET status='failed' WHERE id=$1`, [tx.id]);
      }
    }
  } catch (e) { console.error('Callback error:', e.message); }
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// ─────────────────────────────────────────────────────────────────────────────
// CHATS — Start a free chat with any foreigner (if activated)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/chats/start', authUser, async (req, res) => {
  try {
    const { foreigner_id } = req.body;
    if (!foreigner_id) return res.status(400).json({ error: 'foreigner_id required' });
    if (foreigner_id === req.user.id) return res.status(400).json({ error: 'Cannot chat with yourself' });

    // Must be activated
    if (!req.user.is_activated)
      return res.status(403).json({ error: 'Account not activated. Pay the one-time fee to unlock all chats.', needs_activation: true });

    const foreigner = await q1(`SELECT id,name FROM users WHERE id=$1 AND is_foreigner=true AND is_banned=false`, [foreigner_id]);
    if (!foreigner) return res.status(404).json({ error: 'Foreigner not found' });

    // Check for existing active connection
    const existing = await q1(
      `SELECT id FROM connections WHERE user_id=$1 AND foreigner_id=$2 AND status='active' AND (expires_at IS NULL OR expires_at > NOW())`,
      [req.user.id, foreigner_id]
    );
    if (existing) return res.json({ connection_id: existing.id, already_exists: true, message: 'Chat already open!' });

    // Create new connection
    const connId = uuidv4();
    const hrs    = parseInt(await setting('chat_duration_hours') || '72');
    await pool().query(
      `INSERT INTO connections(id,user_id,foreigner_id,status,expires_at) VALUES($1,$2,$3,'active', NOW()+($4||' hours')::interval)`,
      [connId, req.user.id, foreigner_id, String(hrs)]
    );
    await pool().query(`UPDATE users SET total_chats=total_chats+1 WHERE id=$1`, [req.user.id]);
    res.status(201).json({ connection_id: connId, message: `Chat with ${foreigner.name} started!` });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to start chat' }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES — Fixed earning logic + proper error handling
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/messages/:connId', authUser, async (req, res) => {
  try {
    const { connId } = req.params;
    const { since }  = req.query;

    const cn = await q1(
      `SELECT * FROM connections WHERE id=$1 AND (user_id=$2 OR foreigner_id=$2)`,
      [connId, req.user.id]
    );
    if (!cn) return res.status(403).json({ error: 'Not authorized' });

    const msgs = since
      ? await q(
          `SELECT m.*, u.name AS sender_name, u.avatar AS sender_avatar
           FROM messages m JOIN users u ON m.sender_id=u.id
           WHERE m.connection_id=$1 AND m.created_at > $2::timestamptz
           ORDER BY m.created_at ASC`, [connId, since]
        )
      : await q(
          `SELECT m.*, u.name AS sender_name, u.avatar AS sender_avatar
           FROM messages m JOIN users u ON m.sender_id=u.id
           WHERE m.connection_id=$1 ORDER BY m.created_at ASC LIMIT 100`, [connId]
        );

    // Mark messages as read
    await pool().query(
      `UPDATE messages SET is_read=true WHERE connection_id=$1 AND sender_id!=$2 AND is_read=false`,
      [connId, req.user.id]
    );

    res.json({ messages: msgs, connection: cn });
  } catch (e) { console.error('GET messages error:', e.message); res.status(500).json({ error: 'Failed to fetch messages' }); }
});

app.post('/api/messages/:connId', authUser, async (req, res) => {
  try {
    const { connId }  = req.params;
    const { content } = req.body;

    // Validate content
    if (!content || typeof content !== 'string' || !content.trim())
      return res.status(400).json({ error: 'Message content is required' });
    if (content.length > 1000)
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });

    // Verify connection exists and user is part of it
    const cn = await q1(
      `SELECT * FROM connections WHERE id=$1 AND (user_id=$2 OR foreigner_id=$2)`,
      [connId, req.user.id]
    );
    if (!cn) return res.status(403).json({ error: 'Connection not found or not authorized' });
    if (cn.status !== 'active') return res.status(400).json({ error: 'This chat session has expired' });
    if (cn.expires_at && new Date(cn.expires_at) < new Date())
      return res.status(400).json({ error: 'Chat session has expired' });

    // ── EARNING LOGIC (only the paying user earns) ──────────────────────────
    let earned = 0;
    const isPayingUser = req.user.id === cn.user_id;

    if (isPayingUser) {
      try {
        const earnPerMsg    = parseFloat(await setting('earning_per_message') || '3');
        const maxPerSession = parseFloat(await setting('max_earn_per_session') || '500');

        // How much has this user already earned in this session
        const earnRow = await q1(
          `SELECT COALESCE(SUM(earned_amount), 0) AS total FROM messages WHERE connection_id=$1 AND sender_id=$2`,
          [connId, req.user.id]
        );
        const sessionEarned = parseFloat(earnRow?.total || 0);

        if (sessionEarned < maxPerSession) {
          const remaining = maxPerSession - sessionEarned;
          earned = parseFloat(Math.min(earnPerMsg, remaining).toFixed(2));

          if (earned > 0) {
            // Credit wallet
            await pool().query(
              `UPDATE users SET balance=balance+$1, total_earned=total_earned+$1 WHERE id=$2`,
              [earned, req.user.id]
            );

            // Record earning transaction every 10 messages
            const countRow = await q1(
              `SELECT COUNT(*)::int AS cnt FROM messages WHERE connection_id=$1 AND sender_id=$2`,
              [connId, req.user.id]
            );
            const msgCount = parseInt(countRow?.cnt || 0);
            if (msgCount === 0 || msgCount % 10 === 9) {
              await pool().query(
                `INSERT INTO transactions(id,user_id,amount,status,type,description) VALUES($1,$2,$3,'completed','chat_earning',$4)`,
                [uuidv4(), req.user.id, earned, `Chat earning — ${msgCount + 1} messages sent`]
              );
            }
          }
        }
      } catch (earnError) {
        console.error('Earning error (non-fatal):', earnError.message);
        earned = 0; // Don't block message if earning fails
      }
    }

    // Save the message
    const msgId = uuidv4();
    await pool().query(
      `INSERT INTO messages(id,connection_id,sender_id,content,earned_amount) VALUES($1,$2,$3,$4,$5)`,
      [msgId, connId, req.user.id, content.trim(), earned]
    );

    // Fetch the saved message with sender info
    const saved = await q1(
      `SELECT m.*, u.name AS sender_name, u.avatar AS sender_avatar FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.id=$1`,
      [msgId]
    );

    res.status(201).json({ message: saved, earned, is_earning: isPayingUser && earned > 0 });
  } catch (e) {
    console.error('POST message error:', e.message, e.stack);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

app.get('/api/messages/unread/count', authUser, async (req, res) => {
  try {
    const row = await q1(
      `SELECT COUNT(*)::int AS cnt FROM messages m JOIN connections c ON m.connection_id=c.id
       WHERE (c.user_id=$1 OR c.foreigner_id=$1) AND m.sender_id!=$1 AND m.is_read=false`,
      [req.user.id]
    );
    res.json({ unread: row?.cnt || 0 });
  } catch { res.json({ unread: 0 }); }
});

app.get('/api/messages/:connId/stats', authUser, async (req, res) => {
  try {
    const row = await q1(
      `SELECT COALESCE(SUM(earned_amount),0)::float AS session_earned, COUNT(*)::int AS msg_count
       FROM messages WHERE connection_id=$1 AND sender_id=$2`,
      [req.params.connId, req.user.id]
    );
    const maxPerSession = parseFloat(await setting('max_earn_per_session') || '500');
    const earnPerMsg    = parseFloat(await setting('earning_per_message') || '3');
    res.json({
      session_earned:     row?.session_earned || 0,
      msg_count:          row?.msg_count || 0,
      max_earn_per_session: maxPerSession,
      earn_per_message:   earnPerMsg,
    });
  } catch { res.json({ session_earned: 0, msg_count: 0 }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const a = await q1(`SELECT * FROM admins WHERE username=$1`, [username]);
    if (!a || !await bcrypt.compare(password, a.password))
      return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: signAdmin(a.id), admin: { id: a.id, username: a.username } });
  } catch { res.status(500).json({ error: 'Login failed' }); }
});

app.get('/api/admin/stats', authAdmin, async (req, res) => {
  try {
    const results = await Promise.all([
      q1(`SELECT COUNT(*)::int v FROM users WHERE is_foreigner=false`),
      q1(`SELECT COUNT(*)::int v FROM users WHERE is_foreigner=true`),
      q1(`SELECT COUNT(*)::int v FROM users WHERE is_online=true`),
      q1(`SELECT COUNT(*)::int v FROM users WHERE is_banned=true`),
      q1(`SELECT COUNT(*)::int v FROM users WHERE is_activated=true`),
      q1(`SELECT COUNT(*)::int v FROM connections WHERE status='active'`),
      q1(`SELECT COUNT(*)::int v FROM messages`),
      q1(`SELECT COALESCE(SUM(amount),0)::float v FROM transactions WHERE status='completed' AND type='activation_fee'`),
      q1(`SELECT COUNT(*)::int v FROM withdrawal_requests WHERE status='pending'`),
      q1(`SELECT COALESCE(SUM(amount),0)::float v FROM withdrawal_requests WHERE status='pending'`),
      q1(`SELECT COUNT(*)::int v FROM reports WHERE status='pending'`),
    ]);
    const [tu, tf, on, ban, activated, conn, msg, rev, pw, pwa, rep] = results.map(r => r.v);
    const revenueByDay = await q(
      `SELECT DATE(created_at) day, COALESCE(SUM(amount),0)::float revenue FROM transactions
       WHERE status='completed' AND type='activation_fee' AND created_at>=NOW()-INTERVAL '7 days'
       GROUP BY day ORDER BY day ASC`
    );
    const recentTransactions = await q(
      `SELECT t.*, u.name user_name FROM transactions t JOIN users u ON t.user_id=u.id ORDER BY t.created_at DESC LIMIT 10`
    );
    res.json({
      stats: { totalUsers: tu, totalForeigners: tf, onlineUsers: on, bannedUsers: ban, activatedUsers: activated,
               totalConnections: conn, totalMessages: msg, totalRevenue: rev,
               pendingWithdrawals: pw, pendingWithdrawalAmount: pwa, pendingReports: rep },
      revenueByDay, recentTransactions,
    });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/admin/users', authAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', type, status } = req.query;
    const like = `%${search}%`; let where = `(name ILIKE $1 OR email ILIKE $1 OR country ILIKE $1)`; const p = [like];
    if (type === 'foreigner')   where = `(${where}) AND is_foreigner=true`;
    else if (type === 'user')   where = `(${where}) AND is_foreigner=false`;
    if (status === 'banned')    where = `(${where}) AND is_banned=true`;
    else if (status === 'active') where = `(${where}) AND is_banned=false`;
    const [{ cnt }] = await q(`SELECT COUNT(*)::int cnt FROM users WHERE ${where}`, p);
    const rows = await q(
      `SELECT id,name,email,country,country_code,is_foreigner,is_banned,is_verified,is_activated,is_online,balance,total_earned,total_chats,created_at
       FROM users WHERE ${where} ORDER BY created_at DESC LIMIT $${p.length + 1} OFFSET $${p.length + 2}`,
      [...p, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
    );
    res.json({ users: rows, total: cnt, page: parseInt(page), totalPages: Math.ceil(cnt / parseInt(limit)) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/admin/users/:id/ban', authAdmin, async (req, res) => {
  try {
    const u = await q1(`SELECT is_banned FROM users WHERE id=$1`, [req.params.id]);
    if (!u) return res.status(404).json({ error: 'Not found' });
    await pool().query(`UPDATE users SET is_banned=$1 WHERE id=$2`, [!u.is_banned, req.params.id]);
    res.json({ message: u.is_banned ? 'User unbanned' : 'User banned', banned: !u.is_banned });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/admin/users/:id/verify', authAdmin, async (req, res) => {
  try {
    const u = await q1(`SELECT is_verified FROM users WHERE id=$1`, [req.params.id]);
    if (!u) return res.status(404).json({ error: 'Not found' });
    await pool().query(`UPDATE users SET is_verified=$1 WHERE id=$2`, [!u.is_verified, req.params.id]);
    res.json({ message: u.is_verified ? 'Verification removed' : 'User verified' });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/admin/users/:id/toggle-foreigner', authAdmin, async (req, res) => {
  try {
    const u = await q1(`SELECT is_foreigner FROM users WHERE id=$1`, [req.params.id]);
    if (!u) return res.status(404).json({ error: 'Not found' });
    await pool().query(`UPDATE users SET is_foreigner=$1 WHERE id=$2`, [!u.is_foreigner, req.params.id]);
    res.json({ message: u.is_foreigner ? 'Removed from foreigners' : 'Made foreigner' });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/admin/users/:id/activate', authAdmin, async (req, res) => {
  try {
    await pool().query(`UPDATE users SET is_activated=true, activated_at=NOW() WHERE id=$1`, [req.params.id]);
    res.json({ message: 'User manually activated' });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/admin/users/:id', authAdmin, async (req, res) => {
  try { await pool().query(`DELETE FROM users WHERE id=$1`, [req.params.id]); res.json({ message: 'Deleted' }); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/admin/users/add-foreigner', authAdmin, async (req, res) => {
  try {
    const { name, email, country, country_code = '', bio = '', language = 'English' } = req.body;
    if (!name || !email || !country) return res.status(400).json({ error: 'name, email, country required' });
    if (await q1(`SELECT id FROM users WHERE email=$1`, [email])) return res.status(400).json({ error: 'Email exists' });
    const id = uuidv4();
    await pool().query(
      `INSERT INTO users(id,name,email,password,country,country_code,bio,avatar,language,is_foreigner,is_verified) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,true,true)`,
      [id, name, email, await bcrypt.hash('password123', 10), country, country_code, bio,
       `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`, language]
    );
    res.json({ message: 'Foreigner added', id });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/admin/transactions', authAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const p = []; let w = '1=1';
    if (status) { p.push(status); w += ` AND t.status=$${p.length}`; }
    if (type)   { p.push(type);   w += ` AND t.type=$${p.length}`; }
    const [{ cnt }] = await q(`SELECT COUNT(*)::int cnt FROM transactions t JOIN users u ON t.user_id=u.id WHERE ${w}`, p);
    const rows = await q(
      `SELECT t.*,u.name user_name,u.email user_email FROM transactions t JOIN users u ON t.user_id=u.id WHERE ${w} ORDER BY t.created_at DESC LIMIT $${p.length + 1} OFFSET $${p.length + 2}`,
      [...p, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
    );
    res.json({ transactions: rows, total: cnt, page: parseInt(page), totalPages: Math.ceil(cnt / parseInt(limit)) });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/admin/withdrawals', authAdmin, async (req, res) => {
  try {
    const { status } = req.query; const p = []; let w = '1=1';
    if (status) { p.push(status); w = `w.status=$1`; }
    const rows = await q(`SELECT w.*,u.name user_name,u.email user_email FROM withdrawal_requests w JOIN users u ON w.user_id=u.id WHERE ${w} ORDER BY w.created_at DESC`, p);
    res.json({ withdrawals: rows });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/admin/withdrawals/:id', authAdmin, async (req, res) => {
  try {
    const { status, admin_note = '' } = req.body;
    const w = await q1(`SELECT * FROM withdrawal_requests WHERE id=$1`, [req.params.id]);
    if (!w) return res.status(404).json({ error: 'Not found' });
    await pool().query(`UPDATE withdrawal_requests SET status=$1,admin_note=$2,processed_at=NOW() WHERE id=$3`, [status, admin_note, req.params.id]);
    if (status === 'rejected') await pool().query(`UPDATE users SET balance=balance+$1 WHERE id=$2`, [w.amount, w.user_id]);
    res.json({ message: `Withdrawal ${status}` });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/admin/reports', authAdmin, async (req, res) => {
  try {
    const rows = await q(`SELECT r.*,u1.name reporter_name,u1.email reporter_email,u2.name reported_name,u2.email reported_email FROM reports r JOIN users u1 ON r.reporter_id=u1.id JOIN users u2 ON r.reported_id=u2.id ORDER BY r.created_at DESC`);
    res.json({ reports: rows });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/admin/reports/:id', authAdmin, async (req, res) => {
  try { await pool().query(`UPDATE reports SET status=$1 WHERE id=$2`, [req.body.status, req.params.id]); res.json({ message: 'Updated' }); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/admin/settings', authAdmin, async (req, res) => {
  try { res.json({ settings: await q(`SELECT * FROM platform_settings ORDER BY key`) }); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/admin/settings', authAdmin, async (req, res) => {
  try {
    for (const s of req.body.settings)
      await pool().query(`UPDATE platform_settings SET value=$1,updated_at=NOW() WHERE key=$2`, [s.value, s.key]);
    res.json({ message: 'Settings saved' });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/admin/connections', authAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [{ cnt }] = await q(`SELECT COUNT(*)::int cnt FROM connections`);
    const rows = await q(
      `SELECT c.*,u1.name user_name,u1.email user_email,u2.name foreigner_name,u2.country foreigner_country,
              (SELECT COUNT(*)::int FROM messages WHERE connection_id=c.id) message_count,
              (SELECT COALESCE(SUM(earned_amount),0)::float FROM messages WHERE connection_id=c.id AND sender_id=c.user_id) user_earned
       FROM connections c JOIN users u1 ON c.user_id=u1.id JOIN users u2 ON c.foreigner_id=u2.id
       ORDER BY c.created_at DESC LIMIT $1 OFFSET $2`,
      [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
    );
    res.json({ connections: rows, total: cnt });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/admin/connections/:id/messages', authAdmin, async (req, res) => {
  try {
    const rows = await q(`SELECT m.*,u.name sender_name FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.connection_id=$1 ORDER BY m.created_at ASC`, [req.params.id]);
    res.json({ messages: rows });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

export default app;
