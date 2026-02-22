#!/bin/bash
# ══════════════════════════════════════════════════════════════
# PHC MSDS - PHASE 3 DEPLOYMENT SCRIPT
# Features:
#   1. Facility approval review page (approve/reject with details)
#   2. Admin dashboard (category selection, view indicators)
#   3. Self-assessment questionnaire engine (focal person)
#   4. Consultant dashboard & assignment workflow
# ══════════════════════════════════════════════════════════════
# Run: cd /var/www/phc && bash deploy-phase3.sh
# ══════════════════════════════════════════════════════════════

set -e
cd /var/www/phc

echo "═══════════════════════════════════════"
echo "PHC MSDS Phase 3 Deployment"
echo "═══════════════════════════════════════"

# ─────────────────────────────────────────────────
# 1. FACILITY APPROVAL DETAIL PAGE (RegX reviews)
# ─────────────────────────────────────────────────
echo "▶ Creating facility approval review page..."

mkdir -p "src/app/(dashboard)/regx/approvals/[id]"

cat > "src/app/(dashboard)/regx/approvals/[id]/page.tsx" << 'EOPAGE'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS } from "@/lib/constants";
import ApprovalActions from "./ApprovalActions";

export default async function FacilityReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");
  const { id } = await params;

  const facility = await prisma.facility.findUnique({
    where: { id },
    include: {
      admin: { select: { id: true, fullName: true, email: true, phone: true, createdAt: true } },
    },
  });

  if (!facility) redirect("/regx/approvals");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/regx/approvals" className="text-sm text-blue-600 hover:underline">← Back to Approvals</a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Review Facility Registration</h1>
      </div>

      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{facility.name}</h2>
            <span className={`px-3 py-1 text-xs rounded-full font-medium ${
              facility.approvalStatus === "PENDING" ? "bg-amber-100 text-amber-700" :
              facility.approvalStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
              facility.approvalStatus === "REJECTED" ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {facility.approvalStatus}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Category</p>
            <p className="font-medium text-gray-900">{FACILITY_CATEGORY_LABELS[facility.category] || facility.category}</p>
          </div>
          <div>
            <p className="text-gray-500">Registration No.</p>
            <p className="font-medium text-gray-900">{facility.registrationNo}</p>
          </div>
          <div>
            <p className="text-gray-500">Address</p>
            <p className="font-medium text-gray-900">{facility.address}</p>
          </div>
          <div>
            <p className="text-gray-500">City / District</p>
            <p className="font-medium text-gray-900">{facility.city}, {facility.district}</p>
          </div>
          <div>
            <p className="text-gray-500">Phone</p>
            <p className="font-medium text-gray-900">{facility.phone || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{facility.email || "—"}</p>
          </div>
          {facility.bedCount && (
            <div>
              <p className="text-gray-500">Bed Count</p>
              <p className="font-medium text-gray-900">{facility.bedCount}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Applied On</p>
            <p className="font-medium text-gray-900">{new Date(facility.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Admin Contact</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{facility.admin.fullName}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{facility.admin.email}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{facility.admin.phone || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {facility.approvalStatus === "PENDING" && (
        <ApprovalActions facilityId={facility.id} />
      )}

      {facility.approvalStatus === "REJECTED" && facility.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
          <p className="text-sm text-red-700 mt-1">{facility.rejectionReason}</p>
        </div>
      )}
    </div>
  );
}
EOPAGE

cat > "src/app/(dashboard)/regx/approvals/[id]/ApprovalActions.tsx" << 'EOCLIENT'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApprovalActions({ facilityId }: { facilityId: string }) {
  const [loading, setLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) {
        router.push("/regx/approvals");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="font-semibold text-gray-900">Take Action</h3>
      
      {showReject ? (
        <div className="space-y-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for rejection..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
            rows={3}
          />
          <div className="flex gap-2">
            <button onClick={() => handleAction("reject")} disabled={loading || !reason}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
              {loading ? "Processing..." : "Confirm Rejection"}
            </button>
            <button onClick={() => setShowReject(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button onClick={() => handleAction("approve")} disabled={loading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
            {loading ? "Processing..." : "✓ Approve Facility"}
          </button>
          <button onClick={() => setShowReject(true)}
            className="px-6 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100">
            ✕ Reject
          </button>
          <button onClick={() => handleAction("suspend")} disabled={loading}
            className="px-6 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm hover:bg-gray-100">
            Suspend
          </button>
        </div>
      )}
    </div>
  );
}
EOCLIENT

echo "✓ Facility approval review page"

# ─────────────────────────────────────────────────
# 2. ADMIN DASHBOARD (category selection, indicators)
# ─────────────────────────────────────────────────
echo "▶ Creating Admin dashboard..."

cat > "src/app/(dashboard)/admin/page.tsx" << 'EOADMIN'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS, COMPLIANCE_STATUS_LABELS } from "@/lib/constants";
import { Building2, ClipboardList, FileCheck, Users, AlertTriangle } from "lucide-react";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const facility = await prisma.facility.findFirst({
    where: { adminId: session.user.id },
    include: {
      subscription: true,
      _count: { select: { users: true, facilityIndicators: true, submissions: true } },
    },
  });

  if (!facility) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">No Facility Found</h2>
          <p className="text-gray-500 mt-2">Your account is not linked to any facility yet.</p>
        </div>
      </div>
    );
  }

  const isPending = facility.approvalStatus === "PENDING";
  const isRejected = facility.approvalStatus === "REJECTED";

  // Get standards for this facility category
  const standards = await prisma.msdsStandard.findMany({
    where: { category: facility.category },
    include: { _count: { select: { indicators: true } } },
    orderBy: { code: "asc" },
  });

  // Get compliance stats
  const complianceStats = await prisma.facilityIndicator.groupBy({
    by: ["status"],
    where: { facilityId: facility.id },
    _count: true,
  });

  const totalAssigned = facility._count.facilityIndicators;
  const compliantCount = complianceStats.find(s => s.status === "COMPLIANT")?._count || 0;
  const compliancePercent = totalAssigned > 0 ? Math.round((compliantCount / totalAssigned) * 100) : 0;

  const totalIndicators = standards.reduce((sum, s) => sum + s._count.indicators, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{facility.name}</h1>
        <p className="text-gray-500 mt-1">{FACILITY_CATEGORY_LABELS[facility.category]} · {facility.city}, {facility.district}</p>
      </div>

      {isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Your facility registration is pending approval</p>
            <p className="text-xs text-amber-600">The RegX admin will review your registration. Some features are limited until approved.</p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800">Your facility registration was rejected</p>
          {facility.rejectionReason && <p className="text-xs text-red-600 mt-1">Reason: {facility.rejectionReason}</p>}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">MSDS Standards</p>
              <p className="text-2xl font-bold text-gray-900">{standards.length}</p>
              <p className="text-xs text-gray-400">{totalIndicators} indicators</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Compliance</p>
              <p className="text-2xl font-bold text-gray-900">{compliancePercent}%</p>
              <p className="text-xs text-gray-400">{compliantCount}/{totalAssigned} compliant</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Staff</p>
              <p className="text-2xl font-bold text-gray-900">{facility._count.users}</p>
              <p className="text-xs text-gray-400">Team members</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{facility._count.submissions}</p>
              <p className="text-xs text-gray-400">Total entries</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* MSDS Standards for this category */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Applicable MSDS Standards</h2>
            <p className="text-xs text-gray-400 mt-0.5">Standards applicable to {FACILITY_CATEGORY_LABELS[facility.category]}</p>
          </div>
          {totalAssigned === 0 && standards.length > 0 && (
            <a href="/admin/compliance" className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
              Initialize Compliance →
            </a>
          )}
        </div>
        <div className="divide-y divide-gray-50">
          {standards.length === 0 ? (
            <p className="px-6 py-8 text-gray-400 text-center">No MSDS standards found for your category. They may be pending upload.</p>
          ) : (
            standards.map((s) => (
              <div key={s.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.title}</p>
                  <p className="text-xs text-gray-400">{s.section} · {s._count.indicators} indicators</p>
                </div>
                <span className="text-xs text-gray-400">{s.code}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Compliance breakdown */}
      {complianceStats.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Compliance Breakdown</h2>
          </div>
          <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-5 gap-4">
            {(["COMPLIANT", "NON_COMPLIANT", "PARTIALLY_COMPLIANT", "IN_PROGRESS", "NOT_ASSESSED"] as const).map((status) => {
              const count = complianceStats.find(s => s.status === status)?._count || 0;
              const colors: Record<string, string> = {
                COMPLIANT: "text-emerald-600 bg-emerald-50",
                NON_COMPLIANT: "text-red-600 bg-red-50",
                PARTIALLY_COMPLIANT: "text-amber-600 bg-amber-50",
                IN_PROGRESS: "text-blue-600 bg-blue-50",
                NOT_ASSESSED: "text-gray-500 bg-gray-50",
              };
              return (
                <div key={status} className={`rounded-lg p-3 text-center ${colors[status]}`}>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-[10px] mt-1">{COMPLIANCE_STATUS_LABELS[status]}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
EOADMIN

echo "✓ Admin dashboard"

# ─────────────────────────────────────────────────
# 3. ADMIN COMPLIANCE PAGE (initialize + view indicators)
# ─────────────────────────────────────────────────
echo "▶ Creating compliance management page..."

mkdir -p "src/app/(dashboard)/admin/compliance"

cat > "src/app/(dashboard)/admin/compliance/page.tsx" << 'EOCOMP'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMPLIANCE_STATUS_LABELS } from "@/lib/constants";
import InitializeButton from "./InitializeButton";

export default async function CompliancePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const facility = await prisma.facility.findFirst({ where: { adminId: session.user.id } });
  if (!facility) redirect("/admin");

  // Get all standards for this facility's category
  const standards = await prisma.msdsStandard.findMany({
    where: { category: facility.category },
    include: {
      indicators: {
        include: {
          facilityIndicators: { where: { facilityId: facility.id } },
        },
        orderBy: { code: "asc" },
      },
    },
    orderBy: { code: "asc" },
  });

  const totalIndicators = standards.reduce((sum, s) => sum + s.indicators.length, 0);
  const assignedCount = standards.reduce(
    (sum, s) => sum + s.indicators.filter(i => i.facilityIndicators.length > 0).length, 0
  );
  const isInitialized = assignedCount > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Management</h1>
          <p className="text-gray-500 mt-1">{totalIndicators} indicators across {standards.length} standards</p>
        </div>
        {!isInitialized && totalIndicators > 0 && (
          <InitializeButton facilityId={facility.id} category={facility.category} />
        )}
      </div>

      {/* Progress bar */}
      {isInitialized && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Overall Progress</p>
            <p className="text-sm text-gray-500">{assignedCount}/{totalIndicators} tracked</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(assignedCount / totalIndicators) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Standards accordion */}
      {standards.map((std) => (
        <div key={std.id} className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{std.title}</h3>
                <p className="text-xs text-gray-400">{std.section} · {std.indicators.length} indicators</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{std.code}</span>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {std.indicators.map((ind) => {
              const fi = ind.facilityIndicators[0];
              const status = fi?.status || "NOT_ASSESSED";
              const statusColors: Record<string, string> = {
                COMPLIANT: "bg-emerald-100 text-emerald-700",
                NON_COMPLIANT: "bg-red-100 text-red-700",
                PARTIALLY_COMPLIANT: "bg-amber-100 text-amber-700",
                IN_PROGRESS: "bg-blue-100 text-blue-700",
                NOT_ASSESSED: "bg-gray-100 text-gray-500",
              };
              return (
                <div key={ind.id} className="px-6 py-3 flex items-start justify-between gap-4 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{ind.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ind.code} · {ind.frequency}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full whitespace-nowrap ${statusColors[status]}`}>
                    {COMPLIANCE_STATUS_LABELS[status]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
EOCOMP

cat > "src/app/(dashboard)/admin/compliance/InitializeButton.tsx" << 'EOINIT'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InitializeButton({ facilityId, category }: { facilityId: string; category: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/compliance/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId, category }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleInit} disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
      {loading ? "Initializing..." : "Initialize Compliance Tracking"}
    </button>
  );
}
EOINIT

# API: Initialize compliance (assign all indicators for category to facility)
mkdir -p src/app/api/compliance/initialize
cat > src/app/api/compliance/initialize/route.ts << 'EOINITAPI'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { facilityId, category } = await req.json();

  // Get all indicators for this category
  const standards = await prisma.msdsStandard.findMany({
    where: { category },
    include: { indicators: true },
  });

  const indicators = standards.flatMap(s => s.indicators);
  let created = 0;

  for (const ind of indicators) {
    try {
      await prisma.facilityIndicator.create({
        data: {
          facilityId,
          indicatorId: ind.id,
          status: "NOT_ASSESSED",
        },
      });
      created++;
    } catch {
      // Already exists (unique constraint), skip
    }
  }

  return NextResponse.json({ success: true, created, total: indicators.length });
}
EOINITAPI

echo "✓ Compliance management"

# ─────────────────────────────────────────────────
# 4. FOCAL PERSON: SELF-ASSESSMENT QUESTIONNAIRE
# ─────────────────────────────────────────────────
echo "▶ Creating self-assessment questionnaire..."

cat > "src/app/(dashboard)/focal/page.tsx" << 'EOFOCAL'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMPLIANCE_STATUS_LABELS, FACILITY_CATEGORY_LABELS } from "@/lib/constants";
import { ClipboardList, FileCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

export default async function FocalDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "MSDS_FOCAL") redirect("/login");

  const facility = await prisma.facility.findFirst({
    where: { id: session.user.facilityId || "" },
  });

  if (!facility) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">No Facility Assigned</h2>
          <p className="text-gray-500 mt-2">Contact your facility admin to get assigned.</p>
        </div>
      </div>
    );
  }

  const facilityIndicators = await prisma.facilityIndicator.findMany({
    where: { facilityId: facility.id },
    include: {
      indicator: { include: { standard: true } },
    },
    orderBy: { indicator: { code: "asc" } },
  });

  const total = facilityIndicators.length;
  const assessed = facilityIndicators.filter(fi => fi.status !== "NOT_ASSESSED").length;
  const compliant = facilityIndicators.filter(fi => fi.status === "COMPLIANT").length;
  const nonCompliant = facilityIndicators.filter(fi => fi.status === "NON_COMPLIANT").length;
  const pending = total - assessed;

  // Group by standard
  const byStandard = facilityIndicators.reduce((acc, fi) => {
    const stdCode = fi.indicator.standard.code;
    if (!acc[stdCode]) {
      acc[stdCode] = { standard: fi.indicator.standard, items: [] };
    }
    acc[stdCode].items.push(fi);
    return acc;
  }, {} as Record<string, { standard: typeof facilityIndicators[0]["indicator"]["standard"]; items: typeof facilityIndicators }>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Self-Assessment</h1>
        <p className="text-gray-500 mt-1">{facility.name} · {FACILITY_CATEGORY_LABELS[facility.category]}</p>
      </div>

      {total === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <ClipboardList className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="font-medium text-amber-800">Compliance tracking not initialized</p>
          <p className="text-sm text-amber-600 mt-1">Ask your facility admin to initialize compliance tracking first.</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{total}</p>
              <p className="text-xs text-gray-500">Total Indicators</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{compliant}</p>
              <p className="text-xs text-gray-500">Compliant</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{nonCompliant}</p>
              <p className="text-xs text-gray-500">Non-Compliant</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{pending}</p>
              <p className="text-xs text-gray-500">Pending Assessment</p>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Assessment Progress</p>
              <p className="text-sm text-gray-500">{assessed}/{total} assessed ({total > 0 ? Math.round((assessed/total)*100) : 0}%)</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${total > 0 ? (assessed/total)*100 : 0}%` }} />
            </div>
          </div>

          {/* Assessment by Standard */}
          {Object.entries(byStandard).map(([code, { standard, items }]) => (
            <div key={code} className="bg-white rounded-lg shadow">
              <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{standard.title}</h3>
                  <p className="text-xs text-gray-400">{standard.section}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{items.filter(i => i.status !== "NOT_ASSESSED").length}/{items.length}</span>
                  {items.every(i => i.status === "COMPLIANT") && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map((fi) => (
                  <a key={fi.id} href={`/focal/assessment/${fi.id}`}
                    className="px-6 py-3 flex items-start justify-between gap-4 hover:bg-blue-50 cursor-pointer block">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{fi.indicator.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{fi.indicator.code} · {fi.indicator.frequency}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] rounded-full whitespace-nowrap ${
                      fi.status === "COMPLIANT" ? "bg-emerald-100 text-emerald-700" :
                      fi.status === "NON_COMPLIANT" ? "bg-red-100 text-red-700" :
                      fi.status === "PARTIALLY_COMPLIANT" ? "bg-amber-100 text-amber-700" :
                      fi.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {COMPLIANCE_STATUS_LABELS[fi.status]}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
EOFOCAL

# Assessment detail page (the actual questionnaire form)
mkdir -p "src/app/(dashboard)/focal/assessment/[id]"

cat > "src/app/(dashboard)/focal/assessment/[id]/page.tsx" << 'EOASSESS'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AssessmentForm from "./AssessmentForm";

export default async function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "MSDS_FOCAL") redirect("/login");
  const { id } = await params;

  const facilityIndicator = await prisma.facilityIndicator.findUnique({
    where: { id },
    include: {
      indicator: { include: { standard: true } },
      facility: { select: { id: true, name: true } },
    },
  });

  if (!facilityIndicator) redirect("/focal");

  // Get previous submissions
  const submissions = await prisma.indicatorSubmission.findMany({
    where: { indicatorId: facilityIndicator.indicatorId, facilityId: facilityIndicator.facilityId },
    orderBy: { submittedAt: "desc" },
    take: 5,
    include: { user: { select: { fullName: true } } },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/focal" className="text-sm text-blue-600 hover:underline">← Back to Assessment</a>
        <h1 className="text-xl font-bold text-gray-900 mt-2">{facilityIndicator.indicator.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {facilityIndicator.indicator.standard.title} · {facilityIndicator.indicator.code}
        </p>
      </div>

      {/* Indicator details */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Description</h3>
          <p className="text-sm text-gray-600 mt-1">{facilityIndicator.indicator.description}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Guidance</h3>
          <p className="text-sm text-gray-600 mt-1">{facilityIndicator.indicator.guidance}</p>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-500">Frequency: </span>
            <span className="font-medium">{facilityIndicator.indicator.frequency}</span>
          </div>
          <div>
            <span className="text-gray-500">Evidence Required: </span>
            <span className="font-medium">{facilityIndicator.indicator.requiresEvidence ? "Yes" : "No"}</span>
          </div>
        </div>
      </div>

      {/* Assessment Form */}
      <AssessmentForm
        facilityIndicatorId={facilityIndicator.id}
        indicatorId={facilityIndicator.indicatorId}
        facilityId={facilityIndicator.facilityId}
        currentStatus={facilityIndicator.status}
      />

      {/* Previous Submissions */}
      {submissions.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 text-sm">Submission History</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {submissions.map((sub) => (
              <div key={sub.id} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    sub.status === "COMPLIANT" ? "bg-emerald-100 text-emerald-700" :
                    sub.status === "NON_COMPLIANT" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>{sub.status}</span>
                  <span className="text-xs text-gray-400">{new Date(sub.submittedAt).toLocaleString()}</span>
                </div>
                {sub.notes && <p className="text-sm text-gray-600 mt-1">{sub.notes}</p>}
                <p className="text-xs text-gray-400 mt-1">By {sub.user.fullName}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
EOASSESS

cat > "src/app/(dashboard)/focal/assessment/[id]/AssessmentForm.tsx" << 'EOFORM'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  { value: "COMPLIANT", label: "Compliant", color: "border-emerald-500 bg-emerald-50 text-emerald-700" },
  { value: "PARTIALLY_COMPLIANT", label: "Partially Compliant", color: "border-amber-500 bg-amber-50 text-amber-700" },
  { value: "NON_COMPLIANT", label: "Non-Compliant", color: "border-red-500 bg-red-50 text-red-700" },
  { value: "IN_PROGRESS", label: "In Progress", color: "border-blue-500 bg-blue-50 text-blue-700" },
];

interface Props {
  facilityIndicatorId: string;
  indicatorId: string;
  facilityId: string;
  currentStatus: string;
}

export default function AssessmentForm({ facilityIndicatorId, indicatorId, facilityId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/compliance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityIndicatorId, indicatorId, facilityId, status, notes }),
      });
      if (res.ok) {
        setSuccess(true);
        setNotes("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="font-semibold text-gray-900">Submit Assessment</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Status</label>
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map((s) => (
            <button key={s.value} onClick={() => setStatus(s.value)}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                status === s.value ? s.color : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Observations</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          rows={4} placeholder="Describe the current state, actions taken, evidence collected..."
        />
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-lg">Assessment submitted successfully!</div>
      )}

      <button onClick={handleSubmit} disabled={loading || status === "NOT_ASSESSED"}
        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Submitting..." : "Submit Assessment"}
      </button>
    </div>
  );
}
EOFORM

# API: Submit assessment
mkdir -p src/app/api/compliance/submit
cat > src/app/api/compliance/submit/route.ts << 'EOSUBMIT'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { facilityIndicatorId, indicatorId, facilityId, status, notes } = await req.json();

  // Update facility indicator status
  await prisma.facilityIndicator.update({
    where: { id: facilityIndicatorId },
    data: {
      status,
      lastAssessedAt: new Date(),
      notes,
    },
  });

  // Create submission record
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  await prisma.indicatorSubmission.create({
    data: {
      value: status,
      notes,
      status,
      period,
      indicatorId,
      facilityId,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
EOSUBMIT

echo "✓ Self-assessment questionnaire"

# ─────────────────────────────────────────────────
# 5. CONSULTANT DASHBOARD
# ─────────────────────────────────────────────────
echo "▶ Creating Consultant dashboard..."

mkdir -p "src/app/(dashboard)/consultant"

cat > "src/app/(dashboard)/consultant/page.tsx" << 'EOCONS'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS, COMPLIANCE_STATUS_LABELS } from "@/lib/constants";
import { Building2, ClipboardList, FileCheck } from "lucide-react";

export default async function ConsultantDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CONSULTANT") redirect("/login");

  const assignments = await prisma.consultantAssignment.findMany({
    where: { consultantId: session.user.id, status: "active" },
    include: {
      facility: {
        include: {
          _count: { select: { facilityIndicators: true, submissions: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get compliance stats for all assigned facilities
  const facilityIds = assignments.map(a => a.facilityId);
  const complianceData = facilityIds.length > 0 ? await prisma.facilityIndicator.groupBy({
    by: ["facilityId", "status"],
    where: { facilityId: { in: facilityIds } },
    _count: true,
  }) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Consultant Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome, {session.user.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Assigned Facilities</p>
              <p className="text-2xl font-bold text-blue-600">{assignments.length}</p>
            </div>
            <Building2 className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Indicators</p>
              <p className="text-2xl font-bold text-indigo-600">
                {assignments.reduce((sum, a) => sum + a.facility._count.facilityIndicators, 0)}
              </p>
            </div>
            <ClipboardList className="w-8 h-8 text-indigo-200" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Submissions</p>
              <p className="text-2xl font-bold text-emerald-600">
                {assignments.reduce((sum, a) => sum + a.facility._count.submissions, 0)}
              </p>
            </div>
            <FileCheck className="w-8 h-8 text-emerald-200" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Assigned Facilities</h2>
        </div>
        {assignments.length === 0 ? (
          <p className="px-6 py-8 text-gray-400 text-center">No facilities assigned yet. The RegX admin will assign facilities to you.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {assignments.map((a) => {
              const fData = complianceData.filter(c => c.facilityId === a.facilityId);
              const total = fData.reduce((sum, c) => sum + c._count, 0);
              const compliant = fData.find(c => c.status === "COMPLIANT")?._count || 0;
              const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;

              return (
                <a key={a.id} href={`/consultant/facilities/${a.facilityId}`}
                  className="px-6 py-4 flex items-center justify-between hover:bg-blue-50 block">
                  <div>
                    <p className="font-medium text-gray-900">{a.facility.name}</p>
                    <p className="text-sm text-gray-500">{FACILITY_CATEGORY_LABELS[a.facility.category]} · {a.facility.city}</p>
                    <p className="text-xs text-gray-400">Assigned: {new Date(a.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{pct}%</p>
                    <p className="text-xs text-gray-400">Compliance</p>
                    <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div className={`h-1.5 rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
EOCONS

# Consultant facility detail page
mkdir -p "src/app/(dashboard)/consultant/facilities/[id]"

cat > "src/app/(dashboard)/consultant/facilities/[id]/page.tsx" << 'EOCONSF'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS, COMPLIANCE_STATUS_LABELS } from "@/lib/constants";

export default async function ConsultantFacilityPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CONSULTANT") redirect("/login");
  const { id } = await params;

  // Verify consultant is assigned
  const assignment = await prisma.consultantAssignment.findFirst({
    where: { consultantId: session.user.id, facilityId: id, status: "active" },
  });
  if (!assignment) redirect("/consultant");

  const facility = await prisma.facility.findUnique({
    where: { id },
    include: {
      facilityIndicators: {
        include: { indicator: { include: { standard: true } } },
        orderBy: { indicator: { code: "asc" } },
      },
    },
  });

  if (!facility) redirect("/consultant");

  const total = facility.facilityIndicators.length;
  const compliant = facility.facilityIndicators.filter(fi => fi.status === "COMPLIANT").length;
  const nonCompliant = facility.facilityIndicators.filter(fi => fi.status === "NON_COMPLIANT").length;
  const notAssessed = facility.facilityIndicators.filter(fi => fi.status === "NOT_ASSESSED").length;

  // Group by standard
  const byStandard = facility.facilityIndicators.reduce((acc, fi) => {
    const stdCode = fi.indicator.standard.code;
    if (!acc[stdCode]) acc[stdCode] = { standard: fi.indicator.standard, items: [] };
    acc[stdCode].items.push(fi);
    return acc;
  }, {} as Record<string, { standard: { code: string; title: string; section: string | null }; items: typeof facility.facilityIndicators }>);

  return (
    <div className="space-y-6">
      <div>
        <a href="/consultant" className="text-sm text-blue-600 hover:underline">← Back to Dashboard</a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{facility.name}</h1>
        <p className="text-gray-500">{FACILITY_CATEGORY_LABELS[facility.category]} · {facility.city}, {facility.district}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{compliant}</p>
          <p className="text-xs text-gray-500">Compliant</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{nonCompliant}</p>
          <p className="text-xs text-gray-500">Non-Compliant</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{notAssessed}</p>
          <p className="text-xs text-gray-500">Not Assessed</p>
        </div>
      </div>

      {Object.entries(byStandard).map(([code, { standard, items }]) => (
        <div key={code} className="bg-white rounded-lg shadow">
          <div className="px-6 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">{standard.title}</h3>
            <p className="text-xs text-gray-400">{standard.section}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map((fi) => (
              <div key={fi.id} className="px-6 py-3 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{fi.indicator.title}</p>
                  <p className="text-xs text-gray-400">{fi.indicator.code} · {fi.indicator.frequency}</p>
                  {fi.notes && <p className="text-xs text-gray-500 mt-1 italic">{fi.notes}</p>}
                </div>
                <span className={`px-2 py-0.5 text-[10px] rounded-full whitespace-nowrap ${
                  fi.status === "COMPLIANT" ? "bg-emerald-100 text-emerald-700" :
                  fi.status === "NON_COMPLIANT" ? "bg-red-100 text-red-700" :
                  fi.status === "PARTIALLY_COMPLIANT" ? "bg-amber-100 text-amber-700" :
                  fi.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-500"
                }`}>{COMPLIANCE_STATUS_LABELS[fi.status]}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
EOCONSF

echo "✓ Consultant dashboard"

# ─────────────────────────────────────────────────
# 6. UPDATE MIDDLEWARE FOR NEW ROUTES
# ─────────────────────────────────────────────────
echo "▶ Updating auth config for new routes..."

cat > src/lib/auth.config.ts << 'EOAUTH'
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const publicRoutes = ["/", "/login", "/register", "/api/register"];
      const isPublicRoute = publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
      );
      if (isPublicRoute) return true;
      if (!isLoggedIn) return false;
      return true;
    },
  },
  providers: [],
};
EOAUTH

echo "✓ Auth config updated (added /register to public routes)"

# ─────────────────────────────────────────────────
# 7. UPDATE MSDS CATEGORY MAPPING FOR SEEDED DATA
# ─────────────────────────────────────────────────
echo "▶ Fixing MSDS category mappings in database..."

psql "postgresql://phc_admin:PhcMsds2026Secure@localhost:5432/phc_db" <<'EOSQL'
-- Update Dialysis standards to use DIALYSIS category
UPDATE "MsdsStandard" SET category = 'DIALYSIS' WHERE code LIKE 'DLY-%';
-- Update Psychiatric standards to use PSYCHIATRIC category
UPDATE "MsdsStandard" SET category = 'PSYCHIATRIC' WHERE code LIKE 'PSY-%';
-- Update IVF standards to use IVF_FERTILITY category
UPDATE "MsdsStandard" SET category = 'IVF_FERTILITY' WHERE code LIKE 'IVF-%';

-- Verify
SELECT category, COUNT(*) as standards FROM "MsdsStandard" GROUP BY category ORDER BY category;
EOSQL

echo "✓ MSDS categories fixed"

# ─────────────────────────────────────────────────
# 8. BUILD AND RESTART
# ─────────────────────────────────────────────────
echo ""
echo "▶ Building and restarting..."
pm2 stop phc 2>/dev/null || true
rm -rf .next
NODE_OPTIONS="--max-old-space-size=384" pnpm build && pm2 restart phc

echo ""
echo "═══════════════════════════════════════"
echo "✅ PHASE 3 DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════"
echo ""
echo "New features:"
echo "  ✓ Facility approval detail page (approve/reject/suspend)"
echo "  ✓ Admin dashboard with category-specific standards"
echo "  ✓ Admin compliance initialization"
echo "  ✓ Focal person self-assessment questionnaire"
echo "  ✓ Assessment submission with history tracking"
echo "  ✓ Consultant dashboard with assigned facilities"
echo "  ✓ Consultant facility compliance view"
echo "  ✓ MSDS categories mapped correctly (DIALYSIS, PSYCHIATRIC, IVF)"
echo "  ✓ Registration page now public (no auth required)"
echo ""
echo "Workflows enabled:"
echo "  1. Admin registers → RegX reviews at /regx/approvals/[id] → Approve/Reject"
echo "  2. Admin sees standards for their category → Initializes compliance"
echo "  3. Focal person opens assessment → Picks indicator → Submits status + notes"
echo "  4. Consultant logs in → Sees assigned facilities → Views compliance detail"
echo "═══════════════════════════════════════"
