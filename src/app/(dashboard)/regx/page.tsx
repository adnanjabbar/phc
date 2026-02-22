import Link from "next/link";
import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS } from "@/lib/constants";
import { Building2, Users, CreditCard, ClipboardList, UserCheck, GraduationCap, AlertTriangle } from "lucide-react";

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
            <Link href="/regx/approvals" className="text-xs text-amber-600 hover:underline">Review now →</Link>
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
            <Link href="/regx/approvals" className="text-sm text-blue-600 hover:underline">View all →</Link>
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
