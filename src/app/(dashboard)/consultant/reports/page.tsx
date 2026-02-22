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
