"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApprovalActions({ facilityId }: { facilityId: string }) {
  const [loading, setLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) {
        router.push("/regx/approvals");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="font-semibold text-gray-900">Take Action</h3>
      
      {showReject ? (
        <div className="space-y-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for rejection..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
            rows={3}
          />
          <div className="flex gap-2">
            <button onClick={() => handleAction("reject")} disabled={loading || !reason}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
              {loading ? "Processing..." : "Confirm Rejection"}
            </button>
            <button onClick={() => setShowReject(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button onClick={() => handleAction("approve")} disabled={loading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
            {loading ? "Processing..." : "✓ Approve Facility"}
          </button>
          <button onClick={() => setShowReject(true)}
            className="px-6 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100">
            ✕ Reject
          </button>
          <button onClick={() => handleAction("suspend")} disabled={loading}
            className="px-6 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm hover:bg-gray-100">
            Suspend
          </button>
        </div>
      )}
    </div>
  );
}
