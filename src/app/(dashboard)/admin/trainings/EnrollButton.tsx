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
