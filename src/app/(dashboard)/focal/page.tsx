import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMPLIANCE_STATUS_LABELS, FACILITY_CATEGORY_LABELS } from "@/lib/constants";
import { ClipboardList, AlertTriangle, CheckCircle2 } from "lucide-react";

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
