import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/constants";

export default async function StaffPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const facility = await prisma.facility.findFirst({ where: { adminId: session.user.id } });
  if (!facility) redirect("/admin");

  const staff = await prisma.user.findMany({
    where: { facilityId: facility.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <span className="text-sm text-gray-500">{staff.length} team members</span>
      </div>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {staff.map((s) => (
          <div key={s.id} className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{s.fullName}</p>
              <p className="text-sm text-gray-500">{s.email} · {s.phone || "No phone"}</p>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">{ROLE_LABELS[s.role]}</span>
              <p className="text-xs text-gray-400 mt-1">Joined {new Date(s.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
        {staff.length === 0 && <p className="px-6 py-8 text-gray-400 text-center">No staff members yet</p>}
      </div>
    </div>
  );
}
