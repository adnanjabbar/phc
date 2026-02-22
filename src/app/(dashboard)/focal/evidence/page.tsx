import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function EvidencePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "MSDS_FOCAL") redirect("/login");

  const submissions = await prisma.indicatorSubmission.findMany({
    where: { userId: session.user.id },
    orderBy: { submittedAt: "desc" },
    take: 50,
    include: {
      indicator: { select: { title: true, code: true } },
      evidence: true,
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Evidence & Submissions</h1>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {submissions.length === 0 ? (
          <p className="px-6 py-8 text-gray-400 text-center">No submissions yet. Complete assessments to see them here.</p>
        ) : submissions.map((s) => (
          <div key={s.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{s.indicator.title}</p>
                <p className="text-xs text-gray-400">{s.indicator.code} · {new Date(s.submittedAt).toLocaleString()}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                s.status === "COMPLIANT" ? "bg-emerald-100 text-emerald-700" :
                s.status === "NON_COMPLIANT" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
              }`}>{s.status}</span>
            </div>
            {s.notes && <p className="text-sm text-gray-600 mt-2">{s.notes}</p>}
            {s.evidence.length > 0 && (
              <div className="mt-2 flex gap-2">
                {s.evidence.map((e) => (
                  <span key={e.id} className="text-xs bg-gray-100 px-2 py-1 rounded">{e.fileName}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
