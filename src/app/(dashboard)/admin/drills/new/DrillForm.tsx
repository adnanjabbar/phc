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
