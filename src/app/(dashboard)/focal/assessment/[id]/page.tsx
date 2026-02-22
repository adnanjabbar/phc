import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AssessmentForm from "./AssessmentForm";

export default async function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "MSDS_FOCAL") redirect("/login");
  const { id } = await params;

  const facilityIndicator = await prisma.facilityIndicator.findUnique({
    where: { id },
    include: {
      indicator: { include: { standard: true } },
      facility: { select: { id: true, name: true } },
    },
  });
  if (!facilityIndicator) redirect("/focal");

  const submissions = await prisma.indicatorSubmission.findMany({
    where: { indicatorId: facilityIndicator.indicatorId, facilityId: facilityIndicator.facilityId },
    orderBy: { submittedAt: "desc" },
    take: 5,
    include: { user: { select: { fullName: true } }, evidence: true },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/focal" className="text-sm text-blue-600 hover:underline">← Back to Assessment</a>
        <h1 className="text-xl font-bold text-gray-900 mt-2">{facilityIndicator.indicator.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{facilityIndicator.indicator.standard.title} · {facilityIndicator.indicator.code}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Description</h3>
          <p className="text-sm text-gray-600 mt-1">{facilityIndicator.indicator.description}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Guidance</h3>
          <p className="text-sm text-gray-600 mt-1">{facilityIndicator.indicator.guidance}</p>
        </div>
        <div className="flex gap-6 text-sm">
          <div><span className="text-gray-500">Frequency: </span><span className="font-medium">{facilityIndicator.indicator.frequency}</span></div>
          <div><span className="text-gray-500">Evidence Required: </span><span className="font-medium">{facilityIndicator.indicator.requiresEvidence ? "Yes" : "No"}</span></div>
        </div>
      </div>

      <AssessmentForm
        facilityIndicatorId={facilityIndicator.id}
        indicatorId={facilityIndicator.indicatorId}
        facilityId={facilityIndicator.facilityId}
        currentStatus={facilityIndicator.status}
        requiresEvidence={facilityIndicator.indicator.requiresEvidence}
      />

      {submissions.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 text-sm">Submission History</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {submissions.map((sub) => (
              <div key={sub.id} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    sub.status === "COMPLIANT" ? "bg-emerald-100 text-emerald-700" :
                    sub.status === "NON_COMPLIANT" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  }`}>{sub.status}</span>
                  <span className="text-xs text-gray-400">{new Date(sub.submittedAt).toLocaleString()}</span>
                </div>
                {sub.notes && <p className="text-sm text-gray-600 mt-1">{sub.notes}</p>}
                {sub.evidence.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {sub.evidence.map((e) => (
                      <a key={e.id} href={e.filePath} target="_blank" className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">
                        {e.fileName}
                      </a>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">By {sub.user.fullName}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
