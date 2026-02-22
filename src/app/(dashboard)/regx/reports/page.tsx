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
