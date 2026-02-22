import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EnrollButton from "./EnrollButton";

export default async function AdminTrainingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const facility = await prisma.facility.findFirst({ where: { adminId: session.user.id } });
  if (!facility) redirect("/admin");

  const trainings = await prisma.training.findMany({
    where: { status: { in: ["UPCOMING", "ONGOING"] } },
    orderBy: { scheduledAt: "asc" },
    include: { _count: { select: { enrollments: true } } },
  });

  const myEnrollments = await prisma.trainingEnrollment.findMany({
    where: { userId: session.user.id },
    select: { trainingId: true, status: true },
  });
  const enrolledIds = new Set(myEnrollments.map(e => e.trainingId));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Available Trainings</h1>
      <div className="grid gap-4">
        {trainings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">No upcoming trainings</div>
        ) : trainings.map((t) => (
          <div key={t.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{t.title}</h3>
                {t.description && <p className="text-sm text-gray-500 mt-1">{t.description.substring(0, 200)}</p>}
                <div className="flex gap-4 text-xs text-gray-400 mt-2">
                  <span>{new Date(t.scheduledAt).toLocaleDateString()}</span>
                  <span>{t.duration} min</span>
                  <span>{t.isOnline ? "Online" : t.location}</span>
                  <span>{t._count.enrollments}/{t.maxParticipants} enrolled</span>
                </div>
                <p className="text-sm font-medium mt-2">{t.fee > 0 ? `PKR ${t.fee.toLocaleString()}` : "Free"}</p>
              </div>
              <div>
                {enrolledIds.has(t.id) ? (
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs rounded-lg">Enrolled</span>
                ) : (
                  <EnrollButton trainingId={t.id} facilityId={facility.id} fee={t.fee} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
