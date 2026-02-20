import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, facilityId } = session.user;

    if (role === "REGX") {
      const [totalFacilities, totalUsers, facilitiesByCategory] = await Promise.all([
        prisma.facility.count({ where: { isActive: true } }),
        prisma.user.count({ where: { isActive: true, role: { not: "REGX" } } }),
        prisma.facility.groupBy({ by: ["category"], _count: { category: true } }),
      ]);

      const categoryMap: Record<string, number> = {};
      facilitiesByCategory.forEach((f) => { categoryMap[f.category] = f._count.category; });

      return NextResponse.json({ totalFacilities, totalUsers, facilitiesByCategory: categoryMap });
    }

    if (role === "ADMIN" && facilityId) {
      const [indicatorStats, teamCount] = await Promise.all([
        prisma.facilityIndicator.groupBy({
          by: ["status"],
          where: { facilityId },
          _count: { status: true },
        }),
        prisma.user.count({ where: { facilityId, role: "MSDS_FOCAL" } }),
      ]);

      const totalIndicators = indicatorStats.reduce((s, i) => s + i._count.status, 0);
      const compliantCount = indicatorStats.find((s) => s.status === "COMPLIANT")?._count.status ?? 0;
      const nonCompliantCount = indicatorStats.find((s) => s.status === "NON_COMPLIANT")?._count.status ?? 0;
      const notAssessedCount = indicatorStats.find((s) => s.status === "NOT_ASSESSED")?._count.status ?? 0;
      const complianceScore = totalIndicators > 0 ? Math.round((compliantCount / totalIndicators) * 100) : 0;

      return NextResponse.json({ totalIndicators, compliantCount, nonCompliantCount, notAssessedCount, complianceScore, teamCount });
    }

    if (role === "MSDS_FOCAL") {
      const userId = session.user.id;
      const [mySubmissions, pendingCount] = await Promise.all([
        prisma.indicatorSubmission.count({ where: { userId } }),
        facilityId ? prisma.facilityIndicator.count({ where: { facilityId, status: { in: ["NOT_ASSESSED", "IN_PROGRESS"] } } }) : Promise.resolve(0),
      ]);

      return NextResponse.json({ mySubmissions, pendingCount });
    }

    return NextResponse.json({ error: "Unknown role" }, { status: 400 });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
