# CodeHub Monetization Feature - Student Wallet & Mentorship System

This document outlines the implementation of a **student wallet system** and **mentorship booking** to monetize the CodeHub learning management system.

## 📊 Database Schema Changes

### User Model Extensions
```prisma
model User {
  // ... existing fields
  balance           Decimal           @default(500.00) @db.Decimal(10,2)
  isMentor          Boolean           @default(false) // For future mentor expansion
  mentorBio         String?           @db.Text // Optional mentor bio
  mentorRate        Decimal?          @db.Decimal(8,2) // Hourly rate for mentors
  
  // New Relations
  enrollments       Enrollment[]
  transactions      Transaction[]
  studentBookings   MentorshipBooking[] @relation("StudentBookings")
  mentorBookings    MentorshipBooking[] @relation("MentorBookings")
}
```

### New Models
```prisma
model Platform {
  // ... existing fields
  price             Decimal?          @db.Decimal(8,2) // Platform enrollment price
  isActive          Boolean           @default(true)
  
  // New Relations
  enrollments       Enrollment[]
}

model Enrollment {
  id                String            @id @default(cuid())
  userId            String
  platformId        String
  enrolledAt        DateTime          @default(now())
  expiresAt         DateTime?         // Optional expiration
  isActive          Boolean           @default(true)
  
  user              User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  platform          Platform          @relation(fields: [platformId], references: [id], onDelete: Cascade)
  
  @@unique([userId, platformId])
  @@map("enrollments")
}

model Transaction {
  id                String            @id @default(cuid())
  userId            String
  type              TransactionType
  amount            Decimal           @db.Decimal(10,2)
  description       String
  status            TransactionStatus @default(PENDING)
  walletNumber      String?           // For top-up requests
  adminId           String?           // Admin who processed
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  user              User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("transactions")
}

model MentorshipBooking {
  id                String            @id @default(cuid())
  studentId         String
  mentorId          String            // References User.id where isMentor = true
  sessionDate       DateTime?         // Set by admin after confirmation
  duration          Int               @default(60) // Duration in minutes
  totalCost         Decimal           @db.Decimal(8,2)
  status            BookingStatus     @default(PENDING)
  studentNotes      String?           @db.Text // Notes from student when booking
  adminNotes        String?           @db.Text // Admin notes for session details
  feedback          String?           @db.Text // Post-session feedback
  rating            Int?              // 1-5 stars
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  student           User              @relation("StudentBookings", fields: [studentId], references: [id], onDelete: Cascade)
  mentor            User              @relation("MentorBookings", fields: [mentorId], references: [id], onDelete: Cascade)
  
  @@index([studentId])
  @@index([mentorId])
  @@map("mentorship_bookings")
}

enum TransactionType {
  TOP_UP
  PLATFORM_PURCHASE
  MENTORSHIP_PAYMENT
}

enum TransactionStatus {
  PENDING
  APPROVED
  REJECTED
}

enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}
```

## 👨‍🎓 Student Features

### 💰 Wallet System
- **Initial Balance**: 500 EGP credited upon registration
- **Balance Tracking**: Real-time balance updates
- **Transaction History**: Complete log of all financial activities
- **Top-up Requests**: Submit requests with wallet details for admin approval

### 📚 Platform Enrollment
- **Browse Platforms**: View available platforms with pricing
- **Purchase Access**: Enroll in platforms using wallet balance
- **Access Control**: Only enrolled students can access platform tasks
- **Enrollment History**: Track all platform purchases

### 👨‍🏫 Mentorship Booking
- **Browse Mentors**: View available mentors with expertise and rates
- **Book Sessions**: Schedule mentorship sessions
- **Session Management**: View upcoming and past sessions
- **Feedback System**: Rate and review mentors after sessions

---

### 🔁 User Flow

1. **On Registration**
   - Student automatically receives **500 EGP** in their balance.
   - They can use this to:
     - Enroll in platforms (if platform price ≤ balance)
     - Access related tasks/content after enrollment
     - Book mentorship sessions

2. **Adding Balance**
   - Student opens an **"Add Balance"** tab
   - Sees a **wallet number** to send money to (e.g., Vodafone Cash)
   - Fills out a form with:
     - **Amount** they sent
     - **Wallet number** they sent it *from*
   - ✅ No file uploads required — just the number and amount

---

## 🛠️ Admin Features

### 💼 Financial Management
- **Top-up Request Management**: Review and process student balance requests
- **Transaction Monitoring**: View all financial transactions across the platform
- **Revenue Analytics**: Track platform earnings and user spending patterns

### 👨‍🏫 Mentorship Administration
- **Booking Management**: Review and confirm mentorship booking requests
- **Session Scheduling**: Set session dates and times after booking confirmation
- **Session Notes**: Add administrative notes and session details
- **Pricing Management**: Set mentorship rates (admin's hourly rate)
- **Future Mentor Management**: Add and manage additional mentors when needed

### 📊 Platform Management
- **Platform Pricing**: Set and update platform enrollment fees
- **Access Control**: Manage platform availability and student access
- **Enrollment Analytics**: Track platform popularity and revenue

---

## 🔌 API Endpoints

### Wallet & Transactions
```typescript
// Get user balance and transaction history
GET /api/wallet/balance
GET /api/wallet/transactions?page=1&limit=10

// Submit top-up request
POST /api/wallet/topup
{
  amount: number,
  walletNumber: string,
  description?: string
}

// Admin: Process top-up requests
GET /api/admin/topup-requests
PUT /api/admin/topup-requests/:id
{
  status: 'APPROVED' | 'REJECTED',
  adminNotes?: string
}
```

### Platform Enrollment
```typescript
// Get available platforms with pricing
GET /api/platforms?includePrice=true

// Enroll in platform
POST /api/enrollments
{
  platformId: string
}

// Get user enrollments
GET /api/enrollments/my

// Check enrollment status
GET /api/enrollments/check/:platformId
```

### Mentorship System
```typescript
// Get mentorship pricing and availability
GET /api/mentorship/info

// Book mentorship session (payment deducted immediately)
POST /api/mentorship/book
{
  duration: number, // Duration in minutes
  studentNotes?: string // Optional notes from student
}

// Get user's mentorship bookings
GET /api/mentorship/my-bookings

// Submit session feedback (after session completion)
POST /api/mentorship/feedback/:bookingId
{
  rating: number,
  feedback: string
}

// Admin: Confirm booking and set session details
PUT /api/admin/mentorship/:bookingId/confirm
{
  sessionDate: string,
  adminNotes?: string
}

// Admin: Manage mentorship settings
PUT /api/admin/mentorship/settings
{
  hourlyRate: number,
  isAvailable: boolean
}
```

### Admin Analytics
```typescript
// Financial overview
GET /api/admin/analytics/financial

// User engagement metrics
GET /api/admin/analytics/engagement

// Platform performance
GET /api/admin/analytics/platforms
```

---

## 🎨 UI Components & Pages

### Student Dashboard Additions
- **Wallet Widget**: Display current balance with quick top-up button
- **Enrolled Platforms**: Grid view of purchased platforms
- **Mentorship Hub**: Book sessions and view booking history
- **Transaction History**: Detailed financial activity log

### New Pages
```
/dashboard/wallet          - Wallet management and top-up
/dashboard/enrollments     - Platform enrollment management
/dashboard/mentorship      - Mentorship booking and history
/mentorship/book          - Mentorship booking form
/admin/financial          - Financial management dashboard
/admin/mentorship         - Mentorship booking management
/admin/analytics          - Revenue and engagement analytics
```

### Key UI Features
- **Balance Indicator**: Always visible wallet balance in header
- **Enrollment Gates**: Lock platform content behind enrollment
- **Mentorship Booking**: Simple booking form with duration and notes
- **Session Status**: Clear status indicators for pending/confirmed sessions
- **Transaction Receipts**: Detailed transaction confirmations

---

## 🚀 Implementation Phases

### Phase 1: Core Wallet System (Week 1-2)
1. **Database Migration**: Add wallet-related fields to User model
2. **Transaction System**: Implement Transaction model and basic CRUD
3. **Balance Management**: Create wallet service with balance tracking
4. **Top-up Requests**: Build request submission and admin approval flow
5. **Basic UI**: Wallet dashboard and transaction history

### Phase 2: Platform Monetization (Week 3-4)
1. **Platform Pricing**: Add pricing fields to Platform model
2. **Enrollment System**: Implement Enrollment model and purchase flow
3. **Access Control**: Restrict task access to enrolled users
4. **Admin Tools**: Platform pricing management interface
5. **Purchase UI**: Platform marketplace and enrollment flow

### Phase 3: Mentorship System (Week 5-6)
1. **User Model Updates**: Add mentor fields to User model (isMentor, mentorBio, mentorRate)
2. **Booking System**: Create MentorshipBooking model with admin confirmation flow
3. **Payment Integration**: Implement immediate payment deduction on booking
4. **Admin Confirmation**: Build admin interface to confirm bookings and set session details
5. **Session Management**: Build session lifecycle and status tracking
6. **Rating System**: Implement post-session feedback and rating system
7. **Student UI**: Simple mentorship booking interface

### Phase 4: Admin & Analytics (Week 8)
1. **Admin Dashboard**: Comprehensive financial and user management
2. **Analytics**: Revenue tracking and user engagement metrics
3. **Reporting**: Generate financial and performance reports
4. **Security**: Implement proper authorization and audit logging

---

## 🔒 Security Considerations

- **Transaction Integrity**: Implement atomic operations for balance updates
- **Authorization**: Strict role-based access control for financial operations
- **Audit Logging**: Complete transaction and admin action logging
- **Rate Limiting**: Prevent abuse of top-up and booking systems
- **Data Validation**: Comprehensive input validation for financial data
- **Encryption**: Secure storage of sensitive financial information

---

## 📈 Success Metrics

- **Revenue Growth**: Monthly recurring revenue from platform enrollments
- **User Engagement**: Platform completion rates and session bookings
- **Mentor Utilization**: Average mentor booking rates and satisfaction
- **Wallet Adoption**: Percentage of users actively using wallet features
- **Customer Lifetime Value**: Average revenue per user over time


