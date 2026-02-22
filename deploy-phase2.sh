#!/bin/bash
# ══════════════════════════════════════════════════════════════
# PHC MSDS - MASTER DEPLOYMENT SCRIPT
# Phase 2: Paywall, Consultants, Training, Account Approvals
# ══════════════════════════════════════════════════════════════
# Run: bash /var/www/phc/deploy-phase2.sh
# This script:
#   1. Migrates the database (new tables + updated enums)
#   2. Updates Prisma schema
#   3. Creates all new pages, API routes, components
#   4. Rebuilds and restarts the app
# ══════════════════════════════════════════════════════════════

set -e
cd /var/www/phc

echo "═══════════════════════════════════════"
echo "PHC MSDS Phase 2 Deployment"
echo "═══════════════════════════════════════"

# ─────────────────────────────────────
# STEP 1: DATABASE MIGRATION
# ─────────────────────────────────────
echo ""
echo "▶ Step 1: Database Migration..."

psql "postgresql://phc_admin:PhcMsds2026Secure@localhost:5432/phc_db" <<'EOSQL'

-- 1A. Add new enum values to FacilityCategory
ALTER TYPE "FacilityCategory" ADD VALUE IF NOT EXISTS 'DIALYSIS';
ALTER TYPE "FacilityCategory" ADD VALUE IF NOT EXISTS 'PSYCHIATRIC';
ALTER TYPE "FacilityCategory" ADD VALUE IF NOT EXISTS 'IVF_FERTILITY';
ALTER TYPE "FacilityCategory" ADD VALUE IF NOT EXISTS 'COLLECTION_CENTER';
ALTER TYPE "FacilityCategory" ADD VALUE IF NOT EXISTS 'HOMEOPATHIC';
ALTER TYPE "FacilityCategory" ADD VALUE IF NOT EXISTS 'RADIOLOGICAL';
ALTER TYPE "FacilityCategory" ADD VALUE IF NOT EXISTS 'BHU';

-- 1B. Add new UserRole: CONSULTANT
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CONSULTANT';

-- 1C. New enum: ApprovalStatus
DO $$ BEGIN
  CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1D. New enum: PaymentStatus
DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1E. New enum: PaymentType
DO $$ BEGIN
  CREATE TYPE "PaymentType" AS ENUM ('FACILITY_REGISTRATION', 'ANNUAL_SUBSCRIPTION', 'TRAINING_FEE', 'CONSULTANT_FEE', 'PENALTY', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1F. New enum: SubscriptionStatus
DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1G. New enum: TrainingStatus
DO $$ BEGIN
  CREATE TYPE "TrainingStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Add new columns to User ──
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approvalStatus" "ApprovalStatus" DEFAULT 'PENDING';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "specialization" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "experience" INT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;

-- Set existing users to APPROVED
UPDATE "User" SET "approvalStatus" = 'APPROVED' WHERE "approvalStatus" = 'PENDING' AND role = 'REGX';

-- ── Add new columns to Facility ──
ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "approvalStatus" "ApprovalStatus" DEFAULT 'PENDING';
ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP;
ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "msdsCategory" TEXT;
ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;

-- ── Payment table ──
CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'PKR',
  "type" "PaymentType" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "method" TEXT,
  "transactionId" TEXT,
  "receiptUrl" TEXT,
  "description" TEXT,
  "metadata" JSONB,
  "facilityId" TEXT,
  "userId" TEXT NOT NULL,
  "paidAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Payment_facilityId_idx" ON "Payment"("facilityId");
CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "Payment_type_idx" ON "Payment"("type");

-- ── Subscription table ──
CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "plan" TEXT NOT NULL DEFAULT 'standard',
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
  "startDate" TIMESTAMP NOT NULL DEFAULT now(),
  "endDate" TIMESTAMP NOT NULL,
  "trialEndsAt" TIMESTAMP,
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "autoRenew" BOOLEAN NOT NULL DEFAULT false,
  "facilityId" TEXT NOT NULL,
  "paymentId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Subscription_facilityId_idx" ON "Subscription"("facilityId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_facilityId_key" ON "Subscription"("facilityId");

-- ── Training table ──
CREATE TABLE IF NOT EXISTS "Training" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" "FacilityCategory",
  "scheduledAt" TIMESTAMP NOT NULL,
  "duration" INT NOT NULL DEFAULT 60,
  "location" TEXT,
  "isOnline" BOOLEAN NOT NULL DEFAULT false,
  "meetingUrl" TEXT,
  "maxParticipants" INT DEFAULT 50,
  "fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "TrainingStatus" NOT NULL DEFAULT 'UPCOMING',
  "conductedBy" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Training_status_idx" ON "Training"("status");
CREATE INDEX IF NOT EXISTS "Training_scheduledAt_idx" ON "Training"("scheduledAt");

-- ── TrainingEnrollment (join table) ──
CREATE TABLE IF NOT EXISTS "TrainingEnrollment" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "trainingId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "facilityId" TEXT,
  "paymentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'enrolled',
  "completedAt" TIMESTAMP,
  "certificateUrl" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "TrainingEnrollment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TrainingEnrollment_trainingId_idx" ON "TrainingEnrollment"("trainingId");
CREATE INDEX IF NOT EXISTS "TrainingEnrollment_userId_idx" ON "TrainingEnrollment"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "TrainingEnrollment_unique" ON "TrainingEnrollment"("trainingId", "userId");

-- ── ConsultantAssignment ──
CREATE TABLE IF NOT EXISTS "ConsultantAssignment" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "consultantId" TEXT NOT NULL,
  "facilityId" TEXT NOT NULL,
  "assignedBy" TEXT NOT NULL,
  "startDate" TIMESTAMP NOT NULL DEFAULT now(),
  "endDate" TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'active',
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "ConsultantAssignment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ConsultantAssignment_consultantId_idx" ON "ConsultantAssignment"("consultantId");
CREATE INDEX IF NOT EXISTS "ConsultantAssignment_facilityId_idx" ON "ConsultantAssignment"("facilityId");

-- ── Notification table ──
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'info',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "link" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");

-- ── Foreign Keys (add only if not exist) ──
DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ConsultantAssignment" ADD CONSTRAINT "ConsultantAssignment_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ConsultantAssignment" ADD CONSTRAINT "ConsultantAssignment_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Verify
SELECT 'Tables:' as info, count(*) FROM information_schema.tables WHERE table_schema = 'public';
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

EOSQL

echo "✓ Database migration complete"

# ─────────────────────────────────────
# STEP 2: UPDATE PRISMA SCHEMA
# ─────────────────────────────────────
echo ""
echo "▶ Step 2: Updating Prisma schema..."

cat > prisma/schema.prisma << 'PRISMA'
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
}

enum UserRole {
  REGX
  ADMIN
  MSDS_FOCAL
  CONSULTANT
}

enum FacilityCategory {
  HOSPITAL_CAT_1
  HOSPITAL_CAT_2
  HOSPITAL_CAT_3
  DENTAL_CARE
  FAMILY_MEDICINE
  CLINICAL_LAB
  BLOOD_BANK
  DIAGNOSTIC_CENTER
  MATERNITY_HOME
  EYE_HOSPITAL
  DIALYSIS
  PSYCHIATRIC
  IVF_FERTILITY
  COLLECTION_CENTER
  HOMEOPATHIC
  RADIOLOGICAL
  BHU
  OTHER
}

enum IndicatorFrequency {
  WEEKLY
  BIMONTHLY
  MONTHLY
  QUARTERLY
  HALF_YEARLY
  YEARLY
  ONE_TIME
}

enum ComplianceStatus {
  COMPLIANT
  NON_COMPLIANT
  PARTIALLY_COMPLIANT
  NOT_ASSESSED
  IN_PROGRESS
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
  EXPIRED
}

enum PaymentType {
  FACILITY_REGISTRATION
  ANNUAL_SUBSCRIPTION
  TRAINING_FEE
  CONSULTANT_FEE
  PENALTY
  OTHER
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  EXPIRED
  CANCELLED
  SUSPENDED
}

enum TrainingStatus {
  UPCOMING
  ONGOING
  COMPLETED
  CANCELLED
}

model User {
  id              String          @id @default(cuid())
  email           String          @unique
  username        String          @unique
  password        String
  fullName        String
  phone           String?
  role            UserRole        @default(MSDS_FOCAL)
  isActive        Boolean         @default(true)
  emailVerified   DateTime?
  image           String?
  facilityId      String?
  approvalStatus  ApprovalStatus  @default(PENDING)
  approvedBy      String?
  approvedAt      DateTime?
  rejectionReason String?
  specialization  String?
  experience      Int?
  bio             String?         @db.Text
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  facility              Facility?              @relation("FacilityUsers", fields: [facilityId], references: [id])
  adminFacility         Facility?              @relation("FacilityAdmin")
  submissions           IndicatorSubmission[]
  drillRecords          DrillRecord[]
  activityLogs          ActivityLog[]
  payments              Payment[]
  trainingEnrollments   TrainingEnrollment[]
  consultantAssignments ConsultantAssignment[] @relation("ConsultantUser")
  notifications         Notification[]

  @@index([email])
  @@index([username])
  @@index([facilityId])
  @@index([approvalStatus])
}

model Facility {
  id              String           @id @default(cuid())
  name            String
  category        FacilityCategory
  registrationNo  String           @unique
  address         String
  city            String
  district        String
  province        String           @default("Punjab")
  phone           String?
  email           String?
  website         String?
  bedCount        Int?
  isActive        Boolean          @default(true)
  adminId         String           @unique
  approvalStatus  ApprovalStatus   @default(PENDING)
  approvedBy      String?
  approvedAt      DateTime?
  rejectionReason String?
  msdsCategory    String?
  subscriptionId  String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  admin                User                   @relation("FacilityAdmin", fields: [adminId], references: [id])
  users                User[]                 @relation("FacilityUsers")
  facilityIndicators   FacilityIndicator[]
  submissions          IndicatorSubmission[]
  drillRecords         DrillRecord[]
  complianceReports    ComplianceReport[]
  payments             Payment[]
  subscription         Subscription?
  consultantAssignments ConsultantAssignment[]

  @@index([category])
  @@index([district])
  @@index([isActive])
  @@index([approvalStatus])
}

model MsdsStandard {
  id          String           @id @default(cuid())
  code        String           @unique
  title       String
  description String           @db.Text
  category    FacilityCategory
  chapter     String?
  section     String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  indicators  Indicator[]

  @@index([category])
  @@index([code])
}

model Indicator {
  id                String             @id @default(cuid())
  code              String             @unique
  title             String
  description       String             @db.Text
  guidance          String             @db.Text
  frequency         IndicatorFrequency
  requiresEvidence  Boolean            @default(false)
  requiresPhoto     Boolean            @default(false)
  requiresDocument  Boolean            @default(false)
  dataType          String             @default("boolean")
  standardId        String
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  standard            MsdsStandard          @relation(fields: [standardId], references: [id])
  facilityIndicators  FacilityIndicator[]
  submissions         IndicatorSubmission[]

  @@index([standardId])
  @@index([frequency])
  @@index([code])
}

model FacilityIndicator {
  id              String           @id @default(cuid())
  status          ComplianceStatus @default(NOT_ASSESSED)
  lastAssessedAt  DateTime?
  nextDueDate     DateTime?
  notes           String?          @db.Text
  facilityId      String
  indicatorId     String

  facility   Facility  @relation(fields: [facilityId], references: [id])
  indicator  Indicator @relation(fields: [indicatorId], references: [id])

  @@unique([facilityId, indicatorId])
  @@index([facilityId])
  @@index([indicatorId])
  @@index([status])
}

model IndicatorSubmission {
  id          String           @id @default(cuid())
  value       String
  notes       String?          @db.Text
  status      ComplianceStatus
  submittedAt DateTime         @default(now())
  period      String
  indicatorId String
  facilityId  String
  userId      String
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  indicator  Indicator @relation(fields: [indicatorId], references: [id])
  facility   Facility  @relation(fields: [facilityId], references: [id])
  user       User      @relation(fields: [userId], references: [id])
  evidence   Evidence[]

  @@index([facilityId])
  @@index([indicatorId])
  @@index([userId])
  @@index([period])
}

model Evidence {
  id           String   @id @default(cuid())
  fileName     String
  fileType     String
  filePath     String
  fileSize     Int
  description  String?
  submissionId String
  uploadedAt   DateTime @default(now())

  submission  IndicatorSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@index([submissionId])
}

model DrillRecord {
  id           String   @id @default(cuid())
  type         String
  title        String
  description  String   @db.Text
  conductedAt  DateTime
  participants Int
  outcome      String?  @db.Text
  observations String?  @db.Text
  facilityId   String
  userId       String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  facility  Facility     @relation(fields: [facilityId], references: [id])
  user      User         @relation(fields: [userId], references: [id])
  photos    DrillPhoto[]

  @@index([facilityId])
  @@index([conductedAt])
}

model DrillPhoto {
  id        String   @id @default(cuid())
  filePath  String
  caption   String?
  drillId   String
  uploadedAt DateTime @default(now())

  drill  DrillRecord @relation(fields: [drillId], references: [id], onDelete: Cascade)

  @@index([drillId])
}

model ComplianceReport {
  id                   String   @id @default(cuid())
  title                String
  period               String
  generatedAt          DateTime @default(now())
  filePath             String?
  totalIndicators      Int
  compliant            Int
  nonCompliant         Int
  partiallyCompliant   Int
  complianceScore      Float
  facilityId           String

  facility  Facility @relation(fields: [facilityId], references: [id])

  @@index([facilityId])
  @@index([period])
}

model ActivityLog {
  id        String   @id @default(cuid())
  action    String
  entity    String
  entityId  String?
  details   String?  @db.Text
  ipAddress String?
  userId    String
  createdAt DateTime @default(now())

  user  User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([entity])
  @@index([createdAt])
}

model Payment {
  id            String        @id @default(cuid())
  amount        Float
  currency      String        @default("PKR")
  type          PaymentType
  status        PaymentStatus @default(PENDING)
  method        String?
  transactionId String?
  receiptUrl    String?
  description   String?
  metadata      Json?
  facilityId    String?
  userId        String
  paidAt        DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @default(now())

  facility  Facility? @relation(fields: [facilityId], references: [id])
  user      User      @relation(fields: [userId], references: [id])

  @@index([facilityId])
  @@index([userId])
  @@index([status])
  @@index([type])
}

model Subscription {
  id          String             @id @default(cuid())
  plan        String             @default("standard")
  status      SubscriptionStatus @default(TRIAL)
  startDate   DateTime           @default(now())
  endDate     DateTime
  trialEndsAt DateTime?
  amount      Float              @default(0)
  autoRenew   Boolean            @default(false)
  facilityId  String             @unique
  paymentId   String?
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @default(now())

  facility  Facility @relation(fields: [facilityId], references: [id])

  @@index([facilityId])
  @@index([status])
}

model Training {
  id               String           @id @default(cuid())
  title            String
  description      String?          @db.Text
  category         FacilityCategory?
  scheduledAt      DateTime
  duration         Int              @default(60)
  location         String?
  isOnline         Boolean          @default(false)
  meetingUrl       String?
  maxParticipants  Int?             @default(50)
  fee              Float            @default(0)
  status           TrainingStatus   @default(UPCOMING)
  conductedBy      String?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @default(now())

  enrollments  TrainingEnrollment[]

  @@index([status])
  @@index([scheduledAt])
}

model TrainingEnrollment {
  id             String    @id @default(cuid())
  trainingId     String
  userId         String
  facilityId     String?
  paymentId      String?
  status         String    @default("enrolled")
  completedAt    DateTime?
  certificateUrl String?
  createdAt      DateTime  @default(now())

  training  Training @relation(fields: [trainingId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([trainingId, userId])
  @@index([trainingId])
  @@index([userId])
}

model ConsultantAssignment {
  id           String    @id @default(cuid())
  consultantId String
  facilityId   String
  assignedBy   String
  startDate    DateTime  @default(now())
  endDate      DateTime?
  status       String    @default("active")
  notes        String?   @db.Text
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @default(now())

  consultant  User     @relation("ConsultantUser", fields: [consultantId], references: [id])
  facility    Facility @relation(fields: [facilityId], references: [id])

  @@index([consultantId])
  @@index([facilityId])
}

model Notification {
  id        String   @id @default(cuid())
  title     String
  message   String
  type      String   @default("info")
  isRead    Boolean  @default(false)
  link      String?
  userId    String
  createdAt DateTime @default(now())

  user  User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([isRead])
}
PRISMA

echo "✓ Prisma schema updated"

# ─────────────────────────────────────
# STEP 3: UPDATE CONSTANTS
# ─────────────────────────────────────
echo ""
echo "▶ Step 3: Updating constants..."

cat > src/lib/constants.ts << 'CONSTANTS'
export const FACILITY_CATEGORY_LABELS: Record<string, string> = {
  HOSPITAL_CAT_1: "Hospital (Cat-I, 50+ beds)",
  HOSPITAL_CAT_2: "Hospital (Cat-II, 16-50 beds)",
  HOSPITAL_CAT_3: "Hospital (Cat-III, up to 15 beds)",
  DENTAL_CARE: "Dental Clinic",
  FAMILY_MEDICINE: "GP / Family Medicine Clinic",
  CLINICAL_LAB: "Clinical Laboratory",
  BLOOD_BANK: "Blood Bank",
  DIAGNOSTIC_CENTER: "Diagnostic Center",
  MATERNITY_HOME: "Maternity Home",
  EYE_HOSPITAL: "Eye Hospital",
  DIALYSIS: "Dialysis Facility",
  PSYCHIATRIC: "Psychiatric / Addiction Treatment",
  IVF_FERTILITY: "IVF / Fertility Centre",
  COLLECTION_CENTER: "Collection Centre",
  HOMEOPATHIC: "Homeopathic Clinic",
  RADIOLOGICAL: "Radiological Diagnostic Centre",
  BHU: "Basic Health Unit (BHU)",
  OTHER: "Other",
};

export const MSDS_CATEGORY_MAP: Record<string, string> = {
  HOSPITAL_CAT_1: "HOSPITAL_CAT_1",
  HOSPITAL_CAT_2: "HOSPITAL_CAT_1",
  HOSPITAL_CAT_3: "HOSPITAL_CAT_1",
  DENTAL_CARE: "DENTAL_CARE",
  DIALYSIS: "DIAGNOSTIC_CENTER",
  PSYCHIATRIC: "OTHER",
  IVF_FERTILITY: "OTHER",
  CLINICAL_LAB: "CLINICAL_LAB",
  DIAGNOSTIC_CENTER: "DIAGNOSTIC_CENTER",
  FAMILY_MEDICINE: "FAMILY_MEDICINE",
  BLOOD_BANK: "BLOOD_BANK",
  MATERNITY_HOME: "MATERNITY_HOME",
  EYE_HOSPITAL: "EYE_HOSPITAL",
  COLLECTION_CENTER: "COLLECTION_CENTER",
  HOMEOPATHIC: "HOMEOPATHIC",
  RADIOLOGICAL: "RADIOLOGICAL",
  BHU: "BHU",
  OTHER: "OTHER",
};

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  FACILITY_REGISTRATION: "Facility Registration",
  ANNUAL_SUBSCRIPTION: "Annual Subscription",
  TRAINING_FEE: "Training Fee",
  CONSULTANT_FEE: "Consultant Fee",
  PENALTY: "Penalty",
  OTHER: "Other",
};

export const SUBSCRIPTION_PLANS = {
  standard: { name: "Standard", price: 50000, features: ["MSDS Compliance Tracking", "Self-Assessment Tools", "Basic Reporting"] },
  professional: { name: "Professional", price: 100000, features: ["Everything in Standard", "Consultant Support", "Advanced Analytics", "Priority Training Access"] },
  enterprise: { name: "Enterprise", price: 200000, features: ["Everything in Professional", "Dedicated Consultant", "Custom Reporting", "API Access", "White-label"] },
};

export const ROLE_LABELS: Record<string, string> = {
  REGX: "RegX Super Admin",
  ADMIN: "Facility Admin",
  MSDS_FOCAL: "MSDS Focal Person",
  CONSULTANT: "PHC Consultant",
};
CONSTANTS

echo "✓ Constants updated"

# ─────────────────────────────────────
# STEP 4: REGENERATE PRISMA CLIENT
# ─────────────────────────────────────
echo ""
echo "▶ Step 4: Regenerating Prisma client..."
npx prisma generate
echo "✓ Prisma client regenerated"

# ─────────────────────────────────────
# STEP 5: CREATE API ROUTES
# ─────────────────────────────────────
echo ""
echo "▶ Step 5: Creating API routes..."

# 5A: Facility Approval API
mkdir -p src/app/api/facilities/\[id\]/approve
cat > src/app/api/facilities/\[id\]/approve/route.ts << 'API1'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const { action, reason } = body; // action: 'approve' | 'reject' | 'suspend'

  const updateData: any = { approvedBy: session.user.id };

  if (action === "approve") {
    updateData.approvalStatus = "APPROVED";
    updateData.approvedAt = new Date();
    updateData.isActive = true;
  } else if (action === "reject") {
    updateData.approvalStatus = "REJECTED";
    updateData.rejectionReason = reason || "Not specified";
    updateData.isActive = false;
  } else if (action === "suspend") {
    updateData.approvalStatus = "SUSPENDED";
    updateData.rejectionReason = reason || "Suspended by admin";
    updateData.isActive = false;
  }

  const facility = await prisma.facility.update({ where: { id }, data: updateData });

  // Also update admin user approval status
  if (facility.adminId) {
    await prisma.user.update({
      where: { id: facility.adminId },
      data: { approvalStatus: action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "SUSPENDED" },
    });
  }

  return NextResponse.json({ success: true, facility });
}
API1

# 5B: User Approval API
mkdir -p src/app/api/users/\[id\]/approve
cat > src/app/api/users/\[id\]/approve/route.ts << 'API2'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const { action, reason } = body;

  const updateData: any = { approvedBy: session.user.id };
  if (action === "approve") {
    updateData.approvalStatus = "APPROVED";
    updateData.approvedAt = new Date();
    updateData.isActive = true;
  } else if (action === "reject") {
    updateData.approvalStatus = "REJECTED";
    updateData.rejectionReason = reason;
    updateData.isActive = false;
  }

  const user = await prisma.user.update({ where: { id }, data: updateData });
  return NextResponse.json({ success: true, user });
}
API2

# 5C: Payments API
mkdir -p src/app/api/payments
cat > src/app/api/payments/route.ts << 'API3'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where: any = {};
  if (session.user.role !== "REGX") {
    where.userId = session.user.id;
  }

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { facility: { select: { name: true } }, user: { select: { fullName: true } } },
  });

  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const payment = await prisma.payment.create({
    data: {
      amount: body.amount,
      type: body.type,
      method: body.method || "bank_transfer",
      description: body.description,
      facilityId: body.facilityId || null,
      userId: session.user.id,
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
API3

# 5D: Training API
mkdir -p src/app/api/trainings
cat > src/app/api/trainings/route.ts << 'API4'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const trainings = await prisma.training.findMany({
    orderBy: { scheduledAt: "asc" },
    include: { _count: { select: { enrollments: true } } },
  });
  return NextResponse.json(trainings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const training = await prisma.training.create({
    data: {
      title: body.title,
      description: body.description,
      category: body.category || null,
      scheduledAt: new Date(body.scheduledAt),
      duration: body.duration || 60,
      location: body.location,
      isOnline: body.isOnline || false,
      meetingUrl: body.meetingUrl,
      maxParticipants: body.maxParticipants || 50,
      fee: body.fee || 0,
      conductedBy: body.conductedBy,
    },
  });
  return NextResponse.json(training, { status: 201 });
}
API4

# 5E: Consultant Assignment API
mkdir -p src/app/api/consultants/assign
cat > src/app/api/consultants/assign/route.ts << 'API5'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const assignment = await prisma.consultantAssignment.create({
    data: {
      consultantId: body.consultantId,
      facilityId: body.facilityId,
      assignedBy: session.user.id,
      notes: body.notes,
    },
  });
  return NextResponse.json(assignment, { status: 201 });
}
API5

# 5F: Facility Registration API (public-facing for new facilities)
mkdir -p src/app/api/register
cat > src/app/api/register/route.ts << 'API6'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { facilityName, category, registrationNo, address, city, district,
            phone, email, bedCount, adminName, adminEmail, adminUsername, adminPassword } = body;

    // Check uniqueness
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: adminEmail }, { username: adminUsername }] },
    });
    if (existingUser) {
      return NextResponse.json({ error: "Email or username already taken" }, { status: 400 });
    }
    const existingFacility = await prisma.facility.findUnique({ where: { registrationNo } });
    if (existingFacility) {
      return NextResponse.json({ error: "Registration number already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create user first
    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        password: hashedPassword,
        fullName: adminName,
        phone,
        role: "ADMIN",
        approvalStatus: "PENDING",
        isActive: false, // inactive until approved
      },
    });

    // Create facility
    const facility = await prisma.facility.create({
      data: {
        name: facilityName,
        category,
        registrationNo,
        address,
        city,
        district,
        phone,
        email,
        bedCount: bedCount ? parseInt(bedCount) : null,
        adminId: user.id,
        approvalStatus: "PENDING",
        isActive: false,
      },
    });

    // Link user to facility
    await prisma.user.update({ where: { id: user.id }, data: { facilityId: facility.id } });

    return NextResponse.json({ success: true, message: "Registration submitted. Awaiting approval from RegX admin." }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
  }
}
API6

echo "✓ API routes created"

# ─────────────────────────────────────
# STEP 6: CREATE REGX DASHBOARD PAGES
# ─────────────────────────────────────
echo ""
echo "▶ Step 6: Creating RegX dashboard pages..."

# 6A: Approvals Page
mkdir -p src/app/\(dashboard\)/regx/approvals
cat > src/app/\(dashboard\)/regx/approvals/page.tsx << 'PAGE1'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS, APPROVAL_STATUS_LABELS } from "@/lib/constants";

async function ApprovalAction({ id, type }: { id: string; type: "facility" | "user" }) {
  return (
    <div className="flex gap-2">
      <form action={`/api/${type === "facility" ? "facilities" : "users"}/${id}/approve`} method="POST">
        <input type="hidden" name="action" value="approve" />
        <button className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700">
          Approve
        </button>
      </form>
    </div>
  );
}

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const [pendingFacilities, pendingUsers, recentActions] = await Promise.all([
    prisma.facility.findMany({
      where: { approvalStatus: "PENDING" },
      include: { admin: { select: { fullName: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { approvalStatus: "PENDING", role: { not: "REGX" } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.facility.findMany({
      where: { approvalStatus: { not: "PENDING" } },
      include: { admin: { select: { fullName: true } } },
      orderBy: { approvedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
        <p className="text-gray-500 mt-1">Review and approve facility registrations and user accounts</p>
      </div>

      {/* Pending Facilities */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Pending Facilities
            {pendingFacilities.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">{pendingFacilities.length}</span>
            )}
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {pendingFacilities.length === 0 ? (
            <p className="px-6 py-8 text-gray-400 text-center">No pending facility approvals</p>
          ) : (
            pendingFacilities.map((f) => (
              <div key={f.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{f.name}</p>
                  <p className="text-sm text-gray-500">
                    {FACILITY_CATEGORY_LABELS[f.category] || f.category} · {f.city}, {f.district}
                  </p>
                  <p className="text-sm text-gray-400">
                    Admin: {f.admin.fullName} · {f.admin.email}
                  </p>
                  <p className="text-xs text-gray-400">Reg#: {f.registrationNo}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`/regx/approvals/${f.id}`} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                    Review
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Users */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Pending User Accounts
            {pendingUsers.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">{pendingUsers.length}</span>
            )}
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {pendingUsers.length === 0 ? (
            <p className="px-6 py-8 text-gray-400 text-center">No pending user approvals</p>
          ) : (
            pendingUsers.map((u) => (
              <div key={u.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{u.fullName}</p>
                  <p className="text-sm text-gray-500">{u.role} · {u.email}</p>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">Pending</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Decisions</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentActions.map((f) => (
            <div key={f.id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{f.name}</p>
                <p className="text-xs text-gray-400">{f.admin.fullName}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                f.approvalStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                f.approvalStatus === "REJECTED" ? "bg-red-100 text-red-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                {APPROVAL_STATUS_LABELS[f.approvalStatus || "PENDING"]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
PAGE1

# 6B: Payments Page
mkdir -p src/app/\(dashboard\)/regx/payments
cat > src/app/\(dashboard\)/regx/payments/page.tsx << 'PAGE2'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PAYMENT_TYPE_LABELS } from "@/lib/constants";

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const [payments, stats] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        facility: { select: { name: true } },
        user: { select: { fullName: true } },
      },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalRevenue = stats.filter(s => s.status === "COMPLETED").reduce((sum, s) => sum + (s._sum.amount || 0), 0);
  const pendingAmount = stats.filter(s => s.status === "PENDING").reduce((sum, s) => sum + (s._sum.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">Track all financial transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-600">PKR {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Pending Payments</p>
          <p className="text-2xl font-bold text-amber-600">PKR {pendingAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="text-2xl font-bold text-blue-600">{payments.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No payments yet</td></tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{p.facility?.name || "—"}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{PAYMENT_TYPE_LABELS[p.type] || p.type}</td>
                  <td className="px-6 py-3 text-sm font-medium">PKR {p.amount.toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      p.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                      p.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                      p.status === "FAILED" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>{p.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
PAGE2

# 6C: Trainings Page
mkdir -p src/app/\(dashboard\)/regx/trainings
cat > src/app/\(dashboard\)/regx/trainings/page.tsx << 'PAGE3'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function TrainingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const trainings = await prisma.training.findMany({
    orderBy: { scheduledAt: "desc" },
    include: { _count: { select: { enrollments: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Programs</h1>
          <p className="text-gray-500 mt-1">Manage MSDS training sessions</p>
        </div>
        <a href="/regx/trainings/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          + New Training
        </a>
      </div>

      <div className="grid gap-4">
        {trainings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
            No training programs yet. Create one to get started.
          </div>
        ) : (
          trainings.map((t) => (
            <div key={t.id} className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{t.title}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    t.status === "UPCOMING" ? "bg-blue-100 text-blue-700" :
                    t.status === "ONGOING" ? "bg-emerald-100 text-emerald-700" :
                    t.status === "COMPLETED" ? "bg-gray-100 text-gray-600" :
                    "bg-red-100 text-red-700"
                  }`}>{t.status}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(t.scheduledAt).toLocaleDateString()} · {t.duration} min · {t.isOnline ? "Online" : t.location || "TBD"}
                </p>
                <p className="text-sm text-gray-400">
                  {t._count.enrollments} enrolled · Fee: {t.fee > 0 ? `PKR ${t.fee.toLocaleString()}` : "Free"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
PAGE3

# 6D: Consultants Page
mkdir -p src/app/\(dashboard\)/regx/consultants
cat > src/app/\(dashboard\)/regx/consultants/page.tsx << 'PAGE4'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ConsultantsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const [consultants, assignments] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CONSULTANT" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.consultantAssignment.findMany({
      where: { status: "active" },
      include: {
        consultant: { select: { fullName: true, specialization: true } },
        facility: { select: { name: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultants</h1>
          <p className="text-gray-500 mt-1">Manage PHC consultants and their facility assignments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Consultants</p>
          <p className="text-2xl font-bold text-blue-600">{consultants.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Active Assignments</p>
          <p className="text-2xl font-bold text-emerald-600">{assignments.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Consultant Roster</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {consultants.length === 0 ? (
            <p className="px-6 py-8 text-gray-400 text-center">No consultants registered yet</p>
          ) : (
            consultants.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{c.fullName}</p>
                  <p className="text-sm text-gray-500">
                    {c.specialization || "General"} · {c.experience ? `${c.experience} years exp.` : ""}
                  </p>
                  <p className="text-xs text-gray-400">{c.email}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  c.approvalStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                  c.approvalStatus === "PENDING" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>{c.approvalStatus}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {assignments.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Active Assignments</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {assignments.map((a) => (
              <div key={a.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.consultant.fullName}</p>
                  <p className="text-xs text-gray-500">{a.consultant.specialization}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">{a.facility.name}</p>
                  <p className="text-xs text-gray-400">Since {new Date(a.startDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
PAGE4

echo "✓ RegX dashboard pages created"

# ─────────────────────────────────────
# STEP 7: UPDATE SIDEBAR WITH NEW LINKS
# ─────────────────────────────────────
echo ""
echo "▶ Step 7: Updating Sidebar component..."

cat > src/components/Sidebar.tsx << 'SIDEBAR'
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@prisma/client";
import {
  LayoutDashboard, Building2, Users, FileCheck, ClipboardList,
  Settings, Shield, CreditCard, GraduationCap, UserCheck, Bell, BarChart3
} from "lucide-react";

const NAV_ITEMS: Record<string, { label: string; href: string; icon: any }[]> = {
  REGX: [
    { label: "Dashboard", href: "/regx", icon: LayoutDashboard },
    { label: "Approvals", href: "/regx/approvals", icon: UserCheck },
    { label: "Facilities", href: "/regx/facilities", icon: Building2 },
    { label: "Users", href: "/regx/users", icon: Users },
    { label: "Consultants", href: "/regx/consultants", icon: Shield },
    { label: "Trainings", href: "/regx/trainings", icon: GraduationCap },
    { label: "Payments", href: "/regx/payments", icon: CreditCard },
    { label: "Standards", href: "/regx/standards", icon: ClipboardList },
    { label: "Reports", href: "/regx/reports", icon: BarChart3 },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Compliance", href: "/admin/compliance", icon: FileCheck },
    { label: "Staff", href: "/admin/staff", icon: Users },
    { label: "Trainings", href: "/admin/trainings", icon: GraduationCap },
    { label: "Payments", href: "/admin/payments", icon: CreditCard },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ],
  MSDS_FOCAL: [
    { label: "Dashboard", href: "/focal", icon: LayoutDashboard },
    { label: "Self-Assessment", href: "/focal/assessment", icon: FileCheck },
    { label: "Evidence", href: "/focal/evidence", icon: ClipboardList },
    { label: "Reports", href: "/focal/reports", icon: BarChart3 },
  ],
  CONSULTANT: [
    { label: "Dashboard", href: "/consultant", icon: LayoutDashboard },
    { label: "Assigned Facilities", href: "/consultant/facilities", icon: Building2 },
    { label: "Assessments", href: "/consultant/assessments", icon: FileCheck },
    { label: "Reports", href: "/consultant/reports", icon: BarChart3 },
  ],
};

export function Sidebar({ role, facilityName }: { role: UserRole; facilityName?: string }) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role] || NAV_ITEMS.MSDS_FOCAL;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">PHC MSDS</h1>
            <p className="text-[10px] text-gray-400">Compliance Platform</p>
          </div>
        </div>
        {facilityName && (
          <p className="text-xs text-blue-600 mt-2 truncate">{facilityName}</p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== `/${role.toLowerCase()}` && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <div className="px-3 py-2">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{role.replace("_", " ")}</p>
        </div>
      </div>
    </aside>
  );
}
SIDEBAR

echo "✓ Sidebar updated"

# ─────────────────────────────────────
# STEP 8: CREATE REGISTRATION PAGE
# ─────────────────────────────────────
echo ""
echo "▶ Step 8: Creating registration page..."

mkdir -p src/app/register
cat > src/app/register/page.tsx << 'REGPAGE'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  { value: "HOSPITAL_CAT_1", label: "Hospital (Cat-I, 50+ beds)" },
  { value: "HOSPITAL_CAT_2", label: "Hospital (Cat-II, 16-50 beds)" },
  { value: "HOSPITAL_CAT_3", label: "Hospital (Cat-III, up to 15 beds)" },
  { value: "DENTAL_CARE", label: "Dental Clinic" },
  { value: "FAMILY_MEDICINE", label: "GP / Family Medicine Clinic" },
  { value: "CLINICAL_LAB", label: "Clinical Laboratory" },
  { value: "DIAGNOSTIC_CENTER", label: "Diagnostic Center" },
  { value: "DIALYSIS", label: "Dialysis Facility" },
  { value: "PSYCHIATRIC", label: "Psychiatric / Addiction Treatment" },
  { value: "IVF_FERTILITY", label: "IVF / Fertility Centre" },
  { value: "MATERNITY_HOME", label: "Maternity Home" },
  { value: "EYE_HOSPITAL", label: "Eye Hospital" },
  { value: "BLOOD_BANK", label: "Blood Bank" },
  { value: "BHU", label: "Basic Health Unit (BHU)" },
  { value: "COLLECTION_CENTER", label: "Collection Centre" },
  { value: "HOMEOPATHIC", label: "Homeopathic Clinic" },
  { value: "RADIOLOGICAL", label: "Radiological Diagnostic Centre" },
  { value: "OTHER", label: "Other" },
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    facilityName: "", category: "", registrationNo: "", address: "",
    city: "", district: "", phone: "", email: "", bedCount: "",
    adminName: "", adminEmail: "", adminUsername: "", adminPassword: "",
  });

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
          <p className="text-gray-500 mb-6">Your facility registration has been submitted for review. The RegX admin will review and approve your account.</p>
          <Link href="/login" className="text-blue-600 hover:underline text-sm">Go to Login</Link>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Register Your Facility</h1>
          <p className="text-gray-500 text-sm mt-1">PHC MSDS Compliance Platform</p>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2].map((s) => (
              <div key={s} className={`w-20 h-1 rounded-full ${step >= s ? "bg-blue-600" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Facility Information</h3>
              <div><label className={labelClass}>Facility Name *</label><input name="facilityName" value={form.facilityName} onChange={handleChange} className={inputClass} required /></div>
              <div><label className={labelClass}>Category *</label>
                <select name="category" value={form.category} onChange={handleChange} className={inputClass} required>
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>PHC Registration No. *</label><input name="registrationNo" value={form.registrationNo} onChange={handleChange} className={inputClass} required /></div>
                <div><label className={labelClass}>Bed Count</label><input name="bedCount" type="number" value={form.bedCount} onChange={handleChange} className={inputClass} /></div>
              </div>
              <div><label className={labelClass}>Address *</label><input name="address" value={form.address} onChange={handleChange} className={inputClass} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>City *</label><input name="city" value={form.city} onChange={handleChange} className={inputClass} required /></div>
                <div><label className={labelClass}>District *</label><input name="district" value={form.district} onChange={handleChange} className={inputClass} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Phone</label><input name="phone" value={form.phone} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Email</label><input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} /></div>
              </div>
              <button type="button" onClick={() => setStep(2)} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                Next: Admin Account →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Admin Account</h3>
              <div><label className={labelClass}>Full Name *</label><input name="adminName" value={form.adminName} onChange={handleChange} className={inputClass} required /></div>
              <div><label className={labelClass}>Email *</label><input name="adminEmail" type="email" value={form.adminEmail} onChange={handleChange} className={inputClass} required /></div>
              <div><label className={labelClass}>Username *</label><input name="adminUsername" value={form.adminUsername} onChange={handleChange} className={inputClass} required /></div>
              <div><label className={labelClass}>Password *</label><input name="adminPassword" type="password" value={form.adminPassword} onChange={handleChange} className={inputClass} required minLength={8} /></div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                  ← Back
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                  {loading ? "Submitting..." : "Register Facility"}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already registered? <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
REGPAGE

echo "✓ Registration page created"

# ─────────────────────────────────────
# STEP 9: UPDATE MAIN REGX DASHBOARD
# ─────────────────────────────────────
echo ""
echo "▶ Step 9: Updating RegX dashboard..."

cat > src/app/\(dashboard\)/regx/page.tsx << 'REGXDASH'
import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS } from "@/lib/constants";
import { Building2, Users, CreditCard, ClipboardList, UserCheck, GraduationCap, Shield, AlertTriangle } from "lucide-react";

export default async function RegxDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const [
    facilityCount, activeCount, pendingCount, userCount,
    consultantCount, standardCount, indicatorCount,
    paymentTotal, trainingCount, pendingFacilities
  ] = await Promise.all([
    prisma.facility.count(),
    prisma.facility.count({ where: { isActive: true, approvalStatus: "APPROVED" } }),
    prisma.facility.count({ where: { approvalStatus: "PENDING" } }),
    prisma.user.count({ where: { role: { not: "REGX" } } }),
    prisma.user.count({ where: { role: "CONSULTANT" } }),
    prisma.msdsStandard.count(),
    prisma.indicator.count(),
    prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.training.count(),
    prisma.facility.findMany({
      where: { approvalStatus: "PENDING" },
      include: { admin: { select: { fullName: true } } },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const stats = [
    { label: "Total Facilities", value: facilityCount, icon: Building2, color: "blue", sub: `${activeCount} active` },
    { label: "Pending Approvals", value: pendingCount, icon: UserCheck, color: "amber", sub: "Awaiting review", href: "/regx/approvals" },
    { label: "Users", value: userCount, icon: Users, color: "indigo", sub: `${consultantCount} consultants` },
    { label: "Standards", value: standardCount, icon: ClipboardList, color: "emerald", sub: `${indicatorCount} indicators` },
    { label: "Revenue", value: `PKR ${((paymentTotal._sum.amount || 0) / 1000).toFixed(0)}K`, icon: CreditCard, color: "green", sub: "Total collected" },
    { label: "Trainings", value: trainingCount, icon: GraduationCap, color: "purple", sub: "Programs created" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600", emerald: "bg-emerald-50 text-emerald-600",
    green: "bg-green-50 text-green-600", purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">RegX Dashboard</h1>
        <p className="text-gray-500 mt-1">Punjab Healthcare Commission — MSDS Compliance Platform</p>
      </div>

      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">{pendingCount} facility registration(s) pending approval</p>
            <a href="/regx/approvals" className="text-xs text-amber-600 hover:underline">Review now →</a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorMap[s.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pendingFacilities.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Pending Registrations</h2>
            <a href="/regx/approvals" className="text-sm text-blue-600 hover:underline">View all →</a>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingFacilities.map((f) => (
              <div key={f.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{f.name}</p>
                  <p className="text-xs text-gray-500">{FACILITY_CATEGORY_LABELS[f.category]} · {f.admin.fullName}</p>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
REGXDASH

echo "✓ RegX dashboard updated"

# ─────────────────────────────────────
# STEP 10: BUILD AND RESTART
# ─────────────────────────────────────
echo ""
echo "▶ Step 10: Building and restarting..."
pm2 stop phc 2>/dev/null || true
rm -rf .next
pnpm build
pm2 start phc 2>/dev/null || pm2 start ecosystem.config.js 2>/dev/null || pm2 start "pnpm start" --name phc

echo ""
echo "═══════════════════════════════════════"
echo "✅ PHASE 2 DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════"
echo ""
echo "New features:"
echo "  ✓ Facility registration with approval workflow"
echo "  ✓ RegX approval dashboard"
echo "  ✓ Payment tracking system"
echo "  ✓ Training management"
echo "  ✓ Consultant management & assignment"
echo "  ✓ Subscription/paywall foundation"
echo "  ✓ Notification system"
echo "  ✓ Updated sidebar navigation"
echo ""
echo "New URLs:"
echo "  /register          - Facility registration (public)"
echo "  /regx/approvals    - Approval queue"
echo "  /regx/payments     - Payment tracking"
echo "  /regx/trainings    - Training management"
echo "  /regx/consultants  - Consultant management"
echo ""
echo "Database additions:"
echo "  6 new tables: Payment, Subscription, Training,"
echo "  TrainingEnrollment, ConsultantAssignment, Notification"
echo "  New enums: ApprovalStatus, PaymentStatus, PaymentType,"
echo "  SubscriptionStatus, TrainingStatus"
echo "  New role: CONSULTANT"
echo "  New categories: DIALYSIS, PSYCHIATRIC, IVF_FERTILITY, etc."
echo "═══════════════════════════════════════"
