<h1 align="center">⚡ PulseWatch</h1>

<p align="center">
  <strong>Never let your APIs go dark.</strong><br/>
  Production-ready API monitoring that actually slaps. 🔥
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis"/>
  <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
</p>

---

## 🤔 What is PulseWatch?

**PulseWatch** is a SaaS dashboard for developers who are tired of getting paged at 3 AM because their APIs went down and *nobody told them*.

Monitor your APIs, third-party dependencies, and microservices. Get alerted about downtime, slow responses, or breaking changes — before your users complain on Twitter.

```
🟢 api.yourapp.com         200 OK    45ms    99.99% uptime
🟢 stripe.com/v1/charges   200 OK    120ms   100% uptime
🔴 legacy-service.local    503 💀    —       Alert sent!
```

---

## ✨ Features

### 🔐 **Rock-Solid Authentication**
```
✅ JWT + Refresh Token Pattern   ✅ HTTP-Only Cookies
✅ Password Reset Flow           ✅ Email Verification
✅ Rate Limiting                 ✅ Bcrypt Hashing (12 rounds)
```

### 📊 **Monitor Management**
```
✅ Create/Edit/Delete Monitors   ✅ Pause/Resume Anytime
✅ Real-time Status              ✅ Soft Deletes
✅ Pagination & Filtering        ✅ Custom Check Intervals
```

### 🛡️ **Security First**
```
✅ Input Validation (Zod)        ✅ SQL Injection Protection
✅ XSS Prevention (Helmet)       ✅ CORS Configured
✅ Rate Limiting                 ✅ Parameterized Queries
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Docker | Latest |
| Git | Latest |

### One-Liner Setup

```bash
# Clone → Install → Configure → Start → Migrate → Seed → Done! 🎉
git clone <repo-url> pulsewatch && cd pulsewatch && npm install && cp .env.example .env && npm run docker:up && npm run db:migrate && npm run db:seed
```

### Or, Step by Step

```bash
# 1️⃣ Clone it
git clone <repository-url>
cd pulsewatch

# 2️⃣ Install dependencies
npm install

# 3️⃣ Set up your environment
cp .env.example .env
# 📝 Edit .env with your secrets

# 4️⃣ Fire up the infrastructure
npm run docker:up

# 5️⃣ Run migrations
npm run db:migrate

# 6️⃣ (Optional) Seed test data
npm run db:seed

# 7️⃣ Launch! 🚀
npm run dev
```

### 🌐 Access Points

| Service | URL |
|---------|-----|
| 🖥️ Frontend | http://localhost:5173 |
| ⚙️ Backend API | http://localhost:3001 |
| 📬 MailHog (Dev Email) | http://localhost:8025 |

### 🔑 Test Credentials

```
📧 Email:    test@pulsewatch.io
🔒 Password: password123
```

---

## 🏗️ Tech Stack

<table>
<tr>
<td width="50%" valign="top">

### Frontend 🎨

| Tech | Purpose |
|------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool (⚡ fast) |
| **TanStack Query** | Data Fetching |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | Components |
| **React Router** | Navigation |
| **Axios** | HTTP Client |

</td>
<td width="50%" valign="top">

### Backend ⚙️

| Tech | Purpose |
|------|---------|
| **Node.js** | Runtime |
| **Express** | Web Framework |
| **TypeScript** | Type Safety |
| **PostgreSQL** | Primary DB |
| **TimescaleDB** | Time-Series Data |
| **Redis** | Cache & Sessions |
| **JWT** | Authentication |
| **Pino** | Logging |
| **Zod** | Validation |

</td>
</tr>
</table>

---

## 📁 Project Structure

```
pulsewatch/
│
├── 🎨 client/              # React frontend
│   └── src/
│       ├── components/     # UI building blocks
│       ├── contexts/       # React contexts
│       ├── hooks/          # Custom hooks
│       ├── pages/          # Route pages
│       ├── services/       # API layer
│       └── lib/            # Utils & helpers
│
├── ⚙️ server/              # Express backend
│   └── src/
│       ├── config/         # App config
│       ├── controllers/    # Route handlers
│       ├── database/       # Migrations & seeds
│       ├── middleware/     # Express middleware
│       ├── models/         # Data models
│       ├── routes/         # API routes
│       └── services/       # Business logic
│
├── 📦 shared/              # Shared code
│   └── src/
│       ├── types/          # TypeScript types
│       ├── constants/      # Shared constants
│       └── utils/          # Shared utilities
│
├── 🔧 worker/              # Job processor (Phase 2)
├── 🐳 docker-compose.yml
└── 📄 package.json
```

---

## 📡 API Reference

### 🔐 Authentication

| Method | Endpoint | What it does |
|:------:|----------|--------------|
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/login` | Get your tokens |
| `POST` | `/api/auth/logout` | Invalidate session |
| `POST` | `/api/auth/refresh` | Get fresh access token |
| `GET` | `/api/auth/me` | Who am I? |
| `POST` | `/api/auth/password-reset-request` | Forgot password? |
| `POST` | `/api/auth/password-reset-confirm` | Set new password |
| `POST` | `/api/auth/verify-email` | Confirm email |

### 📊 Monitors

| Method | Endpoint | What it does |
|:------:|----------|--------------|
| `GET` | `/api/monitors` | List all monitors |
| `POST` | `/api/monitors` | Create a monitor |
| `GET` | `/api/monitors/:id` | Get monitor details |
| `PUT` | `/api/monitors/:id` | Update monitor |
| `DELETE` | `/api/monitors/:id` | Delete monitor |
| `POST` | `/api/monitors/:id/pause` | ⏸️ Pause monitoring |
| `POST` | `/api/monitors/:id/resume` | ▶️ Resume monitoring |

---

## 🗄️ Database Schema

```sql
┌─────────────────┐     ┌──────────────────┐
│     users       │────▶│  user_settings   │
└────────┬────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│    monitors     │────▶│     checks       │  ← TimescaleDB hypertable
└────────┬────────┘     └──────────────────┘
         │
         ├────────────▶ incidents
         │
         └────────────▶ notifications

+ refresh_tokens | password_reset_tokens | status_pages
```

---

## ⚙️ Environment Variables

<details>
<summary><b>🔴 Required</b> (click to expand)</summary>

```env
# 🗄️ Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=pulsewatch
DB_PASSWORD=your_secure_password
DB_NAME=pulsewatch

# 📦 Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# 🔑 JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
```

</details>

<details>
<summary><b>🟡 Optional</b> (click to expand)</summary>

```env
# 🌐 Application
NODE_ENV=development
APP_URL=http://localhost:5173
API_URL=http://localhost:3001

# 📧 Email (MailHog in dev)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@pulsewatch.io

# 🚦 Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

</details>

---

## 🛠️ Commands Cheatsheet

```bash
# 🚀 Development
npm run dev              # Start everything
npm run dev:client       # Frontend only
npm run dev:server       # Backend only
npm run dev:worker       # Worker only (Phase 2)

# 🔨 Build
npm run build            # Build all packages
npm run typecheck        # Type checking
npm run lint             # Linting

# 🗄️ Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed data
npm run db:reset         # ⚠️ Reset everything

# 🐳 Docker
npm run docker:up        # Start services
npm run docker:down      # Stop services
npm run docker:logs      # View logs
```

---

## 🔒 Security Checklist

### Development ✅
- [x] JWT with short expiration (15 min)
- [x] Refresh tokens in HTTP-only cookies
- [x] Password hashing (bcrypt, 12 rounds)
- [x] Rate limiting on auth endpoints
- [x] Input validation with Zod
- [x] SQL injection protection
- [x] XSS prevention with Helmet
- [x] CORS properly configured

### Production 🚨
- [ ] Change default JWT secrets
- [ ] Enable HTTPS (TLS 1.3)
- [ ] Configure production SMTP
- [ ] Set up log aggregation
- [ ] Configure monitoring & alerting
- [ ] Enable automated DB backups
- [ ] Set up WAF/DDoS protection

---

## 🗺️ Roadmap

```
Phase 1 ████████████████████ ✅ COMPLETE
  └─ Auth System + Monitor CRUD + Dashboard

Phase 2 ████████░░░░░░░░░░░░ 🚧 IN PROGRESS
  └─ Worker System + Health Checks + Result Storage

Phase 3 ░░░░░░░░░░░░░░░░░░░░ 📋 PLANNED
  └─ Charts + Uptime Stats + Response Analytics

Phase 4 ░░░░░░░░░░░░░░░░░░░░ 📋 PLANNED
  └─ Email Alerts + Webhooks + Custom Thresholds

Phase 5 ░░░░░░░░░░░░░░░░░░░░ 📋 PLANNED
  └─ Public Status Pages + Custom Branding

Phase 6 ░░░░░░░░░░░░░░░░░░░░ 🔮 FUTURE
  └─ Multi-Region + Percentiles + Schema Validation
```

---

## 🤝 Contributing

We love contributions! Here's how:

```bash
# 1. Fork it 🍴
# 2. Create your feature branch
git checkout -b feature/awesome-feature

# 3. Commit your changes
git commit -m '✨ Add awesome feature'

# 4. Push to the branch
git push origin feature/awesome-feature

# 5. Open a Pull Request 🎉
```

---

## 📄 License

MIT License — go wild! 🎸

---

<p align="center">
  <b>Built with ☕ and questionable amounts of caffeine.</b><br/>
  <sub>Questions? Reach out at <a href="mailto:support@pulsewatch.io">support@pulsewatch.io</a></sub>
</p>

<p align="center">
  <a href="#">⬆️ Back to Top</a>
</p>
