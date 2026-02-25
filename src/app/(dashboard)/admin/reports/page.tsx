import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMPLIANCE_STATUS_LABELS } from "@/lib/constants";
import { ReportDownloadButton } from "@/components/ReportDownloadButton";

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const facility = await prisma.facility.findFirst({ where: { adminId: session.user.id } });
  if (!facility) redirect("/admin");

  const stats = await prisma.facilityIndicator.groupBy({
    by: ["status"], where: { facilityId: facility.id }, _count: true,
  });

  const recentSubmissions = await prisma.indicatorSubmission.findMany({
    where: { facilityId: facility.id },
    orderBy: { submittedAt: "desc" },
    take: 20,
    include: { indicator: { select: { title: true, code: true } }, user: { select: { fullName: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Compliance Reports</h1>
        <ReportDownloadButton />
      </div>
      <div className="grid grid-cols-5 gap-3">
        {(["COMPLIANT", "NON_COMPLIANT", "PARTIALLY_COMPLIANT", "IN_PROGRESS", "NOT_ASSESSED"] as const).map((s) => (
          <div key={s} className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xl font-bold">{stats.find(x => x.status === s)?._count || 0}</p>
            <p className="text-[10px] text-gray-500">{COMPLIANCE_STATUS_LABELS[s]}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b"><h2 className="font-semibold">Recent Submissions</h2></div>
        <div className="divide-y divide-gray-50">
          {recentSubmissions.map((s) => (
            <div key={s.id} className="px-6 py-3 flex justify-between">
              <div>
                <p className="text-sm text-gray-900">{s.indicator.title}</p>
                <p className="text-xs text-gray-400">{s.indicator.code} · {s.user.fullName}</p>
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
          {recentSubmissions.length === 0 && <p className="px-6 py-4 text-gray-400 text-center text-sm">No submissions yet</p>}
        </div>
      </div>
    </div>
  );
}
