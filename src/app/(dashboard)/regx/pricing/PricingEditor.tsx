"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Pricing {
  id: string;
  category: string;
  name: string;
  annualFee: number;
  registrationFee: number;
  description: string | null;
}

export default function PricingEditor({ initialPricing }: { initialPricing: Pricing[] }) {
  const [pricing, setPricing] = useState(initialPricing);
  const [saving, setSaving] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async (item: Pricing) => {
    setSaving(item.id);
    await fetch("/api/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    setSaving(null);
    router.refresh();
  };

  const updateField = (id: string, field: string, value: string | number) => {
    setPricing(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration Fee</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annual Fee</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {pricing.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
              <td className="px-4 py-3">
                <input type="number" value={p.registrationFee}
                  onChange={(e) => updateField(p.id, "registrationFee", Number(e.target.value))}
                  className="w-28 px-2 py-1 border rounded text-sm" />
              </td>
              <td className="px-4 py-3">
                <input type="number" value={p.annualFee}
                  onChange={(e) => updateField(p.id, "annualFee", Number(e.target.value))}
                  className="w-28 px-2 py-1 border rounded text-sm" />
              </td>
              <td className="px-4 py-3">
                <input type="text" value={p.description || ""}
                  onChange={(e) => updateField(p.id, "description", e.target.value)}
                  className="w-full px-2 py-1 border rounded text-sm" />
              </td>
              <td className="px-4 py-3">
                <button onClick={() => handleSave(p)} disabled={saving === p.id}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">
                  {saving === p.id ? "..." : "Save"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
