import Image from "next/image";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DrillsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  const facility = await prisma.facility.findFirst({ where: { adminId: session.user.id } });
  if (!facility) redirect("/admin");

  const drills = await prisma.drillRecord.findMany({
    where: { facilityId: facility.id },
    orderBy: { conductedAt: "desc" },
    include: { user: { select: { fullName: true } }, photos: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drill Records</h1>
          <p className="text-gray-500 mt-1">{drills.length} drills conducted</p>
        </div>
        <Link href="/admin/drills/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          + Record New Drill
        </Link>
      </div>

      <div className="space-y-4">
        {drills.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
            No drill records yet. Record your first drill to track compliance.
          </div>
        ) : drills.map((d) => (
          <div key={d.id} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{d.title}</h3>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">{d.type}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{d.description.substring(0, 150)}...</p>
                <div className="flex gap-4 text-xs text-gray-400 mt-2">
                  <span>Date: {new Date(d.conductedAt).toLocaleDateString()}</span>
                  <span>Participants: {d.participants}</span>
                  <span>By: {d.user.fullName}</span>
                  <span>Photos: {d.photos.length}</span>
                </div>
              </div>
              <Link href={`/admin/drills/${d.id}`} className="text-sm text-blue-600 hover:underline">View</Link>
            </div>
            {d.photos.length > 0 && (
              <div className="flex gap-2 mt-3">
                {d.photos.slice(0, 4).map((p) => (
                  <Image key={p.id} src={p.filePath} alt={p.caption || "Drill photo"} width={64} height={64} className="w-16 h-16 object-cover rounded border" unoptimized />
                ))}
                {d.photos.length > 4 && <span className="text-xs text-gray-400 self-center">+{d.photos.length - 4} more</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
