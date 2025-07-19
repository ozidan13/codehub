# Phone Number Feature Implementation Plan

## Overview
This document outlines the steps to add phone number functionality to the student schema and signup process, making it the default wallet number for transactions.

## Current Project Analysis

### Database Schema (Prisma)
- **User Model**: Currently has email, name, password, role, balance, and other fields
- **Transaction Model**: Has `senderWalletNumber` and `adminWalletNumber` fields
- **No phone number field** in User model currently

### Frontend Components
- **Signup Page**: Has name, email, password, confirmPassword fields
- **Student Dashboard**: Has wallet section with top-up modal
- **Top-up Modal**: Currently asks for `senderWalletNumber` manually

### Backend APIs
- **Signup Route**: Creates user with email, name, password
- **Wallet Top-up Route**: Accepts `senderWalletNumber` from user input

## Implementation Steps

### Step 1: Update Prisma Schema ❌
**Status**: Not Started
**Files to modify**: 
- `prisma/schema.prisma`

**Changes needed**:
- Add `phoneNumber` field to User model
- Make it required and unique
- Create migration

**Validation**: 
- [ ] Schema updated correctly
- [ ] Migration generated
- [ ] No syntax errors

---

### Step 2: Update Signup Frontend ❌
**Status**: Not Started
**Files to modify**: 
- `src/app/(auth)/signup/page.tsx`

**Changes needed**:
- Add phone number field to form state
- Add phone number input field with validation
- Update form submission to include phone number
- Add Arabic labels and placeholders

**Validation**: 
- [ ] Phone number field added to form
- [ ] Validation works correctly
- [ ] UI matches existing design
- [ ] No TypeScript errors

---

### Step 3: Update Signup Backend API ❌
**Status**: Not Started
**Files to modify**: 
- `src/app/api/auth/signup/route.ts`

**Changes needed**:
- Add phone number to validation schema
- Include phone number in user creation
- Validate phone number format

**Validation**: 
- [ ] Phone number validation added
- [ ] User creation includes phone number
- [ ] Error handling works
- [ ] No runtime errors

---

### Step 4: Update Wallet Top-up Logic ❌
**Status**: Not Started
**Files to modify**: 
- `src/app/(dashboard)/student/page.tsx` (TopUpModal component)
- `src/app/api/wallet/topup/route.ts`

**Changes needed**:
- Pre-populate sender wallet number with user's phone number
- Display user's registered phone number in top-up modal
- Update API to use user's phone number as default
- Add message showing which number to send money from

**Validation**: 
- [ ] Phone number pre-populated in top-up modal
- [ ] Clear instructions displayed
- [ ] API uses correct phone number
- [ ] No errors in top-up process

---

### Step 5: Update Student Dashboard Display ❌
**Status**: Not Started
**Files to modify**: 
- `src/app/(dashboard)/student/page.tsx`

**Changes needed**:
- Show user's registered phone number in wallet section
- Update top-up instructions to reference registered number

**Validation**: 
- [ ] Phone number displayed correctly
- [ ] Instructions are clear
- [ ] UI looks good
- [ ] No display errors

---

### Step 6: Update Admin Dashboard (if needed) ❌
**Status**: Not Started
**Files to modify**: 
- `src/app/(dashboard)/admin/page.tsx`

**Changes needed**:
- Display phone numbers in user listings
- Show phone numbers in transaction reviews

**Validation**: 
- [ ] Phone numbers visible in admin panel
- [ ] Transaction reviews show phone numbers
- [ ] No admin functionality broken

---

### Step 7: Update Type Definitions ❌
**Status**: Not Started
**Files to modify**: 
- `src/types/index.ts` (if exists)

**Changes needed**:
- Add phone number to User type definitions
- Update any interfaces that need phone number

**Validation**: 
- [ ] Type definitions updated
- [ ] No TypeScript errors
- [ ] All components compile correctly

---

### Step 8: Update Seed Data ❌
**Status**: Not Started
**Files to modify**: 
- `prisma/seed.js`

**Changes needed**:
- Add phone numbers to sample users
- Update sample transactions to use phone numbers

**Validation**: 
- [ ] Seed data includes phone numbers
- [ ] Seed runs without errors
- [ ] Sample data reflects final vision

---

### Step 9: Run Database Migration ❌
**Status**: Not Started

**Commands to run**:
```bash
npx prisma migrate dev --name add_phone_number_to_user
npx prisma generate
npm run seed
```

**Validation**: 
- [ ] Migration runs successfully
- [ ] Database schema updated
- [ ] Seed data populated correctly

---

### Step 10: Final Testing ❌
**Status**: Not Started

**Test scenarios**:
1. New user signup with phone number
2. Login and check wallet section
3. Attempt wallet top-up
4. Admin review of transactions
5. Check all existing functionality still works

**Validation**: 
- [ ] Signup flow works end-to-end
- [ ] Wallet top-up shows correct phone number
- [ ] Admin can see phone numbers
- [ ] No existing functionality broken
- [ ] All error cases handled properly

---

## Notes
- After each step, code will be reviewed for errors before proceeding
- Any issues found will be fixed immediately
- This document will be updated with completion status
- Phone number format should follow Egyptian mobile number standards
- All Arabic text should be properly displayed

## Final Vision
- Users sign up with phone number as required field
- Phone number becomes their default wallet number
- During top-up, system shows "Send money from your registered number: [phone]"
- Admin can see phone numbers in transaction reviews
- Seamless integration with existing wallet system