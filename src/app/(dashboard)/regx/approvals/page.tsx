import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS, APPROVAL_STATUS_LABELS } from "@/lib/constants";


export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const [pendingFacilities, pendingUsers, recentActions] = await Promise.all([
    prisma.facility.findMany({
      where: { approvalStatus: "PENDING" },
      include: { admin: { select: { fullName: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { approvalStatus: "PENDING", role: { not: "REGX" } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.facility.findMany({
      where: { approvalStatus: { not: "PENDING" } },
      include: { admin: { select: { fullName: true } } },
      orderBy: { approvedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
        <p className="text-gray-500 mt-1">Review and approve facility registrations and user accounts</p>
      </div>

      {/* Pending Facilities */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Pending Facilities
            {pendingFacilities.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">{pendingFacilities.length}</span>
            )}
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {pendingFacilities.length === 0 ? (
            <p className="px-6 py-8 text-gray-400 text-center">No pending facility approvals</p>
          ) : (
            pendingFacilities.map((f) => (
              <div key={f.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{f.name}</p>
                  <p className="text-sm text-gray-500">
                    {FACILITY_CATEGORY_LABELS[f.category] || f.category} · {f.city}, {f.district}
                  </p>
                  <p className="text-sm text-gray-400">
                    Admin: {f.admin.fullName} · {f.admin.email}
                  </p>
                  <p className="text-xs text-gray-400">Reg#: {f.registrationNo}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`/regx/approvals/${f.id}`} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                    Review
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Users */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Pending User Accounts
            {pendingUsers.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">{pendingUsers.length}</span>
            )}
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {pendingUsers.length === 0 ? (
            <p className="px-6 py-8 text-gray-400 text-center">No pending user approvals</p>
          ) : (
            pendingUsers.map((u) => (
              <div key={u.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{u.fullName}</p>
                  <p className="text-sm text-gray-500">{u.role} · {u.email}</p>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">Pending</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Decisions</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentActions.map((f) => (
            <div key={f.id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{f.name}</p>
                <p className="text-xs text-gray-400">{f.admin.fullName}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                f.approvalStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                f.approvalStatus === "REJECTED" ? "bg-red-100 text-red-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                {APPROVAL_STATUS_LABELS[f.approvalStatus || "PENDING"]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
