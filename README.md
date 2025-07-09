# 🎓 CodeHub - Learning Management Platform

A comprehensive full-stack learning management system built with Next.js, Prisma, PostgreSQL, and Tailwind CSS. Track your progress across five programming platforms with task submissions, feedback, and detailed analytics.

## 🚀 Features

### 👩‍🎓 Student Features
- **Secure Authentication**: Role-based authentication system using NextAuth.js
- **Progress Dashboard**: Track learning progress and task completion
- **Five Learning Platforms**:
  - Algorithms & Data Structures
  - Object-Oriented Programming (OOP)
  - SOLID Principles & Design Patterns
  - JavaScript Interview Questions
  - JavaScript Practice Tasks
- **Task Management**: Submit task summaries and track status (pending/completed/rejected)
- **Summary Submission**: Write educational summaries for completed tasks
- **Resubmission**: Allowed for rejected tasks

### 🧑‍🏫 Admin Features
- **Student Management**: View all registered students
- **Submission Review**: Review and evaluate task submissions
- **Grading System**: Assign grades (0-100) with detailed feedback
- **Status Management**: Approve or reject submissions
- **Analytics Dashboard**: Track statistics by platform

## 🛠️ Tech Stack

| Layer | Technology |
|-------|----------|
| Frontend | Next.js 15 (App Router) |
| Backend | Next.js API Routes |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | NextAuth.js (Credentials Provider) |
| Styling | Tailwind CSS + Lucide React Icons |
| Validation | Zod |
| TypeScript | Full type safety |
| UI Direction | RTL (Right-to-Left) Support |

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Basic knowledge of Next.js and React
- Text editor (VS Code recommended)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd codehub
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the project root:

```env
# Database URL
DATABASE_URL="postgresql://username:password@localhost:5432/codehub"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Optional: For production
# NEXTAUTH_URL="https://your-domain.com"
```

**Note**: Make sure to create a PostgreSQL database named `codehub` or use another name and update the `DATABASE_URL` accordingly.

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Apply database schema
npx prisma db push

# Seed database with sample data
npm run seed
# or
node prisma/seed.js
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 👥 Default Users

After seeding the database, you can login using:

**Admin Account:**
- Email: `admin@codehub.com`
- Password: `admin123`

**Student Account:**
- Email: `student@codehub.com`
- Password: `student123`

**Or you can create a new account from the signup page**

## 📚 Learning Platforms

The platform integrates with five external educational resources:

1. **Algorithms & Data Structures** - [View Platform](https://ozidan13.github.io/algorithms/)
2. **Object-Oriented Programming** - [View Platform](https://oop-pi.vercel.app/)
3. **SOLID Principles & Design Patterns** - [View Platform](https://ozidan13.github.io/SOLID-Principles-Design-Patterns/)
4. **JavaScript Interview Questions** - [View Platform](https://javascriptinterview-kappa.vercel.app/)
5. **JavaScript Practice Tasks** - [View Platform](https://ozidan13.github.io/js-tasks/)

## 🔄 Submission Workflow

```mermaid
flowchart TD
    A[Student opens task] --> B[Click 'Complete']
    B --> C[Write summary]
    C --> D[Submit summary]
    D --> E[Status: Pending]
    E --> F{Teacher review}
    F -->|Approve| G[Status: Completed + Grade]
    F -->|Reject| H[Status: Rejected + Feedback]
    H --> I[Student resubmits]
    I --> E
```

## 🗂️ Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   │   ├── auth/      # User authentication
│   │   ├── dashboard/ # Dashboard statistics
│   │   ├── platforms/ # Platform management
│   │   ├── submissions/ # Submission management
│   │   ├── tasks/     # Task management
│   │   └── users/     # User management
│   ├── admin/         # Admin dashboard
│   ├── dashboard/     # Student dashboard
│   ├── login/         # Login page
│   ├── signup/        # Signup page
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Home page
│   └── providers.tsx  # Context providers
├── lib/
│   ├── auth.ts        # NextAuth configuration
│   └── prisma.ts      # Database client
├── types/
│   └── next-auth.d.ts # Type definitions
├── middleware.ts      # Route protection
prisma/
├── schema.prisma      # Database schema
└── seed.js           # Sample data
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Get current user session

### Platforms & Tasks
- `GET /api/platforms` - Get all platforms
- `POST /api/platforms` - Create new platform (admin only)
- `PUT /api/platforms/[id]` - Update platform (admin only)
- `DELETE /api/platforms/[id]` - Delete platform (admin only)
- `GET /api/tasks` - Get tasks
- `GET /api/tasks/[id]` - Get specific task
- `POST /api/tasks` - Create new task (admin only)
- `PUT /api/tasks/[id]` - Update task (admin only)
- `DELETE /api/tasks/[id]` - Delete task (admin only)

### Submissions
- `GET /api/submissions` - Get submissions
- `POST /api/submissions` - Create new submission
- `GET /api/submissions/[id]` - Get specific submission
- `PUT /api/submissions/[id]` - Update submission (review)
- `DELETE /api/submissions/[id]` - Delete submission

### Users & Dashboard
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/[id]` - Get specific user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user (admin only)
- `GET /api/dashboard` - Get dashboard statistics
- `GET /api/dashboard/stats` - Get detailed statistics

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