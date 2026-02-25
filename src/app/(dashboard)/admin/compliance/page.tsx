import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMPLIANCE_STATUS_LABELS, INDICATOR_FREQUENCY_LABELS } from "@/lib/constants";
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

  const totalIndicators = standards.reduce((sum: number, standard) => sum + standard.indicators.length, 0);
  const assignedCount = standards.reduce(
    (sum: number, standard) =>
      sum + standard.indicators.filter((indicator) => indicator.facilityIndicators.length > 0).length,
    0
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
                    <p className="text-xs text-gray-400 mt-0.5">{ind.code} · {INDICATOR_FREQUENCY_LABELS[ind.frequency] ?? ind.frequency}{ind.requiresEvidence ? " · Evidence required" : ""}</p>
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
