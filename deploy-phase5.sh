#!/bin/bash
# ══════════════════════════════════════════════════════════════════
# PHC MSDS - PHASE 5 DEPLOYMENT
# ══════════════════════════════════════════════════════════════════
# 1. File upload infrastructure (photos + documents)
# 2. Drill conduction with photo evidence
# 3. Evidence upload on assessments
# 4. Training enrollment + payment flow
# 5. RegX: Create consultant accounts + assign to facilities
# ══════════════════════════════════════════════════════════════════
set -e
cd /var/www/phc

echo "═══════════════════════════════════════"
echo "PHC MSDS Phase 5 Deployment"
echo "═══════════════════════════════════════"

# ─── 1. FILE UPLOAD INFRASTRUCTURE ───
echo "▶ Step 1: Setting up file upload infrastructure..."

mkdir -p public/uploads/evidence public/uploads/drills public/uploads/documents
chmod -R 755 public/uploads

# Upload API route (handles all file types)
mkdir -p src/app/api/upload
cat > src/app/api/upload/route.ts << 'UPLOAD_API'
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "documents";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${timestamp}_${safeName}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);

  return NextResponse.json({
    fileName: file.name,
    filePath: `/uploads/${folder}/${fileName}`,
    fileSize: buffer.length,
    fileType: file.type,
  });
}
UPLOAD_API

echo "✓ Upload infrastructure ready"

# ─── 2. DRILL CONDUCTION PAGES ───
echo "▶ Step 2: Building drill conduction system..."

# Admin Drills list page
mkdir -p "src/app/(dashboard)/admin/drills"
cat > "src/app/(dashboard)/admin/drills/page.tsx" << 'DRILLS_LIST'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DrillsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  const facility = await prisma.facility.findFirst({ where: { adminId: session.user.id } });
  if (!facility) redirect("/admin");

  const drills = await prisma.drillRecord.findMany({
    where: { facilityId: facility.id },
    orderBy: { conductedAt: "desc" },
    include: { user: { select: { fullName: true } }, photos: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drill Records</h1>
          <p className="text-gray-500 mt-1">{drills.length} drills conducted</p>
        </div>
        <Link href="/admin/drills/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          + Record New Drill
        </Link>
      </div>

      <div className="space-y-4">
        {drills.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
            No drill records yet. Record your first drill to track compliance.
          </div>
        ) : drills.map((d) => (
          <div key={d.id} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{d.title}</h3>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">{d.type}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{d.description.substring(0, 150)}...</p>
                <div className="flex gap-4 text-xs text-gray-400 mt-2">
                  <span>Date: {new Date(d.conductedAt).toLocaleDateString()}</span>
                  <span>Participants: {d.participants}</span>
                  <span>By: {d.user.fullName}</span>
                  <span>Photos: {d.photos.length}</span>
                </div>
              </div>
              <Link href={`/admin/drills/${d.id}`} className="text-sm text-blue-600 hover:underline">View</Link>
            </div>
            {d.photos.length > 0 && (
              <div className="flex gap-2 mt-3">
                {d.photos.slice(0, 4).map((p) => (
                  <img key={p.id} src={p.filePath} alt={p.caption || "Drill photo"} className="w-16 h-16 object-cover rounded border" />
                ))}
                {d.photos.length > 4 && <span className="text-xs text-gray-400 self-center">+{d.photos.length - 4} more</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
DRILLS_LIST

# New Drill form
mkdir -p "src/app/(dashboard)/admin/drills/new"
cat > "src/app/(dashboard)/admin/drills/new/page.tsx" << 'DRILL_NEW'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DrillForm from "./DrillForm";

export default async function NewDrillPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  const facility = await prisma.facility.findFirst({ where: { adminId: session.user.id } });
  if (!facility) redirect("/admin");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/admin/drills" className="text-sm text-blue-600 hover:underline">← Back to Drills</a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Record New Drill</h1>
      </div>
      <DrillForm facilityId={facility.id} />
    </div>
  );
}
DRILL_NEW

cat > "src/app/(dashboard)/admin/drills/new/DrillForm.tsx" << 'DRILL_FORM'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DRILL_TYPES = ["Fire Drill", "Evacuation Drill", "Code Blue", "Infection Control", "Disaster Response", "Chemical Spill", "Other"];

export default function DrillForm({ facilityId }: { facilityId: string }) {
  const [form, setForm] = useState({ type: "", title: "", description: "", conductedAt: "", participants: "", outcome: "", observations: "" });
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Upload photos first
      const uploadedPhotos: { filePath: string; caption: string }[] = [];
      for (const photo of photos) {
        const fd = new FormData();
        fd.append("file", photo);
        fd.append("folder", "drills");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          uploadedPhotos.push({ filePath: data.filePath, caption: photo.name });
        }
      }

      // 2. Create drill record
      const res = await fetch("/api/drills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, facilityId, participants: parseInt(form.participants) || 0, photos: uploadedPhotos }),
      });

      if (!res.ok) throw new Error("Failed to create drill record");
      router.push("/admin/drills");
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Drill Type *</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass} required>
            <option value="">Select type...</option>
            {DRILL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Conducted *</label>
          <input type="datetime-local" value={form.conductedAt} onChange={(e) => setForm({ ...form, conductedAt: e.target.value })} className={inputClass} required />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} required placeholder="e.g., Monthly Fire Drill - Building A" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} rows={3} required placeholder="Describe what was done during the drill..." />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Participants Count *</label>
        <input type="number" value={form.participants} onChange={(e) => setForm({ ...form, participants: e.target.value })} className={inputClass} required />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
        <textarea value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} className={inputClass} rows={2} placeholder="Drill outcome and results..." />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Observations / Issues Found</label>
        <textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} className={inputClass} rows={2} placeholder="Any issues, delays, or areas for improvement..." />
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Photo Evidence</label>
        <input type="file" multiple accept="image/*" onChange={(e) => setPhotos(Array.from(e.target.files || []))}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        {photos.length > 0 && (
          <div className="flex gap-2 mt-2">
            {photos.map((p, i) => (
              <div key={i} className="relative">
                <img src={URL.createObjectURL(p)} alt="" className="w-16 h-16 object-cover rounded border" />
                <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Saving..." : "Save Drill Record"}
      </button>
    </form>
  );
}
DRILL_FORM

# Drill detail page
mkdir -p "src/app/(dashboard)/admin/drills/[id]"
cat > "src/app/(dashboard)/admin/drills/[id]/page.tsx" << 'DRILL_DETAIL'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DrillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  const { id } = await params;

  const drill = await prisma.drillRecord.findUnique({
    where: { id },
    include: { user: { select: { fullName: true } }, photos: true },
  });
  if (!drill) redirect("/admin/drills");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/admin/drills" className="text-sm text-blue-600 hover:underline">← Back to Drills</a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{drill.title}</h1>
        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">{drill.type}</span>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><p className="text-gray-500">Date</p><p className="font-medium">{new Date(drill.conductedAt).toLocaleString()}</p></div>
          <div><p className="text-gray-500">Participants</p><p className="font-medium">{drill.participants}</p></div>
          <div><p className="text-gray-500">Recorded By</p><p className="font-medium">{drill.user.fullName}</p></div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700">Description</h3>
          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{drill.description}</p>
        </div>

        {drill.outcome && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Outcome</h3>
            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{drill.outcome}</p>
          </div>
        )}

        {drill.observations && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Observations</h3>
            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{drill.observations}</p>
          </div>
        )}
      </div>

      {drill.photos.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Photo Evidence ({drill.photos.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {drill.photos.map((p) => (
              <div key={p.id} className="relative group">
                <img src={p.filePath} alt={p.caption || "Drill photo"} className="w-full h-40 object-cover rounded-lg border" />
                {p.caption && <p className="text-xs text-gray-500 mt-1 truncate">{p.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
DRILL_DETAIL

# Drills API
mkdir -p src/app/api/drills
cat > src/app/api/drills/route.ts << 'DRILLS_API'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const drill = await prisma.drillRecord.create({
    data: {
      type: body.type,
      title: body.title,
      description: body.description,
      conductedAt: new Date(body.conductedAt),
      participants: body.participants,
      outcome: body.outcome || null,
      observations: body.observations || null,
      facilityId: body.facilityId,
      userId: session.user.id,
      photos: {
        create: (body.photos || []).map((p: { filePath: string; caption: string }) => ({
          filePath: p.filePath,
          caption: p.caption,
        })),
      },
    },
  });

  return NextResponse.json(drill, { status: 201 });
}
DRILLS_API

echo "✓ Drill conduction system"

# ─── 3. EVIDENCE UPLOAD ON ASSESSMENTS ───
echo "▶ Step 3: Adding evidence upload to assessments..."

# Replace assessment form with evidence upload support
cat > "src/app/(dashboard)/focal/assessment/[id]/AssessmentForm.tsx" << 'ASSESS_FORM'
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
ASSESS_FORM

# Update assessment page to pass requiresEvidence
cat > "src/app/(dashboard)/focal/assessment/[id]/page.tsx" << 'ASSESS_PAGE'
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
ASSESS_PAGE

# Update submit API to handle evidence
cat > src/app/api/compliance/submit/route.ts << 'SUBMIT_API'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { facilityIndicatorId, indicatorId, facilityId, status, notes, evidence } = await req.json();

  await prisma.facilityIndicator.update({
    where: { id: facilityIndicatorId },
    data: { status, lastAssessedAt: new Date(), notes },
  });

  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const submission = await prisma.indicatorSubmission.create({
    data: {
      value: status,
      notes,
      status,
      period,
      indicatorId,
      facilityId,
      userId: session.user.id,
      evidence: {
        create: (evidence || []).map((e: { fileName: string; filePath: string; fileSize: number; fileType: string }) => ({
          fileName: e.fileName,
          filePath: e.filePath,
          fileSize: e.fileSize,
          fileType: e.fileType,
        })),
      },
    },
  });

  return NextResponse.json({ success: true, submission });
}
SUBMIT_API

echo "✓ Evidence upload on assessments"

# ─── 4. TRAINING ENROLLMENT + PAYMENT ───
echo "▶ Step 4: Building training enrollment with payment..."

# Training enrollment API
mkdir -p src/app/api/trainings/enroll
cat > src/app/api/trainings/enroll/route.ts << 'ENROLL_API'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { trainingId, facilityId } = await req.json();

  const training = await prisma.training.findUnique({ where: { id: trainingId } });
  if (!training) return NextResponse.json({ error: "Training not found" }, { status: 404 });

  // Check capacity
  const enrolled = await prisma.trainingEnrollment.count({ where: { trainingId } });
  if (training.maxParticipants && enrolled >= training.maxParticipants) {
    return NextResponse.json({ error: "Training is full" }, { status: 400 });
  }

  // Create payment if fee > 0
  let paymentId: string | null = null;
  if (training.fee > 0) {
    const payment = await prisma.payment.create({
      data: {
        amount: training.fee,
        type: "TRAINING_FEE",
        status: "PENDING",
        description: `Training: ${training.title}`,
        facilityId: facilityId || null,
        userId: session.user.id,
      },
    });
    paymentId = payment.id;
  }

  const enrollment = await prisma.trainingEnrollment.create({
    data: {
      trainingId,
      userId: session.user.id,
      facilityId: facilityId || null,
      paymentId,
      status: training.fee > 0 ? "pending_payment" : "enrolled",
    },
  });

  return NextResponse.json({ enrollment, paymentId });
}
ENROLL_API

# Update admin trainings page with enrollment
cat > "src/app/(dashboard)/admin/trainings/page.tsx" << 'ADMIN_TRAIN'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EnrollButton from "./EnrollButton";

export default async function AdminTrainingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const facility = await prisma.facility.findFirst({ where: { adminId: session.user.id } });
  if (!facility) redirect("/admin");

  const trainings = await prisma.training.findMany({
    where: { status: { in: ["UPCOMING", "ONGOING"] } },
    orderBy: { scheduledAt: "asc" },
    include: { _count: { select: { enrollments: true } } },
  });

  const myEnrollments = await prisma.trainingEnrollment.findMany({
    where: { userId: session.user.id },
    select: { trainingId: true, status: true },
  });
  const enrolledIds = new Set(myEnrollments.map(e => e.trainingId));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Available Trainings</h1>
      <div className="grid gap-4">
        {trainings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">No upcoming trainings</div>
        ) : trainings.map((t) => (
          <div key={t.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{t.title}</h3>
                {t.description && <p className="text-sm text-gray-500 mt-1">{t.description.substring(0, 200)}</p>}
                <div className="flex gap-4 text-xs text-gray-400 mt-2">
                  <span>{new Date(t.scheduledAt).toLocaleDateString()}</span>
                  <span>{t.duration} min</span>
                  <span>{t.isOnline ? "Online" : t.location}</span>
                  <span>{t._count.enrollments}/{t.maxParticipants} enrolled</span>
                </div>
                <p className="text-sm font-medium mt-2">{t.fee > 0 ? `PKR ${t.fee.toLocaleString()}` : "Free"}</p>
              </div>
              <div>
                {enrolledIds.has(t.id) ? (
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs rounded-lg">Enrolled</span>
                ) : (
                  <EnrollButton trainingId={t.id} facilityId={facility.id} fee={t.fee} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
ADMIN_TRAIN

cat > "src/app/(dashboard)/admin/trainings/EnrollButton.tsx" << 'ENROLL_BTN'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EnrollButton({ trainingId, facilityId, fee }: { trainingId: string; facilityId: string; fee: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    if (fee > 0 && !confirm(`This training costs PKR ${fee.toLocaleString()}. A payment record will be created. Continue?`)) return;
    setLoading(true);
    await fetch("/api/trainings/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainingId, facilityId }),
    });
    router.refresh();
    setLoading(false);
  };

  return (
    <button onClick={handleEnroll} disabled={loading}
      className="px-4 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
      {loading ? "..." : fee > 0 ? `Enroll (PKR ${fee.toLocaleString()})` : "Enroll Free"}
    </button>
  );
}
ENROLL_BTN

echo "✓ Training enrollment with payment"

# ─── 5. CONSULTANT CREATION + ASSIGNMENT ───
echo "▶ Step 5: Building consultant management..."

# Create consultant API
mkdir -p src/app/api/consultants/create
cat > src/app/api/consultants/create/route.ts << 'CONS_CREATE'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { fullName, email, username, password, phone, specialization, experience, bio } = body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) return NextResponse.json({ error: "Email or username already taken" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      fullName, email, username, password: hashed, phone,
      role: "CONSULTANT",
      specialization, experience: experience ? parseInt(experience) : null, bio,
      approvalStatus: "APPROVED",
      isActive: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
CONS_CREATE

# Enhanced consultants page with create form + assignment
cat > "src/app/(dashboard)/regx/consultants/page.tsx" << 'CONS_PAGE'
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS } from "@/lib/constants";
import Link from "next/link";
import ConsultantManager from "./ConsultantManager";

export default async function ConsultantsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const [consultants, facilities, assignments] = await Promise.all([
    prisma.user.findMany({ where: { role: "CONSULTANT" }, orderBy: { createdAt: "desc" } }),
    prisma.facility.findMany({ where: { approvalStatus: "APPROVED", isActive: true }, select: { id: true, name: true, category: true }, orderBy: { name: "asc" } }),
    prisma.consultantAssignment.findMany({
      where: { status: "active" },
      include: {
        consultant: { select: { fullName: true, specialization: true } },
        facility: { select: { name: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Consultant Management</h1>

      <ConsultantManager
        consultants={JSON.parse(JSON.stringify(consultants))}
        facilities={JSON.parse(JSON.stringify(facilities))}
        assignments={JSON.parse(JSON.stringify(assignments))}
      />
    </div>
  );
}
CONS_PAGE

cat > "src/app/(dashboard)/regx/consultants/ConsultantManager.tsx" << 'CONS_MGR'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Consultant { id: string; fullName: string; email: string; specialization: string | null; experience: number | null; approvalStatus: string; }
interface Facility { id: string; name: string; category: string; }
interface Assignment { id: string; consultant: { fullName: string; specialization: string | null }; facility: { name: string; category: string }; startDate: string; }

export default function ConsultantManager({ consultants, facilities, assignments }: {
  consultants: Consultant[]; facilities: Facility[]; assignments: Assignment[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", username: "", password: "", phone: "", specialization: "", experience: "", bio: "" });
  const [assignForm, setAssignForm] = useState({ consultantId: "", facilityId: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  const handleCreate = async () => {
    setLoading(true); setMsg("");
    const res = await fetch("/api/consultants/create", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) { setMsg("Consultant created!"); setShowCreate(false); setForm({ fullName: "", email: "", username: "", password: "", phone: "", specialization: "", experience: "", bio: "" }); router.refresh(); }
    else setMsg(data.error);
    setLoading(false);
  };

  const handleAssign = async () => {
    setLoading(true); setMsg("");
    const res = await fetch("/api/consultants/assign", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(assignForm),
    });
    if (res.ok) { setMsg("Assigned!"); setShowAssign(false); router.refresh(); }
    setLoading(false);
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm";

  return (
    <>
      {msg && <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg">{msg}</div>}

      <div className="flex gap-3">
        <button onClick={() => { setShowCreate(!showCreate); setShowAssign(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ New Consultant</button>
        <button onClick={() => { setShowAssign(!showAssign); setShowCreate(false); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Assign to Facility</button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          <h3 className="font-semibold">Create Consultant Account</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Full Name *" value={form.fullName} onChange={(e) => setForm({...form, fullName: e.target.value})} className={inputClass} />
            <input placeholder="Email *" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className={inputClass} />
            <input placeholder="Username *" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} className={inputClass} />
            <input placeholder="Password *" type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className={inputClass} />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className={inputClass} />
            <input placeholder="Specialization" value={form.specialization} onChange={(e) => setForm({...form, specialization: e.target.value})} className={inputClass} />
            <input placeholder="Years Experience" type="number" value={form.experience} onChange={(e) => setForm({...form, experience: e.target.value})} className={inputClass} />
          </div>
          <textarea placeholder="Bio" value={form.bio} onChange={(e) => setForm({...form, bio: e.target.value})} className={inputClass} rows={2} />
          <button onClick={handleCreate} disabled={loading || !form.fullName || !form.email || !form.username || !form.password}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">{loading ? "Creating..." : "Create"}</button>
        </div>
      )}

      {showAssign && (
        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          <h3 className="font-semibold">Assign Consultant to Facility</h3>
          <select value={assignForm.consultantId} onChange={(e) => setAssignForm({...assignForm, consultantId: e.target.value})} className={inputClass}>
            <option value="">Select Consultant...</option>
            {consultants.map(c => <option key={c.id} value={c.id}>{c.fullName} — {c.specialization || "General"}</option>)}
          </select>
          <select value={assignForm.facilityId} onChange={(e) => setAssignForm({...assignForm, facilityId: e.target.value})} className={inputClass}>
            <option value="">Select Facility...</option>
            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <textarea placeholder="Notes" value={assignForm.notes} onChange={(e) => setAssignForm({...assignForm, notes: e.target.value})} className={inputClass} rows={2} />
          <button onClick={handleAssign} disabled={loading || !assignForm.consultantId || !assignForm.facilityId}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm disabled:opacity-50">{loading ? "Assigning..." : "Assign"}</button>
        </div>
      )}

      {/* Consultant List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b"><h2 className="font-semibold">Consultants ({consultants.length})</h2></div>
        <div className="divide-y divide-gray-100">
          {consultants.map((c) => (
            <div key={c.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">{c.fullName}</p>
                <p className="text-xs text-gray-500">{c.email} · {c.specialization || "General"} · {c.experience ? `${c.experience} yrs` : ""}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${c.approvalStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{c.approvalStatus}</span>
            </div>
          ))}
          {consultants.length === 0 && <p className="px-6 py-4 text-gray-400 text-center text-sm">No consultants</p>}
        </div>
      </div>

      {/* Assignments */}
      {assignments.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b"><h2 className="font-semibold">Active Assignments ({assignments.length})</h2></div>
          <div className="divide-y divide-gray-100">
            {assignments.map((a) => (
              <div key={a.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.consultant.fullName}</p>
                  <p className="text-xs text-gray-500">{a.consultant.specialization}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">{a.facility.name}</p>
                  <p className="text-xs text-gray-400">Since {new Date(a.startDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
CONS_MGR

echo "✓ Consultant creation & assignment"

# ─── 6. ADD DRILLS LINK TO SIDEBAR ───
echo "▶ Step 6: Updating sidebar..."

# Add Drills to Admin nav
sed -i '/{ label: "Compliance", href: "\/admin\/compliance", icon: FileCheck },/a\    { label: "Drills", href: "/admin/drills", icon: ClipboardList },' src/components/Sidebar.tsx

echo "✓ Sidebar updated"

# ─── 7. NEXT.JS CONFIG FOR FILE UPLOADS ───
echo "▶ Step 7: Configuring Next.js for uploads..."

# Increase body size limit for file uploads
cat > next.config.ts << 'NEXTCONF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
NEXTCONF

echo "✓ Next.js config updated"

# ─── 8. BUILD ───
echo ""
echo "▶ Step 8: Building..."
pm2 stop phc 2>/dev/null || true
rm -rf .next
NODE_OPTIONS="--max-old-space-size=384" pnpm build && pm2 restart phc

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ PHASE 5 DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "NEW FEATURES:"
echo ""
echo "  1. FILE UPLOAD SYSTEM"
echo "     API: POST /api/upload (multipart/form-data)"
echo "     Supports: images, PDFs, documents"
echo "     Storage: public/uploads/{evidence,drills,documents}"
echo ""
echo "  2. DRILL CONDUCTION"
echo "     /admin/drills       - List all drills"
echo "     /admin/drills/new   - Record new drill with photos"
echo "     /admin/drills/[id]  - View drill detail + photos"
echo "     API: POST /api/drills"
echo "     Types: Fire, Evacuation, Code Blue, Infection Control, etc."
echo ""
echo "  3. EVIDENCE ON ASSESSMENTS"
echo "     /focal/assessment/[id] - Now has file upload"
echo "     Files linked to submissions in Evidence table"
echo "     Required evidence enforced when indicator demands it"
echo ""
echo "  4. TRAINING ENROLLMENT + PAYMENT"
echo "     /admin/trainings - Shows available trainings with Enroll button"
echo "     API: POST /api/trainings/enroll"
echo "     Auto-creates Payment record for paid trainings"
echo ""
echo "  5. CONSULTANT MANAGEMENT"
echo "     /regx/consultants - Create accounts + assign to facilities"
echo "     API: POST /api/consultants/create"
echo "     API: POST /api/consultants/assign"
echo "     Full form: name, email, username, password, specialization"
echo "═══════════════════════════════════════════════════"
