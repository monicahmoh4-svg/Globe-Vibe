# 🌍 GlobeVibe — Chat with the World, Get Paid

A fullstack web platform where users connect with foreigners via paid real-time chat,  
powered by **M-Pesa STK Push** (Lipana Technologies) and deployed on **Vercel** with **PostgreSQL**.

---

## 🚀 Deploy on Vercel in 5 Steps

### Step 1 — Get a Free Database
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Click **New Project** → give it a name → **Create Project**
3. Copy the **Connection string** (starts with `postgresql://...`)

### Step 2 — Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial GlobeVibe commit"
git remote add origin https://github.com/YOUR_USERNAME/globevibe.git
git push -u origin main
```

### Step 3 — Import to Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`

### Step 4 — Set Environment Variables in Vercel
In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `POSTGRES_URL` | Your Neon connection string |
| `JWT_SECRET` | Any long random string (32+ chars) |
| `ADMIN_JWT_SECRET` | Another long random string (different) |
| `LIPANA_BASE_URL` | `https://api.lipanatechnologies.dev` |
| `LIPANA_API_KEY` | Your Lipana API key |
| `LIPANA_SHORTCODE` | Your M-Pesa shortcode |
| `LIPANA_PASSKEY` | Your M-Pesa passkey |

> **Without Lipana keys**, the app runs in **Demo Mode** — payments are simulated instantly. Great for testing!

### Step 5 — Deploy!
Click **Deploy**. Vercel will build and deploy automatically.  
The database tables and seed data are created on first request. ✅

---

## 🔑 Default Admin Credentials

```
URL:      https://your-app.vercel.app/admin
Username: admin
Password: GlobeVibe@Admin2024
```

> ⚠️ Change the admin password after first login via the Settings page.

---

## 💻 Local Development

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/globevibe.git
cd globevibe

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env and fill in POSTGRES_URL and secrets

# 4. Start frontend dev server
npm run dev
# → http://localhost:5173

# 5. For local API testing, you need a local PostgreSQL or
#    point POSTGRES_URL to your Neon DB in .env
```

---

## 📁 Project Structure

```
globevibe/
├── api/
│   └── index.js          # Complete Express backend (Vercel serverless)
├── src/
│   ├── App.jsx            # React Router setup
│   ├── main.jsx
│   ├── index.css          # Global Tailwind styles
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── AdminAuthContext.jsx
│   ├── utils/
│   │   ├── api.js         # Axios instance
│   │   └── helpers.js     # Formatters, countries list
│   ├── components/
│   │   └── layout/
│   │       └── AppLayout.jsx
│   └── pages/
│       ├── Landing.jsx
│       ├── auth/
│       │   ├── Login.jsx
│       │   └── Register.jsx
│       ├── dashboard/
│       │   ├── Dashboard.jsx
│       │   ├── Browse.jsx      # Browse + pay-to-connect modal
│       │   ├── Chats.jsx
│       │   ├── ChatPage.jsx    # Real-time chat (polling)
│       │   ├── Wallet.jsx
│       │   └── Profile.jsx
│       └── admin/
│           ├── AdminLogin.jsx
│           ├── AdminLayout.jsx
│           ├── AdminDashboard.jsx
│           ├── AdminUsers.jsx
│           └── AdminOtherPages.jsx  # TX, Withdrawals, Reports, Connections, Settings
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json            # Vercel routing config
└── .env.example
```

---

## 💳 M-Pesa Payment Flow

```
User clicks "Connect"
       ↓
Enters M-Pesa phone number
       ↓
POST /api/payments/connect
       ↓
STK Push sent via Lipana Technologies API
       ↓
User enters PIN on their phone
       ↓
Lipana sends callback → POST /api/payments/callback
       ↓
Connection activated → foreigner receives earnings
```

**Without API keys:** App auto-confirms payments in Demo Mode.

---

## 🛡️ Admin Panel Features

Access at `/admin` with credentials above.

| Feature | Description |
|---|---|
| 📊 Dashboard | Revenue charts, live stats, recent transactions |
| 👥 Users | View, ban, verify, toggle foreigner status, delete |
| ➕ Add Foreigner | Manually add foreigners from any country |
| 💳 Transactions | Monitor all payments and earnings |
| 💰 Withdrawals | Approve or reject withdrawal requests |
| 💬 Connections | View all chat connections, read messages |
| 🚩 Reports | Review and resolve user reports |
| ⚙️ Settings | Connection fee, commission %, chat duration, maintenance mode |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, React Router v6 |
| Backend | Node.js, Express (Vercel Serverless) |
| Database | PostgreSQL (Neon — free tier) |
| Auth | JWT (bcryptjs) |
| Payments | M-Pesa STK Push via lipanatechnologies.dev |
| Chat | REST polling (3-second interval, works on serverless) |
| Deployment | Vercel (zero config) |

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| GET  | `/api/auth/me` | User |
| POST | `/api/auth/logout` | User |

### Users
| Method | Endpoint | Auth |
|---|---|---|
| GET  | `/api/users/foreigners` | User |
| GET  | `/api/users/my/connections` | User |
| GET  | `/api/users/my/transactions` | User |
| POST | `/api/users/my/withdraw` | User |
| PUT  | `/api/users/profile/update` | User |
| PUT  | `/api/users/profile/password` | User |

### Payments
| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/payments/connect` | User |
| GET  | `/api/payments/status/:txId` | User |
| POST | `/api/payments/callback` | — (Lipana webhook) |
| POST | `/api/payments/demo-confirm/:txId` | User (Demo only) |

### Messages
| Method | Endpoint | Auth |
|---|---|---|
| GET  | `/api/messages/:connId` | User |
| POST | `/api/messages/:connId` | User |
| GET  | `/api/messages/unread/count` | User |

### Admin (all require admin JWT)
| Method | Endpoint |
|---|---|
| POST | `/api/admin/login` |
| GET  | `/api/admin/stats` |
| GET  | `/api/admin/users` |
| PUT  | `/api/admin/users/:id/ban` |
| PUT  | `/api/admin/users/:id/verify` |
| PUT  | `/api/admin/users/:id/toggle-foreigner` |
| DELETE | `/api/admin/users/:id` |
| POST | `/api/admin/users/add-foreigner` |
| GET  | `/api/admin/transactions` |
| GET  | `/api/admin/withdrawals` |
| PUT  | `/api/admin/withdrawals/:id` |
| GET  | `/api/admin/reports` |
| PUT  | `/api/admin/reports/:id` |
| GET  | `/api/admin/connections` |
| GET  | `/api/admin/connections/:id/messages` |
| GET  | `/api/admin/settings` |
| PUT  | `/api/admin/settings` |

---

## ❓ Troubleshooting

**"Application error" on Vercel**
→ Check Vercel **Functions** logs. Usually a missing env variable.

**Database connection fails**
→ Make sure `POSTGRES_URL` ends with `?sslmode=require` for Neon.

**STK Push not working**
→ Verify your Lipana API key and shortcode. Check Lipana dashboard for error logs.  
→ Your M-Pesa callback URL must be publicly accessible: `https://your-app.vercel.app/api/payments/callback`

**Admin login fails**
→ Default password is `GlobeVibe@Admin2024`. DB seeds on first request — wait a moment after first deploy.

---

Made with ❤️ for connecting the world 🌍
