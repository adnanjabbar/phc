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
