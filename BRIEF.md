# 🎓 CodeHub - Programming Learning Tracking Platform

A comprehensive learning management and progress tracking platform built using **Next.js 15**, **NextAuth.js**, **Prisma ORM**, **PostgreSQL**, and **Tailwind CSS**. The platform brings together five separate educational domains in one place, allowing students to submit task summaries, track their learning progress, and receive detailed feedback from supervisors.

---

## 🚀 Features Overview

### 👩‍🎓 Student Features
- Secure authentication and role-based access
- Dashboard for tracking learning progress and task completion
- Five learning platforms:
  - Algorithms and Data Structures
  - Object-Oriented Programming (OOP)
  - SOLID Principles and Design Patterns
  - JavaScript Interview Preparation
  - Practical JavaScript Tasks
- Each platform displays task cards with:
  - Task title and description
  - "Complete" button → summary submission form
  - Status updates: `Pending`, `Approved`, or `Rejected`
  - Ability to resubmit in case of rejection

### 🧑‍🏫 Supervisor Features
- View all registered students with their statistics
- Access to each student's submissions
- Review submitted summaries and:
  - Mark as **Approved** with grade (0-100) + feedback
  - Mark as **Rejected** with feedback only (no grade)
- Filter tasks by status and platform
- Track overall progress for each student and their participation
- Manage platforms and tasks (create, update, delete)

---

## 🧱 Tech Stack

| Layer | Technology |
|---------|----------|
| Frontend | Next.js 15 (App Router) |
| API | Next.js API Routes |
| Database | PostgreSQL |
| ORM | Prisma |
| Styling | Tailwind CSS |
| Authentication | NextAuth.js |
| Icons | Lucide React |
| Data Validation | Zod |
| Deployment | Vercel / Railway / Render |

---

## 📊 Database Schema

### Users Table
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  password      String
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  submissions   Submission[]
  accounts      Account[]
  sessions      Session[]
}

enum Role {
  USER
  ADMIN
}
```

### Platforms Table
```prisma
model Platform {
  id          String   @id @default(cuid())
  name        String
  description String
  url         String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tasks       Task[]
}
```

### Tasks Table
```prisma
model Task {
  id          String   @id @default(cuid())
  title       String
  description String
  url         String
  platformId  String
  platform    Platform @relation(fields: [platformId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  submissions Submission[]
}
```

### Submissions Table
```prisma
model Submission {
  id        String           @id @default(cuid())
  summary   String
  status    SubmissionStatus @default(PENDING)
  score     Int?
  feedback  String?
  userId    String
  taskId    String
  user      User             @relation(fields: [userId], references: [id])
  task      Task             @relation(fields: [taskId], references: [id])
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
}

enum SubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}
```

---

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Get user session

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/[id]` - Get specific user
- `PUT /api/users/[id]` - Update user data
- `DELETE /api/users/[id]` - Delete user (admin only)

### Platforms
- `GET /api/platforms` - Get all platforms
- `POST /api/platforms` - Create new platform (admin only)
- `PUT /api/platforms/[id]` - Update platform (admin only)
- `DELETE /api/platforms/[id]` - Delete platform (admin only)

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/[id]` - Get specific task
- `POST /api/tasks` - Create new task (admin only)
- `PUT /api/tasks/[id]` - Update task (admin only)
- `DELETE /api/tasks/[id]` - Delete task (admin only)

### Submissions
- `GET /api/submissions` - Get all submissions
- `GET /api/submissions/[id]` - Get specific submission
- `POST /api/submissions` - Create new submission
- `PUT /api/submissions/[id]` - Update submission (for review)
- `DELETE /api/submissions/[id]` - Delete submission

### Dashboard
- `GET /api/dashboard` - Dashboard statistics
- `GET /api/dashboard/stats` - Detailed statistics

---

## 📚 Linked Learning Platforms

1. **Algorithms and Data Structures**  
   [https://ozidan13.github.io/algorithms/](https://ozidan13.github.io/algorithms/)

2. **Object-Oriented Programming (OOP)**  
   [https://oop-pi.vercel.app/](https://oop-pi.vercel.app/)

3. **SOLID Principles and Design Patterns**  
   [https://ozidan13.github.io/SOLID-Principles-Design-Patterns/](https://ozidan13.github.io/SOLID-Principles-Design-Patterns/)

4. **JavaScript Interview Questions**  
   [https://javascriptinterview-kappa.vercel.app/](https://javascriptinterview-kappa.vercel.app/)

5. **JavaScript Tasks**  
   [https://ozidan13.github.io/js-tasks/](https://ozidan13.github.io/js-tasks/)

---

## 🧠 Submission Flow

```mermaid
flowchart TD
    Student["Student opens task"] --> Complete["Clicks 'Complete'"]
    Complete --> Summary["Writes summary"]
    Summary --> Submit["Clicks submit"]
    Submit --> Pending["Task becomes pending"]
    Pending -->|Supervisor review| Completed["Marked as approved + grade"]
    Pending -->|Supervisor review| Rejected["Marked as rejected + feedback"]
    Rejected --> Resubmission["Student resubmits"]
    Resubmission --> Pending
```

---

## 🚀 Installation and Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL
- npm or yarn

### Installation Steps

1. **Clone the project**
```bash
git clone <repository-url>
cd codehub
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```
Update the `.env` file with appropriate values:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/codehub"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Setup database**
```bash
npx prisma migrate dev
npx prisma db seed
```

5. **Run the project**
```bash
npm run dev
```

The project will run on: `http://localhost:3000`

### Useful Commands
```bash
npm run build          # Build project for production
npm run start          # Run project in production mode
npm run lint           # Code linting
npx prisma studio      # Open database management interface
npx prisma db seed     # Re-seed database
```

---

## 📁 Project Structure

```
codehub/
├── src/
│   ├── app/
│   │   ├── api/           # API Routes
│   │   ├── dashboard/     # Student dashboard
│   │   ├── admin/         # Admin dashboard
│   │   ├── login/         # Login page
│   │   ├── signup/        # Signup page
│   │   └── layout.tsx     # Root layout
│   ├── components/        # Shared components
│   ├── lib/              # Libraries and utilities
│   └── middleware.ts     # Authentication middleware
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.js          # Initial data
├── public/              # Public files
└── package.json         # Project dependencies
```
