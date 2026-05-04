# CodeHub — Definitive Codebase Reference

> **Last Updated:** 2026-05-03
> **Stack:** Next.js 15 (App Router) · NextAuth v4 · Prisma v6 · PostgreSQL · Tailwind CSS v3 · TypeScript · Zod · Framer Motion

---

## 1. Project Architecture

### Directory Structure
```
codehub/
├── prisma/                    # Database schema, migrations, seed
│   ├── schema.prisma          # Main schema (10 models, 6 enums)
│   ├── seed.js                # Database seeder (platforms, tasks, users, bookings)
│   └── migrations/            # 6 migrations
├── scripts/                   # Operational scripts
│   ├── enroll-existing-users.js
│   ├── reset-user-balances.js
│   ├── restore-users.js
│   └── run-enrollment.js
├── src/
│   ├── app/
│   │   ├── (auth)/            # Route group: login, signup pages
│   │   ├── (dashboard)/       # Route group: student, admin dashboards
│   │   ├── api/               # 11 API route directories
│   │   ├── globals.css        # Global styles + Tajawal Arabic font
│   │   ├── layout.tsx         # Root layout (RTL, Arabic)
│   │   ├── page.tsx           # Landing page (Matrix theme)
│   │   └── providers.tsx      # SessionProvider wrapper
│   ├── components/
│   │   ├── calendar/          # CalendarBase, TimeSlotGrid, Admin/Student calendars
│   │   ├── mentorship/        # LiveSessionBooking, RecordedSessionsList
│   │   ├── magicui/           # Terminal animation component
│   │   ├── ui/                # Toast notification system
│   │   ├── digital-rain.tsx   # Matrix canvas animation
│   │   ├── matrix-particles.tsx
│   │   └── terminal-demo.tsx  # Landing page terminal demo
│   ├── lib/                   # auth.ts, prisma.ts, dateUtils.ts, utils.ts
│   ├── types/                 # TypeScript interfaces + NextAuth augmentation
│   └── utils/                 # calendar-helpers.ts
├── next.config.mjs            # ignoreBuildErrors: true, ignoreDuringBuilds: true
├── tailwind.config.js         # Apple-inspired design system
└── tsconfig.json              # ES5 target, path aliases @/*
```

### Route Groups
- `(auth)` — `/login`, `/signup` — public auth pages, redirect if authenticated
- `(dashboard)` — `/student`, `/student/mentorship`, `/student/profile`, `/student/recenttransactions`, `/admin`

### Middleware (`src/middleware.ts`)
- Uses `next-auth/jwt` `getToken()` with `SUPABASE_JWT_SECRET`
- **Protected routes:** `/student`, `/platforms`, `/tasks`, `/submissions`, `/admin`, `/profile`
- **Admin-only:** `/admin` — non-admin authenticated users redirected to `/student`
- **Auth redirect:** Authenticated users on `/login` or `/signup` → role-based dashboard
- **Root redirect:** Authenticated users on `/` → role-based dashboard
- **Matcher:** Excludes `api`, `_next/static`, `_next/image`, `favicon.ico`, SVGs

### Roles
| Role | Access |
|------|--------|
| `STUDENT` | Student dashboard, mentorship, profile, submissions, enrollments |
| `ADMIN` | Admin dashboard (all tabs), all API management endpoints |

---

## 2. Database Schema

### Models

#### User
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| email | String | Unique |
| name | String? | |
| phoneNumber | String? | Unique |
| password | String | bcrypt hashed |
| role | Role (STUDENT/ADMIN) | Default: STUDENT |
| balance | Decimal(10,2) | Default: 500.00 (schema) / 0.00 (signup code) |
| isMentor | Boolean | Default: false |
| mentorBio | String? | |
| mentorRate | Decimal(10,2)? | |
| Relations | submissions, accounts, sessions, enrollments, transactions, studentBookings, mentorBookings |

#### Platform
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String | Unique |
| description | String? | |
| url | String | Platform URL |
| courseLink | String? | Course materials link |
| price | Decimal(10,2)? | |
| isPaid | Boolean | Default: false |
| Relations | tasks (cascade), enrollments (cascade) |

#### Task
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| title | String | |
| description | String? | |
| link | String? | Task content URL |
| platformId | String | FK → Platform (cascade delete) |
| order | Int | Default: 0, for sorting |
| Relations | platform, submissions (cascade) |
| Indexes | platformId |

#### Submission
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| summary | Text | Student's task summary |
| status | SubmissionStatus | Default: PENDING |
| score | Int? | 0-100, set when APPROVED |
| feedback | Text? | Admin feedback |
| userId | String | FK → User (cascade) |
| taskId | String | FK → Task (cascade) |
| Unique | [userId, taskId] — one submission per user per task |

#### Enrollment
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| userId | String | FK → User (cascade) |
| platformId | String | FK → Platform (cascade) |
| expiresAt | DateTime | 30 days from enrollment |
| isActive | Boolean | Default: true |
| lastRenewalAt | DateTime? | |
| Unique | [userId, platformId] |

#### Transaction
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| userId | String | FK → User (cascade) |
| type | TransactionType | TOP_UP, PLATFORM_PURCHASE, MENTORSHIP_PAYMENT, RECORDED_SESSION, FACE_TO_FACE_SESSION |
| amount | Decimal(10,2) | |
| status | TransactionStatus | PENDING, APPROVED, REJECTED |
| description | String? | |
| senderWalletNumber | String? | |
| adminWalletNumber | String? | Hardcoded: `01026454497` |

#### MentorshipBooking
| Field | Type | Notes |
|-------|------|-------|
| studentId | String | FK → User "StudentBookings" (cascade) |
| mentorId | String | FK → User "MentorBookings" (cascade) |
| sessionType | SessionType | RECORDED or FACE_TO_FACE |
| duration | Int | Default: 60 minutes |
| amount | Decimal(10,2) | |
| status | BookingStatus | PENDING, CONFIRMED, COMPLETED, CANCELLED |
| sessionDate | DateTime? | |
| sessionStartTime/EndTime | String? | HH:MM format |
| originalSessionDate | DateTime? | For change tracking |
| dateChanged | Boolean | Default: false |
| whatsappNumber | String? | For face-to-face |
| videoLink | String? | For recorded sessions |
| meetingLink | String? | Admin-provided |
| availableDateId | String? | Reference to AvailableDate |

#### AvailableDate
| Field | Type | Notes |
|-------|------|-------|
| date | DateTime | Calendar date |
| startTime/endTime | String | HH:MM format |
| timeSlot | String | Display: "09:00 - 10:00" |
| isBooked | Boolean | Default: false |
| bookingId | String? | |
| isRecurring | Boolean | Default: false |
| dayOfWeek | Int? | 0-6 (Sun-Sat) |
| Unique | [date, startTime, endTime] |
| Indexes | date, isBooked, dayOfWeek |

#### RecordedSession
| Field | Type | Notes |
|-------|------|-------|
| title | String | |
| description | String? | |
| videoLink | String | |
| price | Decimal(10,2) | |
| isActive | Boolean | Default: true |

#### Also: Account, Session, VerificationToken (NextAuth adapter models)

### Enums
- `Role`: STUDENT, ADMIN
- `SubmissionStatus`: PENDING, APPROVED, REJECTED
- `TransactionType`: TOP_UP, PLATFORM_PURCHASE, MENTORSHIP_PAYMENT, RECORDED_SESSION, FACE_TO_FACE_SESSION
- `TransactionStatus`: PENDING, APPROVED, REJECTED
- `BookingStatus`: PENDING, CONFIRMED, COMPLETED, CANCELLED
- `SessionType`: RECORDED, FACE_TO_FACE

### Migration History
1. `20250710` — add_enrollment_expiration
2. `20250712` — mentorship_upgrade
3. `20250712` — add_recorded_session_model
4. `20250716` — update_available_dates_schema
5. `20250720` — add_phone_number_to_user
6. `20250925` — add_course_link_to_platform

---

## 3. All API Routes

### Authentication
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/[...nextauth]` | GET/POST | Public | NextAuth handler (credentials provider, JWT strategy) |
| `/api/auth/signup` | POST | Public | User registration with Zod validation, auto-enroll in JS Tasks platform, welcome transaction |

**Signup flow:** Validate → Check duplicate email/phone → Hash password (bcrypt, 12 rounds) → Create user (balance: 0.00) → Create welcome TOP_UP transaction (500 EGP, APPROVED) → Auto-enroll in "مهام JavaScript العملية" (365-day access) → Return user

### Platforms
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/platforms` | GET | Auth | List all platforms (optional `include_tasks=true` with user's submissions) |
| `/api/platforms` | POST | Admin | Create platform (name, description, url, courseLink) |
| `/api/platforms/[id]` | GET | Auth+Enrolled | Get single platform (checks enrollment + expiration) |
| `/api/platforms/[id]` | PUT | Admin | Update platform (unique name check) |
| `/api/platforms/[id]` | DELETE | Admin | Delete platform (blocked if submissions exist; tasks cascade) |

### Tasks
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/tasks` | GET | Auth | List tasks (optional `platformId` filter, enrollment check) |
| `/api/tasks` | POST | Admin | Create task (Zod validation, auto-order) |
| `/api/tasks/[id]` | GET | Auth+Enrolled | Get single task (enrollment + expiration check) |
| `/api/tasks/[id]` | PUT | Admin | Update task |
| `/api/tasks/[id]` | DELETE | Admin | Delete task (blocked if submissions exist) |

### Submissions
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/submissions` | GET | Auth | List submissions (students: own only; admins: all, filterable by userId/taskId; paginated) |
| `/api/submissions` | POST | Student | Create submission (one active per task, resubmit only if REJECTED) |
| `/api/submissions/[id]` | GET | Auth | Get submission (students: own only) |
| `/api/submissions/[id]` | PATCH | Admin | Score/review submission (status, score 0-100, feedback) |
| `/api/submissions/[id]` | DELETE | Admin | Delete submission |

### Enrollments
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/enrollments` | GET | Auth | Get user's enrollments with expiration status (active/expiring_soon/expired) |
| `/api/enrollments` | POST | Auth | Enroll in platform (paid: balance check + deduct + transaction; 30-day expiry) |
| `/api/enrollments` | PUT | Auth | Renew expired enrollment (same payment flow; resets 30 days) |

### Wallet & Transactions
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/wallet` | GET | Auth | Get user balance |
| `/api/wallet` | POST | Auth | Request top-up (creates PENDING transaction, 10-1000 range) |
| `/api/wallet/topup` | POST | Auth | Request top-up (alternate, min 1 EGP, includes phone number) |
| `/api/wallet/topup` | GET | Auth | Get user's TOP_UP transaction history |
| `/api/transactions` | GET | Auth | Get user's transaction history (paginated) |

### Mentorship
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/mentorship` | GET | Auth | Get mentor info, user's bookings, available dates, recorded sessions, pricing |
| `/api/mentorship` | POST | Auth | Book session (RECORDED: select session, auto-CONFIRMED; FACE_TO_FACE: select date+WhatsApp, PENDING) |
| `/api/mentorship/available-dates` | GET | Auth | Get unbooked future dates (optional date range, grouped mode) |
| `/api/mentorship/recorded-sessions` | GET | Auth | Get active recorded sessions |
| `/api/mentorship/recorded-sessions` | POST | Auth | Purchase recorded session (balance check, deduct, create booking) |

### Admin APIs
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/admin/stats` | GET | Admin | Dashboard stats (students, submissions, bookings counts) |
| `/api/admin/transactions` | GET | Admin | All transactions (paginated, filterable by status/type) |
| `/api/admin/transactions` | PATCH | Admin | Approve/reject transaction (TOP_UP approval credits balance) |
| `/api/admin/mentorship` | GET | Admin | All bookings with stats and revenue |
| `/api/admin/mentorship` | PATCH | Admin | Update booking (status, date, links, notes; CANCELLED → refund) |
| `/api/admin/mentorship` | PUT | Admin | Update mentor settings (rate, bio) |
| `/api/admin/available-dates` | GET | Admin | All dates (filterable, include booked option) |
| `/api/admin/available-dates` | POST | Admin | Create dates (single, bulk with date range, recurring template) |
| `/api/admin/available-dates` | PUT | Admin | Update unbooked date |
| `/api/admin/available-dates` | DELETE | Admin | Delete date(s) (single or all unbooked) |
| `/api/admin/recorded-sessions` | GET/POST/PUT/DELETE | Admin | Full CRUD for recorded sessions |
| `/api/admin/topup` | GET | Admin | Get pending top-up requests |
| `/api/admin/topup` | POST | Admin | Approve/reject top-up (approval increments balance) |
| `/api/users` | GET | Admin | List users (optional role filter, includeProgress with stats) |
| `/api/users` | POST | Admin | Create user (with hashed password) |
| `/api/users` | PUT | Admin | Update user (name, phone, role; can't change own role) |
| `/api/users` | DELETE | Admin | Delete user (blocked if has submissions/transactions/enrollments/bookings) |

---

## 4. Student Dashboard (`/student`)

**File:** `src/app/(dashboard)/student/page.tsx` (71KB)

### Features
- **Platform Cards** — Shows enrolled platforms with expiration status badges (active/expiring_soon/expired), renewal button for expired
- **Task Cards** — Per-platform task list with submission status indicators (pending/approved/rejected), score display
- **Submission Modal** — Text area for summary submission, one active submission per task
- **Wallet Section** — Balance display, top-up request flow
- **Stats Section** — Progress rings showing completion rate, average score, submission counts
- **Expiration Notifications** — Warning banners for expiring/expired enrollments

### Layout (`layout.tsx`)
- Sidebar navigation with links to dashboard, mentorship, profile, transactions
- Session-aware header with user name and logout
- RTL Arabic layout

---

## 5. Admin Dashboard (`/admin`)

**File:** `src/app/(dashboard)/admin/page.tsx` (185KB — monolithic)

### Tabs
1. **Overview** — Stats cards (students, submissions, platforms, mentorship bookings)
2. **Students** — User list with filters, progress stats
3. **Submissions** — Review modal with scoring (0-100) and feedback, status updates
4. **Transactions** — Approve/reject pending top-ups, filter by status/type
5. **Mentorship Bookings** — Update modal (status, date, meeting/video links, admin notes), cancellation with refund
6. **Available Dates** — CalendlyAdminCalendar for bulk creation, date range generation, weekend exclusion
7. **Platforms** — CRUD management
8. **Tasks** — CRUD management with platform assignment
9. **Users** — CRUD management, role assignment
10. **Recorded Sessions** — CRUD management

### Features
- Toast notification system, confirmation modals, optimistic updates, client-side cache

---

## 6. Mentorship System (`/student/mentorship`)

**File:** `src/app/(dashboard)/student/mentorship/page.tsx` (20KB)

### Two Session Types
1. **Recorded Sessions** — Browse catalog, purchase (balance deduction), instant access to video link, auto-CONFIRMED
2. **Face-to-Face Sessions** — Select available date/time slot via CalendlyStudentCalendar, provide WhatsApp number, pay 500 EGP, status starts as PENDING

### Booking Flow
1. Student selects session type
2. For face-to-face: picks date → time slot → enters WhatsApp number → optional notes
3. Balance checked and deducted
4. Transaction created (APPROVED)
5. Booking created
6. For face-to-face: AvailableDate marked as booked

### Pricing (hardcoded in API)
- Recorded session: price from RecordedSession model
- Face-to-face session: 500 EGP fixed

### Booking Status Lifecycle
`PENDING` → `CONFIRMED` → `COMPLETED` (or `CANCELLED` with refund at any stage)

---

## 7. Calendar System

### Components
- **CalendarBase** (`7KB`) — Month grid with Arabic day names, Saturday-start weeks, date highlighting
- **TimeSlotGrid** (`11KB`) — Displays available time slots for selected date, selection handling
- **CalendlyAdminCalendar** (`18KB`) — Bulk date creation UI, date range picker, time slot configuration, weekend exclusion toggle
- **CalendlyStudentCalendar** (`6KB`) — Read-only calendar showing available dates, slot selection for booking

### Utilities (`calendar-helpers.ts`)
- `TIME_SLOTS` — 9 hourly slots (09:00-18:00) with Arabic labels
- `formatDateArabic`, `formatTimeArabic` — Arabic locale formatting
- `generateCalendarDays` — Month grid generation (Saturday start)
- `isDateAvailable`, `getAvailableTimeSlotsForDate` — Availability checks
- `generateDateRange`, `filterWeekdays` — Bulk operations (excludes Fri/Sat)
- `getDateCellClasses`, `getTimeSlotClasses` — Styling utilities

---

## 8. Authentication & Authorization

### NextAuth Configuration (`lib/auth.ts`)
- **Provider:** CredentialsProvider (email + password)
- **Adapter:** PrismaAdapter from `@auth/prisma-adapter`
- **Strategy:** JWT (maxAge: 60 days)
- **Secret:** `process.env.SUPABASE_JWT_SECRET`
- **Custom pages:** signIn → `/login`

### JWT Callbacks
- `jwt`: Attaches `id`, `role`, `name`, `phoneNumber` to token
- `session`: Maps token fields to `session.user`
- `redirect`: Allows relative URLs, same-origin; defaults to `/student`

### Type Extensions (`types/next-auth.d.ts`)
- `Session.user` extended with `id`, `role`, `phoneNumber`
- `JWT` extended with `id`, `role`, `phoneNumber`

### Signup (`api/auth/signup/route.ts`)
- Zod validation (email, password min 6, name, phoneNumber)
- Duplicate check on email OR phoneNumber
- Password hashed with bcrypt (12 rounds)
- Prisma transaction: create user → welcome transaction → auto-enroll in JS Tasks

---

## 9. Frontend Architecture

### Root Layout
- `lang="ar" dir="rtl"` — Full Arabic RTL support
- Fonts: Geist Sans + Geist Mono (with system fallbacks)
- SessionProvider wrapper

### Global CSS (`globals.css`)
- Google Fonts: Tajawal (Arabic font, weights 200-900)
- Apple-inspired CSS custom properties (colors, spacing, radius, shadows, transitions)
- Glassmorphism classes (`.glass`, `.glass-dark`)
- Animation keyframes: fadeIn, slideUp, scaleIn, float, pulse, bounce, fadeInUp, glow, shimmer
- Hover effects: `.hover-lift`, `.hover-scale`, `.btn-hover`
- Reduced motion support via `prefers-reduced-motion`

### Tailwind Config Extensions
- Apple color palette, custom box shadows, glassmorphism backdrop blur
- Custom component classes via plugin: `.btn-apple`, `.card-apple`, `.glass`, `.input-apple`
- Legacy color palettes (primary/secondary/accent/neutral)

### Key Components
- **Toast** (`ui/Toast.tsx`) — Success/error/info notifications with auto-dismiss
- **Terminal** (`magicui/terminal.tsx`) — Matrix-themed terminal with typing animation, animated spans
- **DigitalRain** — Canvas-based Matrix rain (Arabic + Latin + symbols)
- **MatrixParticles** — Floating particle animation
- **TerminalDemo** — Landing page animated Arabic typing demo

---

## 10. Landing Page (`page.tsx`)

- **Matrix Digital Rain** — Full-screen canvas with Arabic/Latin/symbol characters
- **Matrix Particles** — Floating animated particles
- **Floating Code Symbols** — Lucide icons (Code, Terminal, Cpu, Binary, Zap) with CSS animations
- **Floating Code Snippets** — Animated code text fragments
- **Glassmorphism Header** — Backdrop-blur header with codeHub branding
- **CTA Buttons** — "إنشاء حساب" (signup) with pulse-green glow, "تسجيل الدخول" (login) with glass effect
- **Terminal Demo** — Animated Arabic typing terminal showcase

---

## 11. Enrollment & Wallet System

### Enrollment Flow
1. Student selects platform → `POST /api/enrollments`
2. If paid: balance check → deduct → create PLATFORM_PURCHASE transaction → create enrollment (30 days)
3. If free: create enrollment (30 days)
4. Auto-enrollment on signup: JS Tasks platform (365 days)

### Expiration Logic
- `expiresAt` = createdAt + 30 days
- Status computed: `expired` (past), `expiring_soon` (≤7 days), `active`
- Expired enrollments block task/platform API access (403 with `enrollmentExpired: true`)
- Renewal: `PUT /api/enrollments` — resets 30 days, charges if paid

### Wallet/Top-Up Flow
1. Student requests top-up → `POST /api/wallet/topup` → creates PENDING transaction
2. Admin sees pending requests via `/api/admin/topup`
3. Admin approves → transaction status → APPROVED, user balance incremented
4. Admin rejects → transaction status → REJECTED, no balance change

### Transaction Types
| Type | Trigger | Auto-status |
|------|---------|-------------|
| TOP_UP | Student request | PENDING → admin approves/rejects |
| PLATFORM_PURCHASE | Enrollment/renewal | APPROVED (immediate) |
| RECORDED_SESSION | Session purchase | APPROVED (immediate) |
| FACE_TO_FACE_SESSION | Session booking | APPROVED (immediate) |

---

## 12. Known Issues & Incomplete Areas

### Critical Bugs
1. **`recorded-sessions/route.ts` POST** — References undefined `mentor` variable (line 141) and `transaction` variable (line 152). The `mentor` is fetched as `adminUser` but referenced as `mentor` inside the transaction block. Also uses `'DEBIT'` and `'COMPLETED'` which are not valid enum values.

2. **Signup balance mismatch** — Schema default is `500.00`, but signup code sets `balance: 0.00` and creates a welcome transaction of `500.00` (APPROVED) that doesn't actually credit the balance.

### Unused Dependencies
| Package | Status |
|---------|--------|
| `express` | Never imported in any Next.js file |
| `express-validator` | Never imported |
| `cors` | Never imported |
| `jsonwebtoken` | Never imported |
| `multer` | Never imported |
| `pg` | Never imported (Prisma handles DB) |
| `@next-auth/prisma-adapter` | Duplicate — `@auth/prisma-adapter` is the one actually used |
| `@types/cors` | Unused dev dep |
| `@types/jsonwebtoken` | Unused dev dep |
| `@types/multer` | Unused dev dep |
| `ts-node` | Unused in Next.js context |
| `ts-node-dev` | Unused in Next.js context |
| `react-calendar` | Not imported anywhere |
| `react-intersection-observer` | Not imported in reviewed files |

### Duplicate/Dead Files
- `src/app/api/auth/signup/_.ts` — Duplicate of route.ts with different balance (1000 vs 0)
- `src/components/mentorship/candlymentorship.tsx` — Empty file (0 bytes)

### Build Configuration
- `typescript.ignoreBuildErrors: true` — Masks TypeScript errors
- `eslint.ignoreDuringBuilds: true` — Masks lint errors

### TypeScript Config
- Target is `es5` (unusually low for a Next.js 15 project)
- Has leftover path aliases (`@prisma/*`, `@utils/*`, `@middleware/*`) from pre-Next.js setup

---

## 13. Environment Variables

| Variable | Usage | Required |
|----------|-------|----------|
| `POSTGRES_URL_NON_POOLING` | Prisma datasource URL | Yes |
| `SUPABASE_JWT_SECRET` | NextAuth secret (middleware + auth config) | Yes |
| `NEXTAUTH_SECRET` | NextAuth (fallback, may not be explicitly used) | Recommended |
| `NEXTAUTH_URL` | NextAuth base URL | Required in production |

> **Note:** The secret is named `SUPABASE_JWT_SECRET` but is used purely as the NextAuth JWT secret. No Supabase SDK is present.

---

## 14. Deployment & Scripts

### npm Scripts
| Script | Command |
|--------|---------|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `next lint` |
| `postinstall` | `prisma generate` |
| `prisma:generate` | `prisma generate` |
| `prisma:migrate` | `prisma migrate dev` |
| `prisma:studio` | `prisma studio` |
| `prisma:seed` | `node prisma/seed.js` |

### Operational Scripts (`scripts/`)
| Script | Purpose |
|--------|---------|
| `enroll-existing-users.js` | Batch-enroll existing students in JS Tasks (365-day access) |
| `reset-user-balances.js` | Reset all user balances |
| `restore-users.js` | Restore deleted users |
| `run-enrollment.js` | Runner for enrollment script |

### Seed Data (`prisma/seed.js`)
Creates: 5 platforms (Algorithms, OOP, SOLID, JS Interview, JS Tasks) with 16-27 tasks each, admin user (`admin@codehub.com` / `admin123`), student user, sample transactions, recorded session, sample mentorship bookings.

### Deployment Targets
- Vercel (primary, based on `.vercel` in gitignore)
- Railway/Render compatible (standard Next.js)
- Requires PostgreSQL database

---

## 15. Suggested Next Steps (Priority Order)

### P0 — Critical Fixes
1. **Fix `recorded-sessions/route.ts` POST** — Replace `mentor.id` with `adminUser.id`, `transaction` with proper variable, use valid enum values (`RECORDED_SESSION` not `DEBIT`, `APPROVED` not `COMPLETED`)
2. **Fix signup balance logic** — Either set balance to 500.00 in user creation OR make the welcome transaction actually credit the balance
3. **Remove `ignoreBuildErrors`** — Fix TypeScript errors and enable build checks

### P1 — Dependency Cleanup
4. Remove unused packages: `express`, `express-validator`, `cors`, `jsonwebtoken`, `multer`, `pg`, `@next-auth/prisma-adapter`, `react-calendar`, `ts-node`, `ts-node-dev` and their `@types/*`
5. Remove dead files: `signup/_.ts`, empty `candlymentorship.tsx`

### P2 — Architecture Improvements
6. **Split admin page** — The 185KB monolithic admin page should be broken into separate components/tabs
7. **Split student page** — The 72KB student page could benefit from component extraction
8. **Add proper error boundaries** and loading states
9. **Implement proper API rate limiting**

### P3 — Feature Completions
10. Add email notifications for booking status changes
11. Implement proper enrollment renewal reminders
12. Add admin ability to bulk-manage enrollments
13. Add student submission history/resubmission flow
14. Implement proper file upload for submissions (currently text-only)

### P4 — Code Quality
15. Enable strict TypeScript checking
16. Add API integration tests
17. Standardize error response format across all endpoints
18. Add request logging/monitoring
19. Rename `SUPABASE_JWT_SECRET` to `NEXTAUTH_SECRET` for clarity
