import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS } from "@/lib/constants";
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
