import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS, APPROVAL_STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";

export default async function FacilitiesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const facilities = await prisma.facility.findMany({
    include: { admin: { select: { fullName: true, email: true } }, _count: { select: { users: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Facilities</h1>
          <p className="text-gray-500 mt-1">{facilities.length} registered facilities</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {facilities.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <Link href={`/regx/approvals/${f.id}`} className="text-sm font-medium text-blue-600 hover:underline">{f.name}</Link>
                  <p className="text-xs text-gray-400">Reg# {f.registrationNo}</p>
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">{FACILITY_CATEGORY_LABELS[f.category] || f.category}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{f.city}, {f.district}</td>
                <td className="px-6 py-3">
                  <p className="text-sm text-gray-900">{f.admin.fullName}</p>
                  <p className="text-xs text-gray-400">{f.admin.email}</p>
                </td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    f.approvalStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                    f.approvalStatus === "PENDING" ? "bg-amber-100 text-amber-700" :
                    f.approvalStatus === "REJECTED" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{APPROVAL_STATUS_LABELS[f.approvalStatus || "PENDING"]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
