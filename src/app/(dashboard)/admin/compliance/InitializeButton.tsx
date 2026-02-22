"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InitializeButton({ facilityId, category }: { facilityId: string; category: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/compliance/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId, category }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleInit} disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
      {loading ? "Initializing..." : "Initialize Compliance Tracking"}
    </button>
  );
}
