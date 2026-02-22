"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  { value: "COMPLIANT", label: "Compliant", color: "border-emerald-500 bg-emerald-50 text-emerald-700" },
  { value: "PARTIALLY_COMPLIANT", label: "Partially Compliant", color: "border-amber-500 bg-amber-50 text-amber-700" },
  { value: "NON_COMPLIANT", label: "Non-Compliant", color: "border-red-500 bg-red-50 text-red-700" },
  { value: "IN_PROGRESS", label: "In Progress", color: "border-blue-500 bg-blue-50 text-blue-700" },
];

interface Props {
  facilityIndicatorId: string;
  indicatorId: string;
  facilityId: string;
  currentStatus: string;
  requiresEvidence: boolean;
}

export default function AssessmentForm({ facilityIndicatorId, indicatorId, facilityId, currentStatus, requiresEvidence }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      // Upload files first
      const uploadedFiles: { fileName: string; filePath: string; fileSize: number; fileType: string }[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "evidence");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (uploadRes.ok) {
          uploadedFiles.push(await uploadRes.json());
        }
      }

      // Submit assessment
      const res = await fetch("/api/compliance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityIndicatorId, indicatorId, facilityId, status, notes, evidence: uploadedFiles }),
      });

      if (res.ok) {
        setSuccess(true);
        setNotes("");
        setFiles([]);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="font-semibold text-gray-900">Submit Assessment</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Status</label>
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map((s) => (
            <button key={s.value} type="button" onClick={() => setStatus(s.value)}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                status === s.value ? s.color : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Observations</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          rows={4} placeholder="Describe the current state, actions taken, evidence collected..." />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Evidence Upload {requiresEvidence && <span className="text-red-500">*</span>}
        </label>
        <input type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        {files.length > 0 && (
          <div className="mt-2 space-y-1">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded text-sm">
                <span className="text-gray-700 truncate">{f.name}</span>
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-red-500 text-xs ml-2">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {success && <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-lg">Assessment submitted successfully!</div>}

      <button type="button" onClick={handleSubmit}
        disabled={loading || status === "NOT_ASSESSED" || (requiresEvidence && files.length === 0)}
        className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Submitting..." : "Submit Assessment"}
      </button>
    </div>
  );
}
