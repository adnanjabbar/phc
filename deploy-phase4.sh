#!/bin/bash
# ══════════════════════════════════════════════════════════════════
# PHC MSDS - PHASE 4 DEPLOYMENT SCRIPT
# ══════════════════════════════════════════════════════════════════
# Fixes ALL 404 pages, adds:
#   - MSDS Category pricing system (SuperAdmin sets prices)
#   - Category change request + approval workflow
#   - Admin: Staff management, Settings, Payments, Trainings, Reports
#   - Focal: Evidence upload page, Reports
#   - Consultant: Assessments, Reports
#   - RegX: Facilities list, Users list, Standards browser, Reports, Pricing
#   - Login redirect fix for CONSULTANT role
# ══════════════════════════════════════════════════════════════════
set -e
cd /var/www/phc

echo "═══════════════════════════════════════"
echo "PHC MSDS Phase 4 — Full Build"
echo "═══════════════════════════════════════"

# ─── 1. DATABASE: Category pricing + change requests ───
echo "▶ Step 1: Database migration..."

psql "postgresql://phc_admin:PhcMsds2026Secure@localhost:5432/phc_db" <<'EOSQL'

-- Category Pricing table (SuperAdmin sets price per category)
CREATE TABLE IF NOT EXISTS "CategoryPricing" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "category" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "annualFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "registrationFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "CategoryPricing_pkey" PRIMARY KEY ("id")
);

-- Seed default pricing
INSERT INTO "CategoryPricing" (id, category, name, "annualFee", "registrationFee", description) VALUES
  (gen_random_uuid()::text, 'HOSPITAL_CAT_1', 'Hospital (Cat-I, 50+ beds)', 150000, 50000, '30 standards, 162 indicators'),
  (gen_random_uuid()::text, 'HOSPITAL_CAT_2', 'Hospital (Cat-II, 16-50 beds)', 100000, 35000, 'Standards pending upload'),
  (gen_random_uuid()::text, 'HOSPITAL_CAT_3', 'Hospital (Cat-III, up to 15 beds)', 75000, 25000, 'Standards pending upload'),
  (gen_random_uuid()::text, 'DENTAL_CARE', 'Dental Clinic', 50000, 15000, '23 standards, 69 indicators'),
  (gen_random_uuid()::text, 'DIALYSIS', 'Dialysis Facility', 80000, 25000, '37 standards, 37 indicators'),
  (gen_random_uuid()::text, 'PSYCHIATRIC', 'Psychiatric / Addiction Treatment', 80000, 25000, '35 standards, 133 indicators'),
  (gen_random_uuid()::text, 'IVF_FERTILITY', 'IVF / Fertility Centre', 100000, 35000, '21 standards, 126 indicators'),
  (gen_random_uuid()::text, 'CLINICAL_LAB', 'Clinical Laboratory', 60000, 20000, 'Standards pending upload'),
  (gen_random_uuid()::text, 'DIAGNOSTIC_CENTER', 'Diagnostic Center', 60000, 20000, 'Standards pending upload'),
  (gen_random_uuid()::text, 'FAMILY_MEDICINE', 'GP / Family Medicine', 40000, 10000, 'Standards pending upload'),
  (gen_random_uuid()::text, 'BLOOD_BANK', 'Blood Bank', 70000, 20000, 'Standards pending upload'),
  (gen_random_uuid()::text, 'MATERNITY_HOME', 'Maternity Home', 60000, 20000, 'Standards pending upload'),
  (gen_random_uuid()::text, 'EYE_HOSPITAL', 'Eye Hospital', 60000, 20000, 'Standards pending upload'),
  (gen_random_uuid()::text, 'BHU', 'Basic Health Unit', 30000, 10000, 'Standards pending upload'),
  (gen_random_uuid()::text, 'COLLECTION_CENTER', 'Collection Centre', 40000, 10000, 'Standards pending upload'),
  (gen_random_uuid()::text, 'HOMEOPATHIC', 'Homeopathic Clinic', 35000, 10000, 'Standards pending upload'),
  (gen_random_uuid()::text, 'RADIOLOGICAL', 'Radiological Diagnostic Centre', 60000, 20000, 'Standards pending upload'),
  (gen_random_uuid()::text, 'OTHER', 'Other', 30000, 10000, 'General category')
ON CONFLICT (category) DO NOTHING;

-- Category Change Request table
CREATE TABLE IF NOT EXISTS "CategoryChangeRequest" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "facilityId" TEXT NOT NULL,
  "requestedBy" TEXT NOT NULL,
  "currentCategory" TEXT NOT NULL,
  "requestedCategory" TEXT NOT NULL,
  "reason" TEXT,
  "priceDifference" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP,
  "reviewNotes" TEXT,
  "paymentId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "CategoryChangeRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CategoryChangeRequest_facilityId_idx" ON "CategoryChangeRequest"("facilityId");
CREATE INDEX IF NOT EXISTS "CategoryChangeRequest_status_idx" ON "CategoryChangeRequest"("status");

DO $$ BEGIN
  ALTER TABLE "CategoryChangeRequest" ADD CONSTRAINT "ccr_facility_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "CategoryChangeRequest" ADD CONSTRAINT "ccr_user_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

SELECT 'CategoryPricing rows:', COUNT(*) FROM "CategoryPricing";
SELECT 'Tables:', COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
EOSQL

echo "✓ Database updated"

# ─── 2. UPDATE PRISMA SCHEMA (add new models) ───
echo "▶ Step 2: Updating Prisma schema..."

# Append new models to schema
grep -q "CategoryPricing" prisma/schema.prisma || cat >> prisma/schema.prisma << 'PRISMA'

model CategoryPricing {
  id              String   @id @default(cuid())
  category        String   @unique
  name            String
  annualFee       Float    @default(0)
  registrationFee Float    @default(0)
  description     String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @default(now())
}

model CategoryChangeRequest {
  id                String    @id @default(cuid())
  facilityId        String
  requestedBy       String
  currentCategory   String
  requestedCategory String
  reason            String?
  priceDifference   Float     @default(0)
  status            String    @default("PENDING")
  reviewedBy        String?
  reviewedAt        DateTime?
  reviewNotes       String?
  paymentId         String?
  createdAt         DateTime  @default(now())

  facility  Facility @relation(fields: [facilityId], references: [id])
  user      User     @relation(fields: [requestedBy], references: [id])

  @@index([facilityId])
  @@index([status])
}
PRISMA

# Add relations to existing models if not present
grep -q "categoryChangeRequests" prisma/schema.prisma || {
  sed -i '/consultantAssignments ConsultantAssignment\[\]/a\  categoryChangeRequests CategoryChangeRequest[]' prisma/schema.prisma
  # Add to both Facility and User - find the right spots
  # For Facility model, add after consultantAssignments
  sed -i '/model Facility/,/@@index/{
    /consultantAssignments.*ConsultantAssignment/a\  categoryChangeRequests CategoryChangeRequest[]
  }' prisma/schema.prisma 2>/dev/null || true
}

npx prisma generate 2>/dev/null
echo "✓ Prisma schema updated"

# ─── 3. API ROUTES ───
echo "▶ Step 3: Creating API routes..."

# 3A: Category Pricing API
mkdir -p src/app/api/pricing
cat > src/app/api/pricing/route.ts << 'EOF'
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const pricing = await prisma.categoryPricing.findMany({
    where: { isActive: true },
    orderBy: { annualFee: "asc" },
  });
  return NextResponse.json(pricing);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { id, annualFee, registrationFee, description } = body;
  const updated = await prisma.categoryPricing.update({
    where: { id },
    data: { annualFee, registrationFee, description, updatedAt: new Date() },
  });
  return NextResponse.json(updated);
}
EOF

# 3B: Category Change Request API
mkdir -p src/app/api/category-change
cat > src/app/api/category-change/route.ts << 'EOF'
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  // Calculate price difference
  const [currentPricing, newPricing] = await Promise.all([
    prisma.categoryPricing.findUnique({ where: { category: body.currentCategory } }),
    prisma.categoryPricing.findUnique({ where: { category: body.requestedCategory } }),
  ]);

  const priceDiff = Math.max(0, (newPricing?.annualFee || 0) - (currentPricing?.annualFee || 0));

  const request = await prisma.categoryChangeRequest.create({
    data: {
      facilityId: body.facilityId,
      requestedBy: session.user.id,
      currentCategory: body.currentCategory,
      requestedCategory: body.requestedCategory,
      reason: body.reason,
      priceDifference: priceDiff,
    },
  });

  return NextResponse.json(request, { status: 201 });
}
EOF

# 3C: Category Change Approve API
mkdir -p src/app/api/category-change/\[id\]
cat > src/app/api/category-change/\[id\]/route.ts << 'EOF'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const request = await prisma.categoryChangeRequest.update({
    where: { id },
    data: {
      status: body.action === "approve" ? "APPROVED" : "REJECTED",
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      reviewNotes: body.notes,
    },
  });

  // If approved, update the facility category and reset compliance
  if (body.action === "approve") {
    await prisma.facility.update({
      where: { id: request.facilityId },
      data: { category: request.requestedCategory as never },
    });
    // Clear old facility indicators so they can re-initialize
    await prisma.facilityIndicator.deleteMany({ where: { facilityId: request.facilityId } });
  }

  return NextResponse.json(request);
}
EOF

echo "✓ API routes created"

# ─── 4. ALL REGX PAGES ───
echo "▶ Step 4: Building all RegX pages..."

# 4A: Facilities List
mkdir -p "src/app/(dashboard)/regx/facilities"
cat > "src/app/(dashboard)/regx/facilities/page.tsx" << 'EOF'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS, APPROVAL_STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";

export default async function FacilitiesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const facilities = await prisma.facility.findMany({
    include: { admin: { select: { fullName: true, email: true } }, _count: { select: { users: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Facilities</h1>
          <p className="text-gray-500 mt-1">{facilities.length} registered facilities</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {facilities.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <Link href={`/regx/approvals/${f.id}`} className="text-sm font-medium text-blue-600 hover:underline">{f.name}</Link>
                  <p className="text-xs text-gray-400">Reg# {f.registrationNo}</p>
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">{FACILITY_CATEGORY_LABELS[f.category] || f.category}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{f.city}, {f.district}</td>
                <td className="px-6 py-3">
                  <p className="text-sm text-gray-900">{f.admin.fullName}</p>
                  <p className="text-xs text-gray-400">{f.admin.email}</p>
                </td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    f.approvalStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                    f.approvalStatus === "PENDING" ? "bg-amber-100 text-amber-700" :
                    f.approvalStatus === "REJECTED" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{APPROVAL_STATUS_LABELS[f.approvalStatus || "PENDING"]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
EOF

# 4B: Users List
mkdir -p "src/app/(dashboard)/regx/users"
cat > "src/app/(dashboard)/regx/users/page.tsx" << 'EOF'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/constants";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const users = await prisma.user.findMany({
    include: { facility: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <p className="text-sm font-medium text-gray-900">{u.fullName}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">{ROLE_LABELS[u.role] || u.role}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{u.facility?.name || "—"}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
EOF

# 4C: Standards Browser
mkdir -p "src/app/(dashboard)/regx/standards"
cat > "src/app/(dashboard)/regx/standards/page.tsx" << 'EOF'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS } from "@/lib/constants";

export default async function StandardsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const byCategory = await prisma.msdsStandard.groupBy({
    by: ["category"],
    _count: true,
  });

  const standards = await prisma.msdsStandard.findMany({
    include: { _count: { select: { indicators: true } } },
    orderBy: { code: "asc" },
  });

  const indicators = await prisma.indicator.count();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">MSDS Standards</h1>
        <p className="text-gray-500 mt-1">{standards.length} standards · {indicators} indicators across {byCategory.length} categories</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {byCategory.map((cat) => (
          <div key={cat.category} className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-900">{FACILITY_CATEGORY_LABELS[cat.category] || cat.category}</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{cat._count}</p>
            <p className="text-xs text-gray-400">standards</p>
          </div>
        ))}
      </div>

      {byCategory.map((cat) => {
        const catStandards = standards.filter(s => s.category === cat.category);
        return (
          <div key={cat.category} className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">{FACILITY_CATEGORY_LABELS[cat.category] || cat.category}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {catStandards.map((s) => (
                <div key={s.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.title}</p>
                    <p className="text-xs text-gray-400">{s.section}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{s._count.indicators} indicators</span>
                    <p className="text-xs text-gray-400 mt-0.5">{s.code}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
EOF

# 4D: RegX Reports
mkdir -p "src/app/(dashboard)/regx/reports"
cat > "src/app/(dashboard)/regx/reports/page.tsx" << 'EOF'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS } from "@/lib/constants";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const [totalFacilities, totalUsers, totalStandards, totalIndicators, totalPayments, submissions] = await Promise.all([
    prisma.facility.count(),
    prisma.user.count(),
    prisma.msdsStandard.count(),
    prisma.indicator.count(),
    prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.indicatorSubmission.count(),
  ]);

  const facilitiesByCategory = await prisma.facility.groupBy({ by: ["category"], _count: true });
  const facilitiesByStatus = await prisma.facility.groupBy({ by: ["approvalStatus"], _count: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">System Reports</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Facilities", value: totalFacilities, color: "blue" },
          { label: "Users", value: totalUsers, color: "indigo" },
          { label: "Standards", value: totalStandards, color: "emerald" },
          { label: "Indicators", value: totalIndicators, color: "teal" },
          { label: "Submissions", value: submissions, color: "purple" },
          { label: "Revenue", value: `PKR ${((totalPayments._sum.amount || 0) / 1000).toFixed(0)}K`, color: "green" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg shadow p-4 text-center">
            <p className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b"><h2 className="font-semibold">Facilities by Category</h2></div>
          <div className="divide-y divide-gray-50">
            {facilitiesByCategory.map((f) => (
              <div key={f.category} className="px-6 py-2 flex justify-between text-sm">
                <span className="text-gray-700">{FACILITY_CATEGORY_LABELS[f.category] || f.category}</span>
                <span className="font-medium">{f._count}</span>
              </div>
            ))}
            {facilitiesByCategory.length === 0 && <p className="px-6 py-4 text-gray-400 text-sm text-center">No data</p>}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b"><h2 className="font-semibold">Facilities by Status</h2></div>
          <div className="divide-y divide-gray-50">
            {facilitiesByStatus.map((f) => (
              <div key={f.approvalStatus || "null"} className="px-6 py-2 flex justify-between text-sm">
                <span className="text-gray-700">{f.approvalStatus || "Unknown"}</span>
                <span className="font-medium">{f._count}</span>
              </div>
            ))}
            {facilitiesByStatus.length === 0 && <p className="px-6 py-4 text-gray-400 text-sm text-center">No data</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

# 4E: RegX Pricing Management
mkdir -p "src/app/(dashboard)/regx/pricing"
cat > "src/app/(dashboard)/regx/pricing/page.tsx" << 'EOF'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PricingEditor from "./PricingEditor";

export default async function PricingPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const pricing = await prisma.categoryPricing.findMany({ orderBy: { annualFee: "desc" } });
  const changeRequests = await prisma.categoryChangeRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Category Pricing</h1>
        <p className="text-gray-500 mt-1">Set registration and annual fees per MSDS category</p>
      </div>

      {changeRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800">{changeRequests.length} pending category change request(s)</p>
        </div>
      )}

      <PricingEditor initialPricing={JSON.parse(JSON.stringify(pricing))} />
    </div>
  );
}
EOF

cat > "src/app/(dashboard)/regx/pricing/PricingEditor.tsx" << 'EOF'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Pricing {
  id: string;
  category: string;
  name: string;
  annualFee: number;
  registrationFee: number;
  description: string | null;
}

export default function PricingEditor({ initialPricing }: { initialPricing: Pricing[] }) {
  const [pricing, setPricing] = useState(initialPricing);
  const [saving, setSaving] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async (item: Pricing) => {
    setSaving(item.id);
    await fetch("/api/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    setSaving(null);
    router.refresh();
  };

  const updateField = (id: string, field: string, value: string | number) => {
    setPricing(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration Fee</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annual Fee</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {pricing.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
              <td className="px-4 py-3">
                <input type="number" value={p.registrationFee}
                  onChange={(e) => updateField(p.id, "registrationFee", Number(e.target.value))}
                  className="w-28 px-2 py-1 border rounded text-sm" />
              </td>
              <td className="px-4 py-3">
                <input type="number" value={p.annualFee}
                  onChange={(e) => updateField(p.id, "annualFee", Number(e.target.value))}
                  className="w-28 px-2 py-1 border rounded text-sm" />
              </td>
              <td className="px-4 py-3">
                <input type="text" value={p.description || ""}
                  onChange={(e) => updateField(p.id, "description", e.target.value)}
                  className="w-full px-2 py-1 border rounded text-sm" />
              </td>
              <td className="px-4 py-3">
                <button onClick={() => handleSave(p)} disabled={saving === p.id}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">
                  {saving === p.id ? "..." : "Save"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
EOF

echo "✓ All RegX pages built"

# ─── 5. ALL ADMIN PAGES ───
echo "▶ Step 5: Building all Admin pages..."

# 5A: Staff Management
mkdir -p "src/app/(dashboard)/admin/staff"
cat > "src/app/(dashboard)/admin/staff/page.tsx" << 'EOF'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/constants";

export default async function StaffPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const facility = await prisma.facility.findFirst({ where: { adminId: session.user.id } });
  if (!facility) redirect("/admin");

  const staff = await prisma.user.findMany({
    where: { facilityId: facility.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <span className="text-sm text-gray-500">{staff.length} team members</span>
      </div>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {staff.map((s) => (
          <div key={s.id} className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{s.fullName}</p>
              <p className="text-sm text-gray-500">{s.email} · {s.phone || "No phone"}</p>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">{ROLE_LABELS[s.role]}</span>
              <p className="text-xs text-gray-400 mt-1">Joined {new Date(s.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
        {staff.length === 0 && <p className="px-6 py-8 text-gray-400 text-center">No staff members yet</p>}
      </div>
    </div>
  );
}
EOF

# 5B: Admin Trainings
mkdir -p "src/app/(dashboard)/admin/trainings"
cat > "src/app/(dashboard)/admin/trainings/page.tsx" << 'EOF'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminTrainingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const trainings = await prisma.training.findMany({
    where: { status: { in: ["UPCOMING", "ONGOING"] } },
    orderBy: { scheduledAt: "asc" },
    include: { _count: { select: { enrollments: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Available Trainings</h1>
      <div className="grid gap-4">
        {trainings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">No upcoming training programs</div>
        ) : trainings.map((t) => (
          <div key={t.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{t.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(t.scheduledAt).toLocaleDateString()} · {t.duration} min · {t.isOnline ? "Online" : t.location}
                </p>
                <p className="text-sm text-gray-400">{t._count.enrollments}/{t.maxParticipants} enrolled · Fee: {t.fee > 0 ? `PKR ${t.fee.toLocaleString()}` : "Free"}</p>
              </div>
              <span className={`px-3 py-1 text-xs rounded-full ${t.status === "UPCOMING" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>{t.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

# 5C: Admin Payments
mkdir -p "src/app/(dashboard)/admin/payments"
cat > "src/app/(dashboard)/admin/payments/page.tsx" << 'EOF'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PAYMENT_TYPE_LABELS } from "@/lib/constants";

export default async function AdminPaymentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const facility = await prisma.facility.findFirst({ where: { adminId: session.user.id } });
  if (!facility) redirect("/admin");

  const payments = await prisma.payment.findMany({
    where: { facilityId: facility.id },
    orderBy: { createdAt: "desc" },
  });

  const totalPaid = payments.filter(p => p.status === "COMPLETED").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Total Paid</p>
          <p className="text-2xl font-bold text-emerald-600">PKR {totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Transactions</p>
          <p className="text-2xl font-bold text-blue-600">{payments.length}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {payments.length === 0 ? (
          <p className="px-6 py-8 text-gray-400 text-center">No payment records</p>
        ) : payments.map((p) => (
          <div key={p.id} className="px-6 py-3 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">{PAYMENT_TYPE_LABELS[p.type] || p.type}</p>
              <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">PKR {p.amount.toLocaleString()}</p>
              <span className={`text-xs ${p.status === "COMPLETED" ? "text-emerald-600" : "text-amber-600"}`}>{p.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

# 5D: Admin Reports
mkdir -p "src/app/(dashboard)/admin/reports"
cat > "src/app/(dashboard)/admin/reports/page.tsx" << 'EOF'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMPLIANCE_STATUS_LABELS } from "@/lib/constants";

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const facility = await prisma.facility.findFirst({ where: { adminId: session.user.id } });
  if (!facility) redirect("/admin");

  const stats = await prisma.facilityIndicator.groupBy({
    by: ["status"], where: { facilityId: facility.id }, _count: true,
  });

  const recentSubmissions = await prisma.indicatorSubmission.findMany({
    where: { facilityId: facility.id },
    orderBy: { submittedAt: "desc" },
    take: 20,
    include: { indicator: { select: { title: true, code: true } }, user: { select: { fullName: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Compliance Reports</h1>
      <div className="grid grid-cols-5 gap-3">
        {(["COMPLIANT", "NON_COMPLIANT", "PARTIALLY_COMPLIANT", "IN_PROGRESS", "NOT_ASSESSED"] as const).map((s) => (
          <div key={s} className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xl font-bold">{stats.find(x => x.status === s)?._count || 0}</p>
            <p className="text-[10px] text-gray-500">{COMPLIANCE_STATUS_LABELS[s]}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b"><h2 className="font-semibold">Recent Submissions</h2></div>
        <div className="divide-y divide-gray-50">
          {recentSubmissions.map((s) => (
            <div key={s.id} className="px-6 py-3 flex justify-between">
              <div>
                <p className="text-sm text-gray-900">{s.indicator.title}</p>
                <p className="text-xs text-gray-400">{s.indicator.code} · {s.user.fullName}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  s.status === "COMPLIANT" ? "bg-emerald-100 text-emerald-700" :
                  s.status === "NON_COMPLIANT" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                }`}>{s.status}</span>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(s.submittedAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {recentSubmissions.length === 0 && <p className="px-6 py-4 text-gray-400 text-center text-sm">No submissions yet</p>}
        </div>
      </div>
    </div>
  );
}
EOF

# 5E: Admin Settings (category change + facility info)
mkdir -p "src/app/(dashboard)/admin/settings"
cat > "src/app/(dashboard)/admin/settings/page.tsx" << 'EOF'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS } from "@/lib/constants";
import CategoryChangeForm from "./CategoryChangeForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const facility = await prisma.facility.findFirst({ where: { adminId: session.user.id } });
  if (!facility) redirect("/admin");

  const pricing = await prisma.categoryPricing.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  const pendingRequest = await prisma.categoryChangeRequest.findFirst({
    where: { facilityId: facility.id, status: "PENDING" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Facility Settings</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Facility Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-medium ml-2">{facility.name}</span></div>
          <div><span className="text-gray-500">Reg No:</span> <span className="font-medium ml-2">{facility.registrationNo}</span></div>
          <div><span className="text-gray-500">Category:</span> <span className="font-medium ml-2">{FACILITY_CATEGORY_LABELS[facility.category]}</span></div>
          <div><span className="text-gray-500">Location:</span> <span className="font-medium ml-2">{facility.city}, {facility.district}</span></div>
          <div><span className="text-gray-500">Status:</span> <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${facility.approvalStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{facility.approvalStatus}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Change MSDS Category</h2>
        {pendingRequest ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-800">Category change request pending</p>
            <p className="text-xs text-amber-600 mt-1">
              Requested: {FACILITY_CATEGORY_LABELS[pendingRequest.requestedCategory] || pendingRequest.requestedCategory}
              {pendingRequest.priceDifference > 0 && ` · Price difference: PKR ${pendingRequest.priceDifference.toLocaleString()}`}
            </p>
          </div>
        ) : (
          <CategoryChangeForm
            facilityId={facility.id}
            currentCategory={facility.category}
            pricing={JSON.parse(JSON.stringify(pricing))}
          />
        )}
      </div>
    </div>
  );
}
EOF

cat > "src/app/(dashboard)/admin/settings/CategoryChangeForm.tsx" << 'EOF'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Pricing { category: string; name: string; annualFee: number; registrationFee: number; }

export default function CategoryChangeForm({ facilityId, currentCategory, pricing }: {
  facilityId: string; currentCategory: string; pricing: Pricing[];
}) {
  const [selected, setSelected] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const currentPrice = pricing.find(p => p.category === currentCategory)?.annualFee || 0;
  const newPrice = pricing.find(p => p.category === selected)?.annualFee || 0;
  const diff = Math.max(0, newPrice - currentPrice);

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch("/api/category-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facilityId, currentCategory, requestedCategory: selected, reason }),
    });
    if (res.ok) { setSuccess(true); router.refresh(); }
    setLoading(false);
  };

  if (success) return <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg text-sm">Request submitted! Awaiting RegX admin approval.</div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Select a new MSDS category. If the new category has a higher fee, you will need to pay the difference upon approval.</p>
      <select value={selected} onChange={(e) => setSelected(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
        <option value="">Select new category...</option>
        {pricing.filter(p => p.category !== currentCategory).map(p => (
          <option key={p.category} value={p.category}>{p.name} — PKR {p.annualFee.toLocaleString()}/yr</option>
        ))}
      </select>
      {selected && diff > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          Price difference: <span className="font-bold">PKR {diff.toLocaleString()}</span> (will be charged upon approval)
        </div>
      )}
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Reason for category change..." />
      <button onClick={handleSubmit} disabled={!selected || loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Submitting..." : "Request Category Change"}
      </button>
    </div>
  );
}
EOF

echo "✓ All Admin pages built"

# ─── 6. ALL FOCAL PAGES ───
echo "▶ Step 6: Building Focal person pages..."

# 6A: Evidence page
mkdir -p "src/app/(dashboard)/focal/evidence"
cat > "src/app/(dashboard)/focal/evidence/page.tsx" << 'EOF'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function EvidencePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "MSDS_FOCAL") redirect("/login");

  const submissions = await prisma.indicatorSubmission.findMany({
    where: { userId: session.user.id },
    orderBy: { submittedAt: "desc" },
    take: 50,
    include: {
      indicator: { select: { title: true, code: true } },
      evidence: true,
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Evidence & Submissions</h1>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {submissions.length === 0 ? (
          <p className="px-6 py-8 text-gray-400 text-center">No submissions yet. Complete assessments to see them here.</p>
        ) : submissions.map((s) => (
          <div key={s.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{s.indicator.title}</p>
                <p className="text-xs text-gray-400">{s.indicator.code} · {new Date(s.submittedAt).toLocaleString()}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                s.status === "COMPLIANT" ? "bg-emerald-100 text-emerald-700" :
                s.status === "NON_COMPLIANT" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
              }`}>{s.status}</span>
            </div>
            {s.notes && <p className="text-sm text-gray-600 mt-2">{s.notes}</p>}
            {s.evidence.length > 0 && (
              <div className="mt-2 flex gap-2">
                {s.evidence.map((e) => (
                  <span key={e.id} className="text-xs bg-gray-100 px-2 py-1 rounded">{e.fileName}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

# 6B: Focal Reports
mkdir -p "src/app/(dashboard)/focal/reports"
cat > "src/app/(dashboard)/focal/reports/page.tsx" << 'EOF'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMPLIANCE_STATUS_LABELS } from "@/lib/constants";

export default async function FocalReportsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "MSDS_FOCAL") redirect("/login");

  const facilityId = session.user.facilityId;
  if (!facilityId) redirect("/focal");

  const stats = await prisma.facilityIndicator.groupBy({
    by: ["status"], where: { facilityId }, _count: true,
  });
  const total = stats.reduce((sum, s) => sum + s._count, 0);
  const compliant = stats.find(s => s.status === "COMPLIANT")?._count || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-4xl font-bold text-blue-600">{total > 0 ? Math.round((compliant/total)*100) : 0}%</p>
        <p className="text-gray-500 mt-2">Overall Compliance Score</p>
        <p className="text-xs text-gray-400">{compliant} of {total} indicators compliant</p>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {(["COMPLIANT", "NON_COMPLIANT", "PARTIALLY_COMPLIANT", "IN_PROGRESS", "NOT_ASSESSED"] as const).map((s) => (
          <div key={s} className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xl font-bold">{stats.find(x => x.status === s)?._count || 0}</p>
            <p className="text-[10px] text-gray-500">{COMPLIANCE_STATUS_LABELS[s]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

echo "✓ All Focal pages built"

# ─── 7. CONSULTANT REMAINING PAGES ───
echo "▶ Step 7: Building Consultant pages..."

mkdir -p "src/app/(dashboard)/consultant/assessments"
cat > "src/app/(dashboard)/consultant/assessments/page.tsx" << 'EOF'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ConsultantAssessmentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CONSULTANT") redirect("/login");

  const assignments = await prisma.consultantAssignment.findMany({
    where: { consultantId: session.user.id, status: "active" },
    include: { facility: { select: { id: true, name: true } } },
  });

  const facilityIds = assignments.map(a => a.facilityId);
  const submissions = facilityIds.length > 0 ? await prisma.indicatorSubmission.findMany({
    where: { facilityId: { in: facilityIds } },
    orderBy: { submittedAt: "desc" },
    take: 30,
    include: {
      indicator: { select: { title: true, code: true } },
      facility: { select: { name: true } },
      user: { select: { fullName: true } },
    },
  }) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Recent Assessments</h1>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {submissions.length === 0 ? (
          <p className="px-6 py-8 text-gray-400 text-center">No assessment submissions from assigned facilities yet</p>
        ) : submissions.map((s) => (
          <div key={s.id} className="px-6 py-3 flex justify-between">
            <div>
              <p className="text-sm text-gray-900">{s.indicator.title}</p>
              <p className="text-xs text-gray-400">{s.facility.name} · {s.user.fullName} · {s.indicator.code}</p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                s.status === "COMPLIANT" ? "bg-emerald-100 text-emerald-700" :
                s.status === "NON_COMPLIANT" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
              }`}>{s.status}</span>
              <p className="text-xs text-gray-400 mt-0.5">{new Date(s.submittedAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

mkdir -p "src/app/(dashboard)/consultant/reports"
cat > "src/app/(dashboard)/consultant/reports/page.tsx" << 'EOF'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS } from "@/lib/constants";

export default async function ConsultantReportsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CONSULTANT") redirect("/login");

  const assignments = await prisma.consultantAssignment.findMany({
    where: { consultantId: session.user.id, status: "active" },
    include: {
      facility: { include: { _count: { select: { facilityIndicators: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Facility Reports</h1>
      <div className="grid gap-4">
        {assignments.map((a) => (
          <div key={a.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900">{a.facility.name}</h3>
            <p className="text-sm text-gray-500">{FACILITY_CATEGORY_LABELS[a.facility.category]} · {a.facility._count.facilityIndicators} indicators tracked</p>
          </div>
        ))}
        {assignments.length === 0 && <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">No assigned facilities</div>}
      </div>
    </div>
  );
}
EOF

echo "✓ All Consultant pages built"

# ─── 8. UPDATE SIDEBAR (add Pricing link) ───
echo "▶ Step 8: Adding Pricing to sidebar..."

sed -i '/{ label: "Reports", href: "\/regx\/reports", icon: BarChart3 },/a\    { label: "Pricing", href: "/regx/pricing", icon: CreditCard },' src/components/Sidebar.tsx

echo "✓ Sidebar updated"

# ─── 9. FIX LOGIN REDIRECT FOR CONSULTANT ROLE ───
echo "▶ Step 9: Fixing login redirect..."

# Check if login page handles CONSULTANT redirect
LOGIN_FILE=$(find src/app -name "page.tsx" -path "*/login/*" | head -1)
if [ -n "$LOGIN_FILE" ]; then
  # Add CONSULTANT redirect if not present
  grep -q "CONSULTANT" "$LOGIN_FILE" || {
    sed -i 's/case "MSDS_FOCAL":/case "CONSULTANT": router.push("\/consultant"); break;\n        case "MSDS_FOCAL":/' "$LOGIN_FILE"
  }
  echo "✓ Login redirect fixed for CONSULTANT role"
else
  echo "⚠ Login file not found, skipping redirect fix"
fi

# ─── 10. BUILD ───
echo ""
echo "▶ Step 10: Building..."
pm2 stop phc 2>/dev/null || true
rm -rf .next
NODE_OPTIONS="--max-old-space-size=384" pnpm build && pm2 restart phc

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ PHASE 4 DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "NEW PAGES (all 404s fixed):"
echo "  RegX:"
echo "    /regx              - Dashboard (already existed)"
echo "    /regx/approvals    - Approval queue"
echo "    /regx/approvals/id - Approval detail (approve/reject)"
echo "    /regx/facilities   - All facilities list"
echo "    /regx/users        - All users list"
echo "    /regx/consultants  - Consultant management"
echo "    /regx/trainings    - Training management"
echo "    /regx/payments     - Payment tracking"
echo "    /regx/standards    - MSDS standards browser"
echo "    /regx/reports      - System reports"
echo "    /regx/pricing      - Category pricing editor ⭐NEW"
echo ""
echo "  Admin:"
echo "    /admin             - Dashboard with category standards"
echo "    /admin/compliance  - Initialize + view compliance"
echo "    /admin/staff       - Staff management"
echo "    /admin/trainings   - Available trainings"
echo "    /admin/payments    - Payment history"
echo "    /admin/reports     - Compliance reports"
echo "    /admin/settings    - Facility info + category change ⭐NEW"
echo ""
echo "  Focal Person:"
echo "    /focal             - Self-assessment dashboard"
echo "    /focal/assessment/id - Questionnaire form"
echo "    /focal/evidence    - Submissions & evidence"
echo "    /focal/reports     - Compliance score"
echo ""
echo "  Consultant:"
echo "    /consultant            - Dashboard with assigned facilities"
echo "    /consultant/facilities/id - Facility compliance detail"
echo "    /consultant/assessments  - Recent submissions feed"
echo "    /consultant/reports      - Facility reports"
echo ""
echo "NEW DATABASE:"
echo "  CategoryPricing - 18 categories with fees"
echo "  CategoryChangeRequest - Change workflow"
echo ""
echo "BUSINESS FLOWS:"
echo "  1. RegX sets category pricing at /regx/pricing"
echo "  2. Facility registers → selects category → pays registration fee"
echo "  3. Admin can request category change at /admin/settings"
echo "  4. RegX approves change → old indicators cleared → admin re-initializes"
echo "  5. Price difference charged if upgrading category"
echo "═══════════════════════════════════════════════════"
