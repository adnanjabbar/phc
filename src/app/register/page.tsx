"use client";
import { useState } from "react";

import Link from "next/link";

const CATEGORIES = [
  { value: "HOSPITAL_CAT_1", label: "Hospital (Cat-I, 50+ beds)" },
  { value: "HOSPITAL_CAT_2", label: "Hospital (Cat-II, 16-50 beds)" },
  { value: "HOSPITAL_CAT_3", label: "Hospital (Cat-III, up to 15 beds)" },
  { value: "DENTAL_CARE", label: "Dental Clinic" },
  { value: "FAMILY_MEDICINE", label: "GP / Family Medicine Clinic" },
  { value: "CLINICAL_LAB", label: "Clinical Laboratory" },
  { value: "DIAGNOSTIC_CENTER", label: "Diagnostic Center" },
  { value: "DIALYSIS", label: "Dialysis Facility" },
  { value: "PSYCHIATRIC", label: "Psychiatric / Addiction Treatment" },
  { value: "IVF_FERTILITY", label: "IVF / Fertility Centre" },
  { value: "MATERNITY_HOME", label: "Maternity Home" },
  { value: "EYE_HOSPITAL", label: "Eye Hospital" },
  { value: "BLOOD_BANK", label: "Blood Bank" },
  { value: "BHU", label: "Basic Health Unit (BHU)" },
  { value: "COLLECTION_CENTER", label: "Collection Centre" },
  { value: "HOMEOPATHIC", label: "Homeopathic Clinic" },
  { value: "RADIOLOGICAL", label: "Radiological Diagnostic Centre" },
  { value: "OTHER", label: "Other" },
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  

  const [form, setForm] = useState({
    facilityName: "", category: "", registrationNo: "", address: "",
    city: "", district: "", phone: "", email: "", bedCount: "",
    adminName: "", adminEmail: "", adminUsername: "", adminPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
          <p className="text-gray-500 mb-6">Your facility registration has been submitted for review. The RegX admin will review and approve your account.</p>
          <Link href="/login" className="text-blue-600 hover:underline text-sm">Go to Login</Link>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Register Your Facility</h1>
          <p className="text-gray-500 text-sm mt-1">PHC MSDS Compliance Platform</p>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2].map((s) => (
              <div key={s} className={`w-20 h-1 rounded-full ${step >= s ? "bg-blue-600" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Facility Information</h3>
              <div><label className={labelClass}>Facility Name *</label><input name="facilityName" value={form.facilityName} onChange={handleChange} className={inputClass} required /></div>
              <div><label className={labelClass}>Category *</label>
                <select name="category" value={form.category} onChange={handleChange} className={inputClass} required>
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>PHC Registration No. *</label><input name="registrationNo" value={form.registrationNo} onChange={handleChange} className={inputClass} required /></div>
                <div><label className={labelClass}>Bed Count</label><input name="bedCount" type="number" value={form.bedCount} onChange={handleChange} className={inputClass} /></div>
              </div>
              <div><label className={labelClass}>Address *</label><input name="address" value={form.address} onChange={handleChange} className={inputClass} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>City *</label><input name="city" value={form.city} onChange={handleChange} className={inputClass} required /></div>
                <div><label className={labelClass}>District *</label><input name="district" value={form.district} onChange={handleChange} className={inputClass} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Phone</label><input name="phone" value={form.phone} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Email</label><input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} /></div>
              </div>
              <button type="button" onClick={() => setStep(2)} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                Next: Admin Account →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Admin Account</h3>
              <div><label className={labelClass}>Full Name *</label><input name="adminName" value={form.adminName} onChange={handleChange} className={inputClass} required /></div>
              <div><label className={labelClass}>Email *</label><input name="adminEmail" type="email" value={form.adminEmail} onChange={handleChange} className={inputClass} required /></div>
              <div><label className={labelClass}>Username *</label><input name="adminUsername" value={form.adminUsername} onChange={handleChange} className={inputClass} required /></div>
              <div><label className={labelClass}>Password *</label><input name="adminPassword" type="password" value={form.adminPassword} onChange={handleChange} className={inputClass} required minLength={8} /></div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                  ← Back
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                  {loading ? "Submitting..." : "Register Facility"}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already registered? <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
