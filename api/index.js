// GlobeVibe — Complete Backend API
// Deployed as a Vercel Serverless Function
import express from 'express';
import cors    from 'cors';
import bcrypt  from 'bcryptjs';
import jwt     from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import axios   from 'axios';
import pkg     from 'pg';

const { Pool } = pkg;

// ─── DB ─────────────────────────────────────────────────────────────────────
let _pool, _ready = false;
const pool = () => { if (!_pool) _pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false }, max: 3 }); return _pool; };
const q    = (sql, p=[]) => pool().query(sql, p).then(r => r.rows);
const q1   = (sql, p=[]) => q(sql, p).then(r => r[0] || null);

async function initDB() {
  if (_ready) return;
  await pool().query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
      country TEXT DEFAULT '', country_code TEXT DEFAULT '', bio TEXT DEFAULT '', avatar TEXT DEFAULT '',
      balance NUMERIC(12,2) DEFAULT 0, total_earned NUMERIC(12,2) DEFAULT 0,
      is_online BOOLEAN DEFAULT false, is_foreigner BOOLEAN DEFAULT false,
      is_banned BOOLEAN DEFAULT false, is_verified BOOLEAN DEFAULT false,
      rating NUMERIC(3,1) DEFAULT 5.0, total_chats INT DEFAULT 0,
      language TEXT DEFAULT 'English', interests TEXT DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(), last_seen TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      foreigner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      payment_status TEXT DEFAULT 'pending', transaction_id TEXT,
      amount_paid NUMERIC(12,2) DEFAULT 0, status TEXT DEFAULT 'active',
      expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY, connection_id TEXT REFERENCES connections(id) ON DELETE CASCADE,
      sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL, is_read BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      amount NUMERIC(12,2) NOT NULL, phone TEXT, mpesa_ref TEXT, checkout_request_id TEXT,
      status TEXT DEFAULT 'pending', type TEXT NOT NULL, description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      amount NUMERIC(12,2) NOT NULL, phone TEXT NOT NULL,
      status TEXT DEFAULT 'pending', admin_note TEXT DEFAULT '',
      processed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY, value TEXT NOT NULL, description TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY, reporter_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      reported_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL, description TEXT DEFAULT '', status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Default settings
  for (const [k,v,d] of [
    ['connection_fee','100','Connection fee in KES'],
    ['platform_commission','30','Platform cut %'],
    ['min_withdrawal','200','Min withdrawal KES'],
    ['platform_name','GlobeVibe','Site name'],
    ['maintenance_mode','false','Take site offline'],
    ['allow_registration','true','Allow signups'],
    ['chat_duration_hours','24','Hours per connection'],
  ]) await pool().query(`INSERT INTO platform_settings(key,value,description) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,[k,v,d]);

  // Default admin
  if (!await q1(`SELECT id FROM admins WHERE username='admin'`)) {
    await pool().query(`INSERT INTO admins(id,username,password) VALUES($1,$2,$3)`,
      [uuidv4(),'admin', await bcrypt.hash('GlobeVibe@Admin2024',10)]);
  }

  // Seed foreigners
  const {rows:[{cnt}]} = await pool().query(`SELECT COUNT(*)::int cnt FROM users WHERE is_foreigner=true`);
  if (cnt === 0) {
    const F = [
      {name:'Sophie Laurent',   country:'France',  code:'FR', bio:"Bonjour! Art, cuisine and meeting people from around the world — let's chat!", lang:'French, English',  i:'["art","cuisine","travel","photography"]'},
      {name:"Liam O'Brien",     country:'Ireland', code:'IE', bio:'Dublin native — football, music and good craic. Always up for a chat!',         lang:'English',          i:'["football","music","culture","humor"]'},
      {name:'Yuki Tanaka',      country:'Japan',   code:'JP', bio:'こんにちは! Japanese culture, anime and sushi facts!',                              lang:'Japanese, English',i:'["anime","sushi","technology","meditation"]'},
      {name:'Carlos Mendoza',   country:'Mexico',  code:'MX', bio:'Hola! Tacos, history and meeting new amigos from Mexico City!',                   lang:'Spanish, English', i:'["history","food","music","dance"]'},
      {name:'Amara Osei',       country:'Ghana',   code:'GH', bio:"Ghanaian culture ambassador — let's share stories about our continent!",          lang:'English, Twi',     i:'["culture","music","business","sports"]'},
      {name:'Emma Johansson',   country:'Sweden',  code:'SE', bio:'Hej! Nordic lifestyle, design and sustainability. Up for deep conversations!',    lang:'Swedish, English', i:'["design","sustainability","hiking","coffee"]'},
      {name:'Rahul Sharma',     country:'India',   code:'IN', bio:'Namaste from Bangalore! Tech, cricket, Bollywood and curry!',                     lang:'Hindi, English',   i:'["technology","cricket","bollywood","food"]'},
      {name:'Fatima Al-Hassan', country:'UAE',     code:'AE', bio:'Dubai adventurer — business, fashion and travel are my world!',                   lang:'Arabic, English',  i:'["business","fashion","travel","luxury"]'},
    ];
    for (const f of F) {
      const slug = f.name.toLowerCase().replace(/[^a-z]/g,'');
      await pool().query(
        `INSERT INTO users(id,name,email,password,country,country_code,bio,avatar,language,interests,is_foreigner,is_verified)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,true) ON CONFLICT DO NOTHING`,
        [uuidv4(), f.name, `${slug}@globevibe.com`, await bcrypt.hash('password123',10),
         f.country, f.code, f.bio,
         `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(f.name)}`,
         f.lang, f.i]
      );
    }
  }
  _ready = true;
}

const setting = async k => (await q1(`SELECT value FROM platform_settings WHERE key=$1`,[k]))?.value ?? null;

// ─── Auth helpers ───────────────────────────────────────────────────────────
const JS  = process.env.JWT_SECRET        || 'gv_dev_secret_change_in_prod';
const AJS = process.env.ADMIN_JWT_SECRET  || 'gv_admin_dev_secret_change_in_prod';
const signUser  = id => jwt.sign({id}, JS,  {expiresIn:'7d'});
const signAdmin = id => jwt.sign({id}, AJS, {expiresIn:'8h'});

const authUser = async (req,res,next) => {
  const t = req.headers.authorization?.split(' ')[1];
  if (!t) return res.status(401).json({error:'Token required'});
  try {
    const {id} = jwt.verify(t, JS);
    const u = await q1(`SELECT * FROM users WHERE id=$1`,[id]);
    if (!u)          return res.status(401).json({error:'User not found'});
    if (u.is_banned) return res.status(403).json({error:'Account suspended'});
    req.user = u; next();
  } catch { res.status(403).json({error:'Invalid token'}); }
};

const authAdmin = async (req,res,next) => {
  const t = req.headers.authorization?.split(' ')[1];
  if (!t) return res.status(401).json({error:'Token required'});
  try {
    const {id} = jwt.verify(t, AJS);
    const a = await q1(`SELECT * FROM admins WHERE id=$1`,[id]);
    if (!a) return res.status(401).json({error:'Admin not found'});
    req.admin = a; next();
  } catch { res.status(403).json({error:'Invalid token'}); }
};

// ─── M-Pesa STK Push (Lipana Technologies) ──────────────────────────────────
async function stkPush(phone, amount, ref, desc) {
  let p = phone.replace(/\D/g,'');
  if (p.startsWith('0'))    p = '254'+p.slice(1);
  if (p.startsWith('+'))    p = p.slice(1);
  if (!p.startsWith('254')) p = '254'+p;
  try {
    const r = await axios.post(
      `${process.env.LIPANA_BASE_URL||'https://api.lipanatechnologies.dev'}/v1/stk-push`,
      { phone:p, amount:Math.ceil(amount), account_reference:ref, transaction_desc:desc,
        shortcode:process.env.LIPANA_SHORTCODE, passkey:process.env.LIPANA_PASSKEY },
      { headers:{ Authorization:`Bearer ${process.env.LIPANA_API_KEY}`, 'Content-Type':'application/json' }, timeout:30000 }
    );
    return { ok:true, data:r.data };
  } catch(e) { return { ok:false, error:e.response?.data?.message||'STK Push failed' }; }
}

async function completePayment(txId, mpesaRef) {
  const tx = await q1(`SELECT * FROM transactions WHERE id=$1`,[txId]);
  if (!tx) return;
  await pool().query(`UPDATE transactions SET status='completed',mpesa_ref=$1 WHERE id=$2`,[mpesaRef,txId]);
  const cn = await q1(`SELECT * FROM connections WHERE transaction_id=$1`,[txId]);
  if (cn) {
    const hrs = parseInt(await setting('chat_duration_hours')||'24');
    await pool().query(
      `UPDATE connections SET payment_status='completed',status='active',expires_at=NOW()+($1||' hours')::interval WHERE id=$2`,
      [String(hrs), cn.id]
    );
    const commission = parseFloat(await setting('platform_commission')||'30');
    const earning = parseFloat(tx.amount)*(1-commission/100);
    await pool().query(`UPDATE users SET balance=balance+$1,total_earned=total_earned+$1,total_chats=total_chats+1 WHERE id=$2`,[earning,cn.foreigner_id]);
    await pool().query(
      `INSERT INTO transactions(id,user_id,amount,status,type,description) VALUES($1,$2,$3,'completed','earning','Chat connection earning')`,
      [uuidv4(),cn.foreigner_id,earning]
    );
  }
}

// ─── Express ─────────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin:'*' }));
app.use(express.json());
app.options('*', cors());

// Init DB on every cold-start request
app.use(async (_,__,next) => { try { await initDB(); } catch(e){ console.error('DB init:',e.message); } next(); });

// ── Health ─────────────────────────────────────────────────────────────────
app.get('/api/health', (_,res) => res.json({ok:true, app:'GlobeVibe', ts:new Date()}));

// ── Auth ────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req,res) => {
  try {
    const { name,email,password,country,country_code='',language='English',bio='' } = req.body;
    if (!name||!email||!password||!country) return res.status(400).json({error:'Name, email, password and country are required'});
    if (password.length<6) return res.status(400).json({error:'Password must be at least 6 characters'});
    if (await q1(`SELECT id FROM users WHERE email=$1`,[email.toLowerCase()])) return res.status(400).json({error:'Email already registered'});
    const id=uuidv4(), hash=await bcrypt.hash(password,10);
    const avatar=`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
    await pool().query(`INSERT INTO users(id,name,email,password,country,country_code,language,bio,avatar) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id,name,email.toLowerCase(),hash,country,country_code,language,bio,avatar]);
    const user = await q1(`SELECT id,name,email,country,country_code,bio,avatar,balance,total_earned,is_foreigner,is_verified,language,interests,created_at FROM users WHERE id=$1`,[id]);
    res.status(201).json({user, token:signUser(id), message:'Welcome to GlobeVibe 🌍'});
  } catch(e){ console.error(e); res.status(500).json({error:'Registration failed'}); }
});

app.post('/api/auth/login', async (req,res) => {
  try {
    const {email,password} = req.body;
    if (!email||!password) return res.status(400).json({error:'Email and password required'});
    const u = await q1(`SELECT * FROM users WHERE email=$1`,[email.toLowerCase()]);
    if (!u||!await bcrypt.compare(password,u.password)) return res.status(401).json({error:'Invalid email or password'});
    if (u.is_banned) return res.status(403).json({error:'Account suspended. Contact support.'});
    await pool().query(`UPDATE users SET is_online=true,last_seen=NOW() WHERE id=$1`,[u.id]);
    const {password:_,...safe} = u;
    res.json({user:safe, token:signUser(u.id)});
  } catch(e){ console.error(e); res.status(500).json({error:'Login failed'}); }
});

app.post('/api/auth/logout', authUser, async (req,res) => {
  await pool().query(`UPDATE users SET is_online=false,last_seen=NOW() WHERE id=$1`,[req.user.id]);
  res.json({message:'Logged out'});
});

app.get('/api/auth/me', authUser, async (req,res) => {
  const user = await q1(`SELECT id,name,email,country,country_code,bio,avatar,balance,total_earned,is_foreigner,is_verified,is_online,language,interests,rating,total_chats,created_at,last_seen FROM users WHERE id=$1`,[req.user.id]);
  res.json({user});
});

// ── Users ──────────────────────────────────────────────────────────────────
app.get('/api/users/foreigners', authUser, async (req,res) => {
  try {
    const {search='',page=1,limit=12} = req.query;
    const like=`%${search}%`, lim=parseInt(limit), off=(parseInt(page)-1)*lim;
    const [rows, [{cnt}]] = await Promise.all([
      q(`SELECT id,name,country,country_code,bio,avatar,language,interests,rating,total_chats,is_online,is_verified,last_seen FROM users WHERE is_foreigner=true AND is_banned=false AND(name ILIKE $1 OR bio ILIKE $1 OR country ILIKE $1) ORDER BY is_online DESC,rating DESC LIMIT $2 OFFSET $3`,[like,lim,off]),
      q(`SELECT COUNT(*)::int cnt FROM users WHERE is_foreigner=true AND is_banned=false AND(name ILIKE $1 OR bio ILIKE $1 OR country ILIKE $1)`,[like]),
    ]);
    res.json({foreigners:rows, total:cnt, page:parseInt(page), totalPages:Math.ceil(cnt/lim)});
  } catch(e){ console.error(e); res.status(500).json({error:'Failed to fetch foreigners'}); }
});

app.get('/api/users/my/connections', authUser, async (req,res) => {
  try {
    const rows = await q(
      `SELECT c.*,u1.name user_name,u1.avatar user_avatar,u1.country user_country,
        u2.name foreigner_name,u2.avatar foreigner_avatar,u2.country foreigner_country,u2.country_code foreigner_country_code,u2.is_online foreigner_online
       FROM connections c JOIN users u1 ON c.user_id=u1.id JOIN users u2 ON c.foreigner_id=u2.id
       WHERE(c.user_id=$1 OR c.foreigner_id=$1)AND c.payment_status='completed' ORDER BY c.created_at DESC`,[req.user.id]);
    res.json({connections:rows});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

app.get('/api/users/my/transactions', authUser, async (req,res) => {
  try {
    const rows = await q(`SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,[req.user.id]);
    res.json({transactions:rows});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

app.post('/api/users/my/withdraw', authUser, async (req,res) => {
  try {
    const {amount,phone} = req.body;
    const minW = parseFloat(await setting('min_withdrawal')||'200');
    if (!amount||Number(amount)<minW) return res.status(400).json({error:`Minimum withdrawal is KES ${minW}`});
    const u = await q1(`SELECT balance FROM users WHERE id=$1`,[req.user.id]);
    if (parseFloat(u.balance)<Number(amount)) return res.status(400).json({error:'Insufficient balance'});
    await pool().query(`UPDATE users SET balance=balance-$1 WHERE id=$2`,[amount,req.user.id]);
    await pool().query(`INSERT INTO withdrawal_requests(id,user_id,amount,phone) VALUES($1,$2,$3,$4)`,[uuidv4(),req.user.id,amount,phone]);
    res.json({message:`Withdrawal of KES ${amount} submitted!`});
  } catch(e){ console.error(e); res.status(500).json({error:'Failed'}); }
});

app.get('/api/users/:id', authUser, async (req,res) => {
  try {
    const u = await q1(`SELECT id,name,country,country_code,bio,avatar,language,interests,rating,total_chats,is_online,is_verified,is_foreigner,created_at,last_seen FROM users WHERE id=$1 AND is_banned=false`,[req.params.id]);
    if (!u) return res.status(404).json({error:'User not found'});
    res.json({user:u});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

app.put('/api/users/profile/update', authUser, async (req,res) => {
  try {
    const {name,bio,language,interests} = req.body;
    await pool().query(`UPDATE users SET name=$1,bio=$2,language=$3,interests=$4 WHERE id=$5`,
      [name||req.user.name, bio||'', language||'English', JSON.stringify(interests||[]), req.user.id]);
    const user = await q1(`SELECT id,name,email,country,country_code,bio,avatar,balance,total_earned,is_foreigner,is_verified,language,interests,rating,total_chats FROM users WHERE id=$1`,[req.user.id]);
    res.json({user, message:'Profile updated'});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

app.put('/api/users/profile/password', authUser, async (req,res) => {
  try {
    const {currentPassword,newPassword} = req.body;
    if (!await bcrypt.compare(currentPassword,req.user.password)) return res.status(400).json({error:'Current password incorrect'});
    if ((newPassword||'').length<6) return res.status(400).json({error:'Min 6 characters'});
    await pool().query(`UPDATE users SET password=$1 WHERE id=$2`,[await bcrypt.hash(newPassword,10),req.user.id]);
    res.json({message:'Password changed'});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

app.post('/api/users/report/:id', authUser, async (req,res) => {
  try {
    const {reason,description=''} = req.body;
    await pool().query(`INSERT INTO reports(id,reporter_id,reported_id,reason,description) VALUES($1,$2,$3,$4,$5)`,[uuidv4(),req.user.id,req.params.id,reason,description]);
    res.json({message:'Report submitted'});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

// ── Payments ───────────────────────────────────────────────────────────────
app.post('/api/payments/connect', authUser, async (req,res) => {
  try {
    const {foreigner_id,phone} = req.body;
    if (!foreigner_id||!phone) return res.status(400).json({error:'foreigner_id and phone required'});
    const foreigner = await q1(`SELECT id,name FROM users WHERE id=$1 AND is_foreigner=true AND is_banned=false`,[foreigner_id]);
    if (!foreigner) return res.status(404).json({error:'Foreigner not found'});
    const already = await q1(`SELECT id FROM connections WHERE user_id=$1 AND foreigner_id=$2 AND payment_status='completed' AND status='active' AND expires_at>NOW()`,[req.user.id,foreigner_id]);
    if (already) return res.status(400).json({error:'Already connected',connection_id:already.id});

    const fee = parseFloat(await setting('connection_fee')||'100');
    const hrs = parseInt(await setting('chat_duration_hours')||'24');
    const txId=uuidv4(), cnId=uuidv4(), ref=`GV-${cnId.slice(0,8).toUpperCase()}`;

    await pool().query(`INSERT INTO transactions(id,user_id,amount,phone,type,description) VALUES($1,$2,$3,$4,'connection_payment',$5)`,
      [txId,req.user.id,fee,phone,`Connect with ${foreigner.name}`]);
    await pool().query(`INSERT INTO connections(id,user_id,foreigner_id,payment_status,transaction_id,amount_paid,expires_at) VALUES($1,$2,$3,'pending',$4,$5,NOW()+($6||' hours')::interval)`,
      [cnId,req.user.id,foreigner_id,txId,fee,String(hrs)]);

    if (process.env.LIPANA_API_KEY) {
      const r = await stkPush(phone,fee,ref,`GlobeVibe – Chat with ${foreigner.name}`);
      if (r.ok) {
        const cid = r.data?.CheckoutRequestID||r.data?.checkout_request_id;
        if (cid) await pool().query(`UPDATE transactions SET checkout_request_id=$1,mpesa_ref=$1 WHERE id=$2`,[cid,txId]);
        return res.json({success:true,message:`STK Push sent to ${phone}. Enter your M-Pesa PIN.`,transaction_id:txId,connection_id:cnId,amount:fee});
      }
      await pool().query(`UPDATE transactions SET status='failed' WHERE id=$1`,[txId]);
      await pool().query(`UPDATE connections SET payment_status='failed' WHERE id=$1`,[cnId]);
      return res.status(400).json({error:r.error});
    }
    // Demo mode (no LIPANA_API_KEY configured)
    res.json({success:true,demo:true,message:`[Demo] Payment of KES ${fee} simulated.`,transaction_id:txId,connection_id:cnId,amount:fee});
  } catch(e){ console.error(e); res.status(500).json({error:'Payment initiation failed'}); }
});

app.post('/api/payments/demo-confirm/:txId', authUser, async (req,res) => {
  try {
    if (process.env.LIPANA_API_KEY) return res.status(403).json({error:'Not available in production'});
    const tx = await q1(`SELECT * FROM transactions WHERE id=$1 AND user_id=$2`,[req.params.txId,req.user.id]);
    if (!tx) return res.status(404).json({error:'Not found'});
    if (tx.status==='completed') return res.json({success:true});
    await completePayment(tx.id,'DEMO-'+Date.now());
    res.json({success:true,message:'Connected! 🎉'});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

app.get('/api/payments/status/:txId', authUser, async (req,res) => {
  try {
    const tx = await q1(`SELECT * FROM transactions WHERE id=$1 AND user_id=$2`,[req.params.txId,req.user.id]);
    if (!tx) return res.status(404).json({error:'Not found'});
    const cn = await q1(`SELECT * FROM connections WHERE transaction_id=$1`,[tx.id]);
    res.json({transaction:tx,connection:cn});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

// Lipana Technologies M-Pesa callback
app.post('/api/payments/callback', async (req,res) => {
  try {
    const b = req.body;
    const rc  = b?.Body?.stkCallback?.ResultCode ?? b?.ResultCode ?? b?.result_code;
    const cid = b?.Body?.stkCallback?.CheckoutRequestID ?? b?.CheckoutRequestID ?? b?.checkout_request_id;
    const ref = b?.Body?.stkCallback?.CallbackMetadata?.Item?.find(i=>i.Name==='MpesaReceiptNumber')?.Value ?? b?.mpesa_receipt_number;
    if (cid) {
      const tx = await q1(`SELECT * FROM transactions WHERE checkout_request_id=$1`,[cid]);
      if (tx) {
        if (rc===0||rc==='0') await completePayment(tx.id, ref||cid);
        else {
          await pool().query(`UPDATE transactions SET status='failed' WHERE id=$1`,[tx.id]);
          const cn = await q1(`SELECT id FROM connections WHERE transaction_id=$1`,[tx.id]);
          if (cn) await pool().query(`UPDATE connections SET payment_status='failed' WHERE id=$1`,[cn.id]);
        }
      }
    }
  } catch(e){ console.error('Callback error:',e.message); }
  res.json({ResultCode:0,ResultDesc:'Accepted'});
});

// ── Messages (polling-based, works on serverless) ──────────────────────────
app.get('/api/messages/:connId', authUser, async (req,res) => {
  try {
    const {connId} = req.params, {since} = req.query;
    const cn = await q1(`SELECT * FROM connections WHERE id=$1 AND(user_id=$2 OR foreigner_id=$2) AND payment_status='completed'`,[connId,req.user.id]);
    if (!cn) return res.status(403).json({error:'Not authorized'});
    const msgs = since
      ? await q(`SELECT m.*,u.name sender_name,u.avatar sender_avatar FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.connection_id=$1 AND m.created_at>$2::timestamptz ORDER BY m.created_at ASC`,[connId,since])
      : await q(`SELECT m.*,u.name sender_name,u.avatar sender_avatar FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.connection_id=$1 ORDER BY m.created_at ASC LIMIT 100`,[connId]);
    await pool().query(`UPDATE messages SET is_read=true WHERE connection_id=$1 AND sender_id!=$2 AND is_read=false`,[connId,req.user.id]);
    res.json({messages:msgs, connection:cn});
  } catch(e){ console.error(e); res.status(500).json({error:'Failed to fetch messages'}); }
});

app.post('/api/messages/:connId', authUser, async (req,res) => {
  try {
    const {connId} = req.params, {content} = req.body;
    if (!content?.trim()||content.length>1000) return res.status(400).json({error:'Invalid message'});
    const cn = await q1(`SELECT * FROM connections WHERE id=$1 AND(user_id=$2 OR foreigner_id=$2) AND payment_status='completed' AND status='active'`,[connId,req.user.id]);
    if (!cn) return res.status(403).json({error:'Not authorized or connection expired'});
    if (cn.expires_at && new Date(cn.expires_at)<new Date()) return res.status(400).json({error:'Connection expired'});
    const id=uuidv4();
    await pool().query(`INSERT INTO messages(id,connection_id,sender_id,content) VALUES($1,$2,$3,$4)`,[id,connId,req.user.id,content.trim()]);
    const msg = await q1(`SELECT m.*,u.name sender_name,u.avatar sender_avatar FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.id=$1`,[id]);
    res.status(201).json({message:msg});
  } catch(e){ console.error(e); res.status(500).json({error:'Failed to send'}); }
});

app.get('/api/messages/unread/count', authUser, async (req,res) => {
  try {
    const [{cnt}] = await q(`SELECT COUNT(*)::int cnt FROM messages m JOIN connections c ON m.connection_id=c.id WHERE(c.user_id=$1 OR c.foreigner_id=$1)AND m.sender_id!=$1 AND m.is_read=false`,[req.user.id]);
    res.json({unread:cnt});
  } catch(e){ res.json({unread:0}); }
});

// ── Admin ──────────────────────────────────────────────────────────────────
app.post('/api/admin/login', async (req,res) => {
  try {
    const {username,password} = req.body;
    const a = await q1(`SELECT * FROM admins WHERE username=$1`,[username]);
    if (!a||!await bcrypt.compare(password,a.password)) return res.status(401).json({error:'Invalid credentials'});
    res.json({token:signAdmin(a.id), admin:{id:a.id,username:a.username}});
  } catch(e){ res.status(500).json({error:'Login failed'}); }
});

app.get('/api/admin/stats', authAdmin, async (req,res) => {
  try {
    const results = await Promise.all([
      q1(`SELECT COUNT(*)::int v FROM users WHERE is_foreigner=false`),
      q1(`SELECT COUNT(*)::int v FROM users WHERE is_foreigner=true`),
      q1(`SELECT COUNT(*)::int v FROM users WHERE is_online=true`),
      q1(`SELECT COUNT(*)::int v FROM users WHERE is_banned=true`),
      q1(`SELECT COUNT(*)::int v FROM connections WHERE payment_status='completed'`),
      q1(`SELECT COUNT(*)::int v FROM messages`),
      q1(`SELECT COALESCE(SUM(amount),0)::float v FROM transactions WHERE status='completed' AND type='connection_payment'`),
      q1(`SELECT COUNT(*)::int v FROM withdrawal_requests WHERE status='pending'`),
      q1(`SELECT COALESCE(SUM(amount),0)::float v FROM withdrawal_requests WHERE status='pending'`),
      q1(`SELECT COUNT(*)::int v FROM reports WHERE status='pending'`),
    ]);
    const [tu,tf,on,ban,conn,msg,rev,pw,pwa,rep] = results.map(r=>r.v);
    const revenueByDay = await q(`SELECT DATE(created_at) day,COALESCE(SUM(amount),0)::float revenue FROM transactions WHERE status='completed' AND type='connection_payment' AND created_at>=NOW()-INTERVAL '7 days' GROUP BY day ORDER BY day ASC`);
    const recentTransactions = await q(`SELECT t.*,u.name user_name FROM transactions t JOIN users u ON t.user_id=u.id ORDER BY t.created_at DESC LIMIT 10`);
    res.json({stats:{totalUsers:tu,totalForeigners:tf,onlineUsers:on,bannedUsers:ban,totalConnections:conn,totalMessages:msg,totalRevenue:rev,pendingWithdrawals:pw,pendingWithdrawalAmount:pwa,pendingReports:rep},revenueByDay,recentTransactions});
  } catch(e){ console.error(e); res.status(500).json({error:'Failed'}); }
});

app.get('/api/admin/users', authAdmin, async (req,res) => {
  try {
    const {page=1,limit=20,search='',type,status} = req.query;
    const like=`%${search}%`; let where=`name ILIKE $1 OR email ILIKE $1 OR country ILIKE $1`; const p=[like];
    if (type==='foreigner') where=`(${where}) AND is_foreigner=true`;
    else if (type==='user') where=`(${where}) AND is_foreigner=false`;
    if (status==='banned') where=`(${where}) AND is_banned=true`;
    else if (status==='active') where=`(${where}) AND is_banned=false`;
    const [{cnt}] = await q(`SELECT COUNT(*)::int cnt FROM users WHERE ${where}`,p);
    const rows = await q(`SELECT id,name,email,country,country_code,is_foreigner,is_banned,is_verified,is_online,balance,total_earned,total_chats,created_at FROM users WHERE ${where} ORDER BY created_at DESC LIMIT $${p.length+1} OFFSET $${p.length+2}`,[...p,parseInt(limit),(parseInt(page)-1)*parseInt(limit)]);
    res.json({users:rows,total:cnt,page:parseInt(page),totalPages:Math.ceil(cnt/parseInt(limit))});
  } catch(e){ console.error(e); res.status(500).json({error:'Failed'}); }
});

app.put('/api/admin/users/:id/ban', authAdmin, async (req,res) => {
  try {
    const u=await q1(`SELECT is_banned FROM users WHERE id=$1`,[req.params.id]);
    if(!u) return res.status(404).json({error:'Not found'});
    await pool().query(`UPDATE users SET is_banned=$1 WHERE id=$2`,[!u.is_banned,req.params.id]);
    res.json({message:u.is_banned?'User unbanned':'User banned',banned:!u.is_banned});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

app.put('/api/admin/users/:id/verify', authAdmin, async (req,res) => {
  try {
    const u=await q1(`SELECT is_verified FROM users WHERE id=$1`,[req.params.id]);
    if(!u) return res.status(404).json({error:'Not found'});
    await pool().query(`UPDATE users SET is_verified=$1 WHERE id=$2`,[!u.is_verified,req.params.id]);
    res.json({message:u.is_verified?'Verification removed':'User verified'});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

app.put('/api/admin/users/:id/toggle-foreigner', authAdmin, async (req,res) => {
  try {
    const u=await q1(`SELECT is_foreigner FROM users WHERE id=$1`,[req.params.id]);
    if(!u) return res.status(404).json({error:'Not found'});
    await pool().query(`UPDATE users SET is_foreigner=$1 WHERE id=$2`,[!u.is_foreigner,req.params.id]);
    res.json({message:u.is_foreigner?'Removed from foreigners':'Made foreigner'});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

app.delete('/api/admin/users/:id', authAdmin, async (req,res) => {
  try { await pool().query(`DELETE FROM users WHERE id=$1`,[req.params.id]); res.json({message:'Deleted'}); }
  catch(e){ res.status(500).json({error:'Failed'}); }
});

app.post('/api/admin/users/add-foreigner', authAdmin, async (req,res) => {
  try {
    const {name,email,country,country_code='',bio='',language='English'} = req.body;
    if(!name||!email||!country) return res.status(400).json({error:'name, email, country required'});
    if(await q1(`SELECT id FROM users WHERE email=$1`,[email])) return res.status(400).json({error:'Email exists'});
    const id=uuidv4(), pwd=await bcrypt.hash('password123',10);
    const avatar=`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
    await pool().query(`INSERT INTO users(id,name,email,password,country,country_code,bio,avatar,language,is_foreigner,is_verified) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,true,true)`,[id,name,email,pwd,country,country_code,bio,avatar,language]);
    res.json({message:'Foreigner added',id});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

app.get('/api/admin/transactions', authAdmin, async (req,res) => {
  try {
    const {page=1,limit=20,status,type} = req.query;
    const p=[]; let w='1=1';
    if(status){p.push(status);w+=` AND t.status=$${p.length}`;}
    if(type){p.push(type);w+=` AND t.type=$${p.length}`;}
    const [{cnt}]=await q(`SELECT COUNT(*)::int cnt FROM transactions t JOIN users u ON t.user_id=u.id WHERE ${w}`,p);
    const rows=await q(`SELECT t.*,u.name user_name,u.email user_email FROM transactions t JOIN users u ON t.user_id=u.id WHERE ${w} ORDER BY t.created_at DESC LIMIT $${p.length+1} OFFSET $${p.length+2}`,[...p,parseInt(limit),(parseInt(page)-1)*parseInt(limit)]);
    res.json({transactions:rows,total:cnt,page:parseInt(page),totalPages:Math.ceil(cnt/parseInt(limit))});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

app.get('/api/admin/withdrawals', authAdmin, async (req,res) => {
  try {
    const {status}=req.query; const p=[]; let w='1=1';
    if(status){p.push(status);w=`w.status=$1`;}
    const rows=await q(`SELECT w.*,u.name user_name,u.email user_email FROM withdrawal_requests w JOIN users u ON w.user_id=u.id WHERE ${w} ORDER BY w.created_at DESC`,p);
    res.json({withdrawals:rows});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

app.put('/api/admin/withdrawals/:id', authAdmin, async (req,res) => {
  try {
    const {status,admin_note=''}=req.body;
    const w=await q1(`SELECT * FROM withdrawal_requests WHERE id=$1`,[req.params.id]);
    if(!w) return res.status(404).json({error:'Not found'});
    await pool().query(`UPDATE withdrawal_requests SET status=$1,admin_note=$2,processed_at=NOW() WHERE id=$3`,[status,admin_note,req.params.id]);
    if(status==='rejected') await pool().query(`UPDATE users SET balance=balance+$1 WHERE id=$2`,[w.amount,w.user_id]);
    res.json({message:`Withdrawal ${status}`});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

app.get('/api/admin/reports', authAdmin, async (req,res) => {
  try {
    const rows=await q(`SELECT r.*,u1.name reporter_name,u1.email reporter_email,u2.name reported_name,u2.email reported_email FROM reports r JOIN users u1 ON r.reporter_id=u1.id JOIN users u2 ON r.reported_id=u2.id ORDER BY r.created_at DESC`);
    res.json({reports:rows});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

app.put('/api/admin/reports/:id', authAdmin, async (req,res) => {
  try { await pool().query(`UPDATE reports SET status=$1 WHERE id=$2`,[req.body.status,req.params.id]); res.json({message:'Updated'}); }
  catch(e){ res.status(500).json({error:'Failed'}); }
});

app.get('/api/admin/settings', authAdmin, async (req,res) => {
  try { res.json({settings:await q(`SELECT * FROM platform_settings ORDER BY key`)}); }
  catch(e){ res.status(500).json({error:'Failed'}); }
});

app.put('/api/admin/settings', authAdmin, async (req,res) => {
  try {
    for(const s of req.body.settings) await pool().query(`UPDATE platform_settings SET value=$1,updated_at=NOW() WHERE key=$2`,[s.value,s.key]);
    res.json({message:'Settings saved'});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

app.get('/api/admin/connections', authAdmin, async (req,res) => {
  try {
    const {page=1,limit=20}=req.query;
    const [{cnt}]=await q(`SELECT COUNT(*)::int cnt FROM connections`);
    const rows=await q(`SELECT c.*,u1.name user_name,u1.email user_email,u2.name foreigner_name,u2.country foreigner_country,(SELECT COUNT(*)::int FROM messages WHERE connection_id=c.id) message_count FROM connections c JOIN users u1 ON c.user_id=u1.id JOIN users u2 ON c.foreigner_id=u2.id ORDER BY c.created_at DESC LIMIT $1 OFFSET $2`,[parseInt(limit),(parseInt(page)-1)*parseInt(limit)]);
    res.json({connections:rows,total:cnt});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

app.get('/api/admin/connections/:id/messages', authAdmin, async (req,res) => {
  try {
    const rows=await q(`SELECT m.*,u.name sender_name FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.connection_id=$1 ORDER BY m.created_at ASC`,[req.params.id]);
    res.json({messages:rows});
  } catch(e){ res.status(500).json({error:'Failed'}); }
});

// Export for Vercel
export default app;
