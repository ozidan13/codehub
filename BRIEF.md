# 🎓 Learning Tracker Platform — Full-Stack Web App

A full-stack learning management and progress tracking system built using **Next.js**, **Express.js**, **Prisma ORM**, **PostgreSQL**, and **Tailwind CSS**. The platform unifies five separate learning areas into one place, allowing students to submit task summaries, track their learning progress, and receive detailed feedback from admins.

---

## 🚀 Features Overview

### 👩‍🎓 Student Features
- Secure authentication and role-based access
- Dashboard to track learning progress and task completion
- Five platforms in tabbed navigation:
  - Algorithms & Data Structures
  - OOP (Object-Oriented Programming)
  - SOLID Principles & Design Patterns
  - JavaScript Interview Prep
  - JavaScript Practice Tasks
- Each platform shows task cards with:
  - Task title
  - "Complete" button → textarea → submission form
  - Status updates: `Pending`, `Completed`, or `Rejected`
  - Resubmission allowed if rejected

### 🧑‍🏫 Admin Features
- View all registered students
- Access each student's task submissions
- Review submitted summaries and:
  - Mark as **Completed** with a score (0–10) + feedback
  - Mark as **Rejected** with feedback only (no score)
- Filter tasks by status
- Track each student's overall progress and engagement

---

## 🧱 Tech Stack

| Layer        | Technology               |
|--------------|---------------------------|
| Frontend     | Next.js (App Router)      |
| Backend API  | Express.js (inside `/api`)|
| Database     | PostgreSQL                |
| ORM          | Prisma                    |
| Styling      | Tailwind CSS              |
| Auth         | NextAuth.js or custom JWT |
| Deployment   | Vercel / Railway / Render |

---

## 📚 Learning Platforms (Linked Content)

1. **Algorithms & Data Structures**  
   [https://ozidan13.github.io/algorithms/](https://ozidan13.github.io/algorithms/)

2. **Object-Oriented Programming (OOP)**  
   [https://oop-pi.vercel.app/](https://oop-pi.vercel.app/)

3. **SOLID & Design Patterns**  
   [https://ozidan13.github.io/SOLID-Principles-Design-Patterns/](https://ozidan13.github.io/SOLID-Principles-Design-Patterns/)

4. **JavaScript Interview Questions**  
   [https://javascriptinterview-kappa.vercel.app/](https://javascriptinterview-kappa.vercel.app/)

5. **JavaScript Tasks**  
   [https://ozidan13.github.io/js-tasks/](https://ozidan13.github.io/js-tasks/)

---

## 🧠 Submission Flow

```mermaid
flowchart TD
    Student["Student Opens Task"] --> Complete["Click 'Complete'"]
    Complete --> Summary["Writes Summary in Textarea"]
    Summary --> Submit["Clicks Submit"]
    Submit --> Pending["Task Becomes Pending"]
    Pending -->|Admin Review| Completed["Marked Completed + Score"]
    Pending -->|Admin Review| Rejected["Marked Rejected + Feedback"]
    Rejected --> Resubmission["Student Resubmits"]
    Resubmission --> Pending
