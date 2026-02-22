import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function TrainingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const trainings = await prisma.training.findMany({
    orderBy: { scheduledAt: "desc" },
    include: { _count: { select: { enrollments: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Programs</h1>
          <p className="text-gray-500 mt-1">Manage MSDS training sessions</p>
        </div>
        <a href="/regx/trainings/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          + New Training
        </a>
      </div>

      <div className="grid gap-4">
        {trainings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
            No training programs yet. Create one to get started.
          </div>
        ) : (
          trainings.map((t) => (
            <div key={t.id} className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{t.title}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    t.status === "UPCOMING" ? "bg-blue-100 text-blue-700" :
                    t.status === "ONGOING" ? "bg-emerald-100 text-emerald-700" :
                    t.status === "COMPLETED" ? "bg-gray-100 text-gray-600" :
                    "bg-red-100 text-red-700"
                  }`}>{t.status}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(t.scheduledAt).toLocaleDateString()} · {t.duration} min · {t.isOnline ? "Online" : t.location || "TBD"}
                </p>
                <p className="text-sm text-gray-400">
                  {t._count.enrollments} enrolled · Fee: {t.fee > 0 ? `PKR ${t.fee.toLocaleString()}` : "Free"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
