"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Pricing { category: string; name: string; annualFee: number; registrationFee: number; }

export default function CategoryChangeForm({ facilityId, currentCategory, pricing }: {
  facilityId: string; currentCategory: string; pricing: Pricing[];
}) {
  const [selected, setSelected] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const currentPrice = pricing.find(p => p.category === currentCategory)?.annualFee || 0;
  const newPrice = pricing.find(p => p.category === selected)?.annualFee || 0;
  const diff = Math.max(0, newPrice - currentPrice);

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch("/api/category-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facilityId, currentCategory, requestedCategory: selected, reason }),
    });
    if (res.ok) { setSuccess(true); router.refresh(); }
    setLoading(false);
  };

  if (success) return <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg text-sm">Request submitted! Awaiting RegX admin approval.</div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Select a new MSDS category. If the new category has a higher fee, you will need to pay the difference upon approval.</p>
      <select value={selected} onChange={(e) => setSelected(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
        <option value="">Select new category...</option>
        {pricing.filter(p => p.category !== currentCategory).map(p => (
          <option key={p.category} value={p.category}>{p.name} — PKR {p.annualFee.toLocaleString()}/yr</option>
        ))}
      </select>
      {selected && diff > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          Price difference: <span className="font-bold">PKR {diff.toLocaleString()}</span> (will be charged upon approval)
        </div>
      )}
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Reason for category change..." />
      <button onClick={handleSubmit} disabled={!selected || loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Submitting..." : "Request Category Change"}
      </button>
    </div>
  );
}
