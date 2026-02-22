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
