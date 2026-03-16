# PulseWatch - API Monitoring SaaS Dashboard

A production-ready API Monitoring SaaS platform where developers can monitor their APIs, third-party dependencies, and get alerted about downtime, slow responses, or breaking changes.

## Features (Phase 1 Complete)

### Authentication System
- User registration with email validation
- Login with JWT tokens (access + refresh token pattern)
- Password reset flow
- Logout functionality
- Protected routes

### Monitor Management
- Create monitors with configurable settings
- List monitors with pagination and filtering
- Update monitor configuration
- Delete monitors (soft delete)
- Pause/Resume monitors
- Real-time status 

### Technical Features
- TypeScript for type safety
- REST API with proper error handling
- Input validation and sanitization
- Rate limiting
- JWT authentication with HTTP-only cookies
- PostgreSQL with TimescaleDB for time-series data
- Redis for caching and sessions
- Docker for development environment

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TanStack Query for data fetching
- Tailwind CSS for styling
- shadcn/ui components
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL with TimescaleDB extension
- Redis for caching
- JWT for authentication
- Pino for logging
- Zod for validation

### DevOps
- Docker & Docker Compose
- Environment-based configuration

## Project Structure

```
pulsewatch/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── lib/            # Utilities
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── database/       # Migrations & seeds
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic
│   └── package.json
├── shared/                 # Shared types & utilities
│   └── src/
│       ├── types/          # TypeScript types
│       ├── constants/      # Shared constants
│       └── utils/          # Shared utilities
├── worker/                 # Monitoring job processor (Phase 2)
├── docker-compose.yml      # Docker services
└── package.json            # Root package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pulsewatch
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the infrastructure services (PostgreSQL, Redis, MailHog):
```bash
npm run docker:up
```

5. Run database migrations:
```bash
npm run db:migrate
```

6. (Optional) Seed the database with test data:
```bash
npm run db:seed
```

### Running the Application

#### Development Mode (All Services)

```bash
npm run dev
```

This starts:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- MailHog UI: http://localhost:8025

#### Individual Services

```bash
# Frontend only
npm run dev:client

# Backend only
npm run dev:server

# Worker only (Phase 2)
npm run dev:worker
```

### Default Test Credentials

After seeding the database:
- Email: `test@pulsewatch.io`
- Password: `password123`

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/password-reset-request` | Request password reset |
| POST | `/api/auth/password-reset-confirm` | Confirm password reset |
| POST | `/api/auth/verify-email` | Verify email address |

### Monitor Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/monitors` | List all monitors |
| POST | `/api/monitors` | Create new monitor |
| GET | `/api/monitors/:id` | Get monitor details |
| PUT | `/api/monitors/:id` | Update monitor |
| DELETE | `/api/monitors/:id` | Delete monitor |
| POST | `/api/monitors/:id/pause` | Pause monitor |
| POST | `/api/monitors/:id/resume` | Resume monitor |

## Database Schema

### Core Tables

- **users** - User accounts and profiles
- **user_settings** - User preferences and notification settings
- **monitors** - API endpoints to monitor
- **checks** - Individual health check results (TimescaleDB hypertable)
- **incidents** - Downtime tracking and resolution
- **notifications** - Alert history
- **status_pages** - Public status page configurations
- **refresh_tokens** - JWT refresh token storage
- **password_reset_tokens** - Password reset token storage

## Environment Variables

### Required

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=pulsewatch
DB_PASSWORD=your_secure_password
DB_NAME=pulsewatch

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
```

### Optional

```env
# Application
NODE_ENV=development
APP_URL=http://localhost:5173
API_URL=http://localhost:3001

# Email
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@pulsewatch.io

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Development Commands

```bash
# Start all services in development
npm run dev

# Build all packages
npm run build

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Database operations
npm run db:migrate    # Run migrations
npm run db:seed       # Seed database
npm run db:reset      # Reset database (DANGER!)

# Docker operations
npm run docker:up     # Start infrastructure
npm run docker:down   # Stop infrastructure
npm run docker:logs   # View logs
```

## Security Considerations

1. **Authentication**
   - JWT tokens with short expiration (15 minutes)
   - Refresh tokens stored in HTTP-only cookies
   - Password hashing with bcrypt (12 rounds)
   - Rate limiting on auth endpoints

2. **Input Validation**
   - All inputs validated with express-validator
   - SQL injection protection via parameterized queries
   - XSS protection via helmet middleware

3. **API Security**
   - CORS configured for specific origins
   - Helmet for security headers
   - Rate limiting on all endpoints

4. **Production Checklist**
   - [ ] Change default JWT secrets
   - [ ] Enable HTTPS
   - [ ] Configure production SMTP
   - [ ] Set up log aggregation
   - [ ] Configure monitoring & alerting
   - [ ] Enable database backups

## Roadmap

### Phase 1: Authentication & Monitor CRUD ✅
- User authentication system
- Monitor management
- Basic dashboard

### Phase 2: Worker System & Health Checks
- Background job processor
- Automated health checks
- Check result storage

### Phase 3: Data Visualization
- Historical performance charts
- Uptime statistics
- Response time analytics

### Phase 4: Alerting System
- Email notifications
- Webhook notifications
- Alert threshold configuration

### Phase 5: Status Pages
- Public status page generation
- Custom branding
- Incident history

### Phase 6: Advanced Features
- Multi-region monitoring
- Response time percentiles
- API schema validation
- Incident post-mortems

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@pulsewatch.io or join our Slack channel.
