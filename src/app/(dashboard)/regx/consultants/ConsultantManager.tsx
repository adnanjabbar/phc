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
