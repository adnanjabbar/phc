import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/constants";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const users = await prisma.user.findMany({
    include: { facility: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <p className="text-sm font-medium text-gray-900">{u.fullName}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">{ROLE_LABELS[u.role] || u.role}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{u.facility?.name || "—"}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
