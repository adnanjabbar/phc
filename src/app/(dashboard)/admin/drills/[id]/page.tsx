import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DrillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  const { id } = await params;

  const drill = await prisma.drillRecord.findUnique({
    where: { id },
    include: { user: { select: { fullName: true } }, photos: true },
  });
  if (!drill) redirect("/admin/drills");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/admin/drills" className="text-sm text-blue-600 hover:underline">← Back to Drills</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{drill.title}</h1>
        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">{drill.type}</span>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><p className="text-gray-500">Date</p><p className="font-medium">{new Date(drill.conductedAt).toLocaleString()}</p></div>
          <div><p className="text-gray-500">Participants</p><p className="font-medium">{drill.participants}</p></div>
          <div><p className="text-gray-500">Recorded By</p><p className="font-medium">{drill.user.fullName}</p></div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700">Description</h3>
          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{drill.description}</p>
        </div>

        {drill.outcome && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Outcome</h3>
            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{drill.outcome}</p>
          </div>
        )}

        {drill.observations && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Observations</h3>
            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{drill.observations}</p>
          </div>
        )}
      </div>

      {drill.photos.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Photo Evidence ({drill.photos.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {drill.photos.map((p) => (
              <div key={p.id} className="relative group">
                <Image src={p.filePath} alt={p.caption || "Drill photo"} width={320} height={160} className="w-full h-40 object-cover rounded-lg border" unoptimized />
                {p.caption && <p className="text-xs text-gray-500 mt-1 truncate">{p.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
