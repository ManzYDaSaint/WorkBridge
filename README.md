# WorkBridge

## MVP Product & Development Guide

> **Purpose**: This document is a single source of truth for building the WorkBridge MVP. Follow it step by step without overthinking scope.

---

## 1. Product Vision

**WorkBridge** is a mobile-first job marketplace that simplifies job applications by:

* Allowing **verified employers** to post quality jobs
* Allowing **job seekers** to instantly discover and apply for relevant opportunities
* Gradually introducing **AI-powered matching** to personalize job discovery

Primary market: **Malawi (initially)**

---

## 2. Core Principles (DO NOT BREAK THESE)

* Job seekers must have **instant access** (no hard wait-list)
* Employers must be **verified / approved** before posting
* Mobile-first UX (phone screens first)
* Keep MVP simple, reliable, and fast
* Monetize employers first, not job seekers

---

## 3. User Roles

### 3.1 Job Seeker

* Free signup and usage
* Can browse and apply for jobs
* Can receive job recommendations

### 3.2 Employer

* Must be approved before posting jobs
* Pays for job postings and boosts (later)

### 3.3 Admin

* Approves employers
* Manages jobs and users
* Oversees platform integrity

---

## 4. MVP Features (Required)

### 4.1 Authentication & Accounts

#### Job Seeker

* Sign up (email / phone)
* Login / logout
* Profile creation:

  * Full name
  * Location
  * Skills (tags)
  * Experience level
  * Preferred job types

#### Employer

* Sign up
* Company profile:

  * Company name
  * Industry
  * Location
  * Contact details
* Status: `pending | approved | rejected`

---

## 5. Employer Wait-list & Verification

### Employer Flow

1. Employer signs up
2. Account status = `pending`
3. Admin reviews employer
4. Employer is approved
5. Employer can now post jobs

### Verification Criteria (MVP)

* Company name exists
* Contact info is valid
* Not previously flagged

---

## 6. Job Management

### Employer Capabilities

* Create job post:

  * Job title
  * Description
  * Required skills
  * Location
  * Job type (full-time, part-time, contract)
  * Salary range (optional)
* Edit / deactivate job
* View applicants

### Job Seeker Capabilities

* Browse jobs
* Search & filter:

  * Location
  * Job type
  * Skills
* Apply to job

---

## 7. Job Application Flow

1. Job seeker clicks "Apply"
2. Application is created
3. Employer is notified
4. Employer views applicant profile

No complex CV parsing in MVP.

---

## 8. Matching Logic (MVP – Rule-Based)

**No advanced AI in MVP**

Matching factors:

* Skill overlap
* Location match
* Job type preference

Result:

* Jobs ranked by relevance

---

## 9. AI Matching (Post-MVP / Feature Wait-list)

### AI Features (Locked Initially)

* Personalized job feed
* Smart ranking
* Learning from:

  * Clicks
  * Applications
  * Skips

### AI Rollout Strategy

* Feature-based wait-list
* Enable in small batches

---

## 10. Notifications

### MVP Notifications

* In-app notifications
* Email notifications

### Later

* Push notifications
* SMS / WhatsApp alerts (paid)

---

## 11. Admin Dashboard

### Admin Capabilities

* Approve / reject employers
* View all jobs
* Remove fake or expired jobs
* View basic metrics:

  * Total users
  * Active jobs
  * Applications

---

## 12. Monetization Strategy (MVP-Ready)

### Employer Monetization

* Pay-per-job posting
* Featured job boosts
* Verified employer badge

### Job Seeker Monetization (Optional / Later)

* CV boost
* Profile highlighting
* Premium alerts

---

## 13. Payments (Malawi-first)

Required support:

* Airtel Money
* TNM Mpamba

Optional later:

* Bank transfer
* Card payments

---

## 14. Tech Stack (Recommended)

### Frontend

* React (mobile-first)
* Tailwind CSS
* PWA-ready

### Backend

* Node.js
* Fastify
* REST API

### Database

* PostgreSQL

### Auth

* JWT-based authentication

---

## 15. Database Core Tables (Minimum)

* users
* job_seekers
* employers
* jobs
* applications
* waitlist (employers & features)
* notifications
* Audit Logs

---

## 16. Non-Goals (DO NOT BUILD IN MVP)

* Full AI chatbot
* Resume parsing engine
* Video interviews
* Complex analytics
* Multi-country support

---

## 17. Development Phases

### Phase 1 (Weeks 1–2)

* Auth
* User roles
* Employer approval

### Phase 2 (Weeks 3–4)

* Job posting & applications
* Matching
* Notifications

### Phase 3 (Week 5)

* Admin dashboard
* UX polish
* Public MVP launch

---

## 18. Launch Checklist

* Employers onboarded
* At least 20–50 real jobs
* Clear monetization message
* Feedback channel active

---

## 19. Success Metric for MVP

> If employers are posting jobs and job seekers are applying — the MVP is successful.

---

## 20. Long-Term Vision (After Validation)

* Advanced AI matching
* Employer subscriptions
* Recruitment-as-a-service
* Native mobile apps
* Regional expansion

---

**End of Document**

> Build this first. Everything else comes later.
