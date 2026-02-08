# WorkBridge

> **Purpose**: Single source of truth for building the WorkBridge MVP. Follow step by step without overthinking scope.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Core Principles](#2-core-principles)
3. [User Roles](#3-user-roles)
4. [MVP Features](#4-mvp-features)
5. [Tech Stack & Architecture](#5-tech-stack--architecture)
6. [Getting Started](#6-getting-started)
7. [Environment Setup](#7-environment-setup)
8. [Contributing](#8-contributing)
9. [Security](#9-security)
10. [Non-Goals & Roadmap](#10-non-goals--roadmap)
11. [DevOps Build Plan](#11-devops-build-plan)

---

## 1. Product Vision

**WorkBridge** is a mobile-first job marketplace that simplifies job applications by:

- Allowing **verified employers** to post quality jobs
- Allowing **job seekers** to instantly discover and apply for relevant opportunities
- Gradually introducing **AI-powered matching** to personalize job discovery

Primary market: **Malawi (initially)**

---

## 2. Core Principles (DO NOT BREAK THESE)

- Job seekers must have **instant access** (no hard wait-list)
- Employers must be **verified / approved** before posting
- Mobile-first UX (phone screens first)
- Keep MVP simple, reliable, and fast
- Monetize employers first, not job seekers

---

## 3. User Roles

| Role | Capabilities |
|------|--------------|
| **Job Seeker** | Free signup, browse/apply for jobs, receive recommendations |
| **Employer** | Must be approved before posting; pays for job postings (later) |
| **Admin** | Approves employers, manages jobs/users, oversees platform integrity |

---

## 4. MVP Features

### Authentication & Profiles

- **Job Seeker**: Sign up (email/phone), login/logout, profile (full name, location, skills, resume)
- **Employer**: Sign up, company profile (name, industry, location); status `pending | approved | rejected`

### Employer Verification Flow

1. Employer signs up → status = `pending`
2. Admin reviews → approves/rejects
3. Approved employers can post jobs

### Job Management

- **Employer**: Create jobs (title, description, skills, location, type, salary range), edit/deactivate, view applicants
- **Job Seeker**: Browse, search & filter (location, type, skills), apply

### Notifications

- In-app notifications
- Email notifications (Resend)

---

## 5. Tech Stack & Architecture

### Stack

- **Frontend**: React + Vite, Tailwind CSS, PWA-ready
- **Backend**: Node.js + Fastify (microservices)
- **Database**: PostgreSQL (one per service)
- **Auth**: JWT stateless sessions

### Microservices Architecture

```
                    ┌─────────────────┐
                    │   Frontend      │  Port 5173
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  API Gateway    │  Port 3000
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Auth (3001)   │  │ Profile (3002)  │  │ Jobs (3003)     │
│ auth_db       │  │ profile_db      │  │ jobs_db         │
└───────────────┘  └─────────────────┘  └─────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌─────────────────┐
│Notifications  │  │ Admin (3005)    │
│ (3004) notif  │  │ admin_db        │
└───────────────┘  └─────────────────┘
```

| Service | Port | Database | Responsibility |
|---------|------|----------|----------------|
| API Gateway | 3000 | - | Routes requests to backend services |
| Auth Service | 3001 | auth_db | Users, JWT, login/register |
| Profile Service | 3002 | profile_db | JobSeeker & Employer profiles |
| Jobs Service | 3003 | jobs_db | Jobs, Applications |
| Notifications Service | 3004 | notif_db | In-app notifications |
| Admin Service | 3005 | admin_db | Admin dashboard, audit logs |
| AI Matching Service | 3006 | - | Rule-based candidate matching |

### API Gateway Routing

| Path | Target |
|------|--------|
| `/login`, `/register`, `/refresh`, `/logout` | Auth |
| `/profile/*` | Profile |
| `/notifications/toggle-subscription` | Profile |
| `/notifications/*` | Notifications |
| `/jobs/*` | Jobs |
| `/admin/*` | Admin |
| `/ai/*` | AI Matching |
| `/health` | Gateway |

### Shortlisting & Notifications

- Shortlist creation is queued and runs asynchronously after job creation.
- Employers can trigger a rebuild or notify selected candidates:
  - `POST /jobs/:id/shortlist/rebuild`
  - `POST /jobs/:id/shortlist/notify` with `{ "seekerIds": ["..."] }`

---

## 6. Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL v14+ (or Docker)
- Docker Desktop (Windows) with WSL2 backend enabled
- npm

### Quick Start

```bash
# 1. Clone & install
git clone https://github.com/ManzyDaSaint/WorkBridge.git
cd WorkBridge
npm run install:all

# 2. Start databases
docker-compose up -d

# 3. Configure environment (see §7)
# Copy env.example → .env in each service under apps/

# 4. Generate Prisma & migrate
npm run generate:all
npm run migrate:all

# 5. Seed admin user (optional)
cd apps/auth-service && ADMIN_EMAIL=admin@workbridge.me ADMIN_PASSWORD=YourPass npm run seed:admin && cd ../..

# 6. Start all backend services
npm run dev

# 7. In another terminal: start frontend
npm run dev:web
```

### Run Individual Services

- `npm run dev:gateway` — API Gateway (3000)
- `npm run dev:auth` — Auth Service (3001)
- `npm run dev:profile` — Profile Service (3002)
- `npm run dev:jobs` — Jobs Service (3003)
- `npm run dev:notifications` — Notifications Service (3004)
- `npm run dev:admin` — Admin Service (3005)
- `npm run dev:ai` — AI Matching Service (3006)
- `npm run dev:web` — Frontend (5173)

### PWA / Offline Support

- The web app uses a PWA service worker for offline and unstable networks.
- Build with `npm run build --prefix apps/web` to generate the service worker.

---

## 7. Environment Setup

Copy `env.example` to `.env` in each service directory (`apps/*/`).

**Required (all services):**

- `JWT_SECRET` — must be identical across all services
- `DATABASE_URL` — per-service PostgreSQL connection string

**Example URLs (local Docker):**

| Service | DATABASE_URL |
|---------|--------------|
| auth-service | `postgresql://workbridge_auth:workbridge_auth_pass@localhost:5433/workbridge_auth_db` |
| profile-service | `postgresql://workbridge_profile:workbridge_profile_pass@localhost:5434/workbridge_profile_db` |
| jobs-service | `postgresql://workbridge_jobs:workbridge_jobs_pass@localhost:5435/workbridge_jobs_db` |
| notifications-service | `postgresql://workbridge_notif:workbridge_notif_pass@localhost:5436/workbridge_notif_db` |
| admin-service | `postgresql://workbridge_admin:workbridge_admin_pass@localhost:5437/workbridge_admin_db` |

**Inter-service URLs** (when services run on localhost):

- `AUTH_SERVICE_URL=http://localhost:3001`
- `PROFILE_SERVICE_URL=http://localhost:3002`
- `JOBS_SERVICE_URL=http://localhost:3003`
- `NOTIFICATIONS_SERVICE_URL=http://localhost:3004`
- `ADMIN_SERVICE_URL=http://localhost:3005`

---

## 8. Contributing

### Workflow

1. Fork the repo and create a branch from `main`
2. Commit with descriptive messages
3. Open a Pull Request against `main`

### Branch Naming

- `feature/short-description` — New features
- `fix/short-description` — Bug fixes
- `docs/short-description` — Documentation
- `refactor/short-description` — Refactoring

### Pull Request Standards

- Clear title and summary
- Link related issues
- Pass tests and linting
- At least one maintainer approval

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/): `feat: add X`, `fix: resolve Y`, etc.

---

## 9. Security

- **Authentication**: JWT with short-lived tokens and secure refresh
- **Authorization**: RBAC (Seekers, Employers, Admins)
- **Audit Trails**: Critical actions logged in `admin_db`
- **Input Validation**: Schema validation (Zod)

**Security issues**: Do not open public issues. Email security@workbridge.me (placeholder).

---

## 10. Non-Goals & Roadmap

**Not in MVP**

- Full AI chatbot
- Resume parsing engine
- Video interviews
- Complex analytics
- Multi-country support

**Post-MVP**

- AI-powered job matching
- Push notifications, SMS/WhatsApp
- Payment gateways (Airtel Money, TNM Mpamba)

---

> Build with focus. Scale with intent.

---

## 11. DevOps Build Plan

This section implements the DevOps recommendations **one by one**. Complete each step before starting the next.

### Step 1: Containerize All Services

**Goal:** Build/run every service (gateway, auth, profile, jobs, notifications, admin, web) with Docker.

**What to add**

- `Dockerfile` for each backend service under `apps/*-service/`
- `Dockerfile` for `apps/api-gateway/`
- `Dockerfile` for `apps/web/`
- A new `docker-compose.app.yml` that starts all services plus databases

**Why this is first**

- Creates a consistent runtime artifact
- Unblocks local, staging, and production parity

**Definition of Done**

- `docker compose -f docker-compose.yml -f docker-compose.app.yml up` starts all services
- API gateway can route to all services
- Web app loads against the gateway

**How to run (Docker Compose only)**

```bash
# Start databases
docker compose -f docker-compose.yml up -d

# Start all apps
docker compose -f docker-compose.yml -f docker-compose.app.yml up --build
```

**Notes**

- The app compose file injects container-friendly `DATABASE_URL` values and service URLs.
- Prisma `generate` and `migrate` run on container start for services that use Prisma.

---

### Step 2: CI Pipeline (Build + Test)

**Goal:** Every push runs tests and builds artifacts.

**What to add**

- A CI pipeline (GitHub Actions or equivalent) to run:
  - `npm run install:all`
  - Prisma `generate` + `migrate` per service against a CI database
  - Web tests (when present)
  - `apps/web` build

**Definition of Done**

- PRs show CI status
- Failed builds block merge

**Current implementation**

- GitHub Actions workflow: `.github/workflows/ci.yml`
- Runs on Ubuntu with a Postgres service container

---

### Step 3: Environment & Secrets Strategy

**Goal:** Separate dev/staging/prod configs and remove secrets from local `.env` for production.

**What to add**

- Document environment variables per service
- Use a secrets manager in production (AWS Secrets Manager, Vault, etc.)
- Add safe defaults for local dev

**Definition of Done**

- `.env` only used for local dev
- Production secrets never committed

**Current implementation**

- Environment variable reference: `docs/env.md`
- Secrets strategy guidance: `docs/secrets.md`

---

### Step 4: Observability (Logs + Metrics)

**Goal:** Production visibility into failures and performance.

**What to add**

- Structured logging (JSON)
- Metrics endpoint (Prometheus-compatible)
- Tracing (OpenTelemetry)

**Definition of Done**

- Logs, metrics, and traces work in local compose
- Basic dashboards exist for latency/errors

**Current implementation**

- Observability guidance: `docs/observability.md`
- Beginner-friendly local stack: `docker-compose.observability.yml`
- Each service exposes `/metrics` and writes logs to `apps/<service>/logs/*.log`

---

### Step 5: Infrastructure as Code

**Goal:** Fully reproducible infrastructure.

**What to add**

- IaC (Terraform/Pulumi) for databases, networking, and compute
- Staging and production environments

**Definition of Done**

- A new environment can be created from scratch with IaC

**Current implementation**

- IaC starter guidance: `docs/iac.md`
- Render Blueprints: `render.staging.yaml`, `render.production.yaml`
