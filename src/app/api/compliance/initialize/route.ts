import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { facilityId, category } = await req.json();

  // Get all indicators for this category
  const standards = await prisma.msdsStandard.findMany({
    where: { category },
    include: { indicators: true },
  });

  const indicators = standards.flatMap(s => s.indicators);
  let created = 0;

  for (const ind of indicators) {
    try {
      await prisma.facilityIndicator.create({
        data: {
          facilityId,
          indicatorId: ind.id,
          status: "NOT_ASSESSED",
        },
      });
      created++;
    } catch {
      // Already exists (unique constraint), skip
    }
  }

  return NextResponse.json({ success: true, created, total: indicators.length });
}
