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
