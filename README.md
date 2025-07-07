# 🎓 CodeHub - Learning Tracker Platform

A comprehensive full-stack learning management system built with Next.js, Prisma, PostgreSQL, and Tailwind CSS. Track your progress across five programming platforms with task submissions, feedback, and detailed analytics.

## 🚀 Features

### 👩‍🎓 Student Features
- **Secure Authentication**: Role-based access with NextAuth.js
- **Progress Dashboard**: Track learning progress and task completion
- **Five Learning Platforms**:
  - Algorithms & Data Structures
  - Object-Oriented Programming (OOP)
  - SOLID Principles & Design Patterns
  - JavaScript Interview Prep
  - JavaScript Practice Tasks
- **Task Management**: Submit summaries, track status (Pending/Completed/Rejected)
- **File Uploads**: Attach files to submissions via Supabase
- **Resubmission**: Allowed for rejected tasks

### 🧑‍🏫 Admin Features
- **Student Management**: View all registered students
- **Submission Review**: Review and grade task submissions
- **Scoring System**: Assign scores (0-100) with detailed feedback
- **Status Management**: Approve or reject submissions
- **Analytics Dashboard**: Track platform-wise statistics

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router) |
| Backend | Next.js API Routes |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | NextAuth.js |
| File Storage | Supabase |
| Styling | Tailwind CSS |
| TypeScript | Full type safety |

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Supabase account (for file uploads)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd codeapp
npm install
```

### 2. Environment Setup

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the following variables:

```env
# Database (Supabase PostgreSQL)
POSTGRES_URL="your-postgres-url"
POSTGRES_PRISMA_URL="your-postgres-prisma-url"
POSTGRES_URL_NON_POOLING="your-postgres-non-pooling-url"
POSTGRES_USER="postgres"
POSTGRES_HOST="your-supabase-host"
POSTGRES_PASSWORD="your-password"
POSTGRES_DATABASE="postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_JWT_SECRET="your-jwt-secret-key"
SUPABASE_URL="your-supabase-url"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database with sample data
node prisma/seed.js
```

### 4. Supabase Storage Setup

1. Create a bucket named `learning-tracker-files` in your Supabase project
2. Set the bucket to public access for file downloads
3. Configure RLS policies as needed

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 👥 Default Users

After seeding, you can log in with:

**Admin Account:**
- Email: `admin@codehub.com`
- Password: `admin123`

**Student Account:**
- Email: `student@codehub.com`
- Password: `student123`

## 📚 Learning Platforms

The platform integrates with five external learning resources:

1. **Algorithms & Data Structures** - [View Platform](https://ozidan13.github.io/algorithms/)
2. **Object-Oriented Programming** - [View Platform](https://oop-pi.vercel.app/)
3. **SOLID & Design Patterns** - [View Platform](https://ozidan13.github.io/SOLID-Principles-Design-Patterns/)
4. **JavaScript Interview Questions** - [View Platform](https://javascriptinterview-kappa.vercel.app/)
5. **JavaScript Tasks** - [View Platform](https://ozidan13.github.io/js-tasks/)

## 🔄 Submission Workflow

```mermaid
flowchart TD
    A[Student Opens Task] --> B[Click 'Complete']
    B --> C[Write Summary]
    C --> D[Upload File (Optional)]
    D --> E[Submit]
    E --> F[Status: Pending]
    F --> G{Admin Review}
    G -->|Approve| H[Status: Completed + Score]
    G -->|Reject| I[Status: Rejected + Feedback]
    I --> J[Student Resubmits]
    J --> F
```

## 🗂️ Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── admin/         # Admin dashboard
│   ├── dashboard/     # Student dashboard
│   ├── login/         # Authentication
│   └── signup/        # User registration
├── lib/
│   ├── auth.ts        # NextAuth configuration
│   ├── prisma.ts      # Database client
│   └── supabase.ts    # File storage client
├── types/
│   └── next-auth.d.ts # Type definitions
└── middleware.ts      # Route protection
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login

### Platforms & Tasks
- `GET /api/platforms` - Get all platforms with tasks
- `GET /api/tasks` - Get tasks (with optional platform filter)
- `POST /api/tasks` - Create new task (Admin only)

### Submissions
- `GET /api/submissions` - Get submissions
- `POST /api/submissions` - Create submission
- `GET /api/submissions/[id]` - Get specific submission
- `PATCH /api/submissions/[id]` - Update submission (Admin only)
- `DELETE /api/submissions/[id]` - Delete submission (Admin only)

### Users & Dashboard
- `GET /api/users` - Get all users (Admin only)
- `GET /api/dashboard` - Get dashboard statistics

## 🧪 Testing

Use the included Postman collection (`CodeHub_API_Collection.postman_collection.json`) to test all API endpoints.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment

```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the [Issues](../../issues) page
2. Review the API documentation in the Postman collection
3. Ensure all environment variables are properly configured

---

**Happy Learning! 🎓**