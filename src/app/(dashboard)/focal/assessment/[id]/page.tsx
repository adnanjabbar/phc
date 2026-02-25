import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUploadUrl } from "@/lib/upload";
import { INDICATOR_FREQUENCY_LABELS, FULFILLMENT_TIPS } from "@/lib/constants";
import { BookOpen, CheckCircle2, FileCheck } from "lucide-react";
import Link from "next/link";
import AssessmentForm from "./AssessmentForm";

function getFulfillmentTip(indicator: { title: string; description: string; guidance: string }): string {
  const text = `${indicator.title} ${indicator.description} ${indicator.guidance}`.toLowerCase();
  if (text.includes("drill") || text.includes("evacuation") || text.includes("fire")) return FULFILLMENT_TIPS.fire_drill;
  if (text.includes("infection") || text.includes("ipc") || text.includes("hygiene")) return FULFILLMENT_TIPS.infection_control;
  if (text.includes("policy") || text.includes("sop") || text.includes("register") || text.includes("document")) return FULFILLMENT_TIPS.documentation;
  if (text.includes("staff") || text.includes("personnel") || text.includes("roster")) return FULFILLMENT_TIPS.staffing;
  if (text.includes("equipment") || text.includes("calibration") || text.includes("maintenance")) return FULFILLMENT_TIPS.equipment;
  return FULFILLMENT_TIPS.default;
}

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

  const ind = facilityIndicator.indicator;
  const frequencyLabel = INDICATOR_FREQUENCY_LABELS[ind.frequency] ?? ind.frequency;
  const fulfillmentTip = getFulfillmentTip(ind);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/focal" className="text-sm text-blue-600 hover:underline">← Back to Assessment</Link>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">{ind.code}</span>
          <span className="text-xs text-gray-500">{ind.standard.title}</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mt-2">{ind.title}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
          <BookOpen className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600">Assess: <strong>{frequencyLabel}</strong></span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
          <FileCheck className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600">Evidence: <strong>{ind.requiresEvidence ? "Required" : "Optional"}</strong></span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            What this indicator means
          </h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-700 leading-relaxed">{ind.description}</p>
        </div>
      </div>

      <div className="bg-emerald-50/80 rounded-xl border border-emerald-100 overflow-hidden">
        <div className="bg-emerald-100/50 px-6 py-3 border-b border-emerald-100">
          <h2 className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            How to fulfill
          </h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-emerald-900 leading-relaxed">{ind.guidance}</p>
          <p className="text-xs text-emerald-800/90 pt-2 border-t border-emerald-200/80">{fulfillmentTip}</p>
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
                      <a key={e.id} href={getUploadUrl(e.filePath)} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">
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
