import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMPLIANCE_STATUS_LABELS } from "@/lib/constants";
import { ReportDownloadButton } from "@/components/ReportDownloadButton";

export default async function FocalReportsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "MSDS_FOCAL") redirect("/login");

  const facilityId = session.user.facilityId;
  if (!facilityId) redirect("/focal");

  const stats = await prisma.facilityIndicator.groupBy({
    by: ["status"], where: { facilityId }, _count: true,
  });
  const total = stats.reduce((sum, s) => sum + s._count, 0);
  const compliant = stats.find(s => s.status === "COMPLIANT")?._count || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <ReportDownloadButton />
      </div>
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-4xl font-bold text-blue-600">{total > 0 ? Math.round((compliant/total)*100) : 0}%</p>
        <p className="text-gray-500 mt-2">Overall Compliance Score</p>
        <p className="text-xs text-gray-400">{compliant} of {total} indicators compliant</p>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {(["COMPLIANT", "NON_COMPLIANT", "PARTIALLY_COMPLIANT", "IN_PROGRESS", "NOT_ASSESSED"] as const).map((s) => (
          <div key={s} className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xl font-bold">{stats.find(x => x.status === s)?._count || 0}</p>
            <p className="text-[10px] text-gray-500">{COMPLIANCE_STATUS_LABELS[s]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
