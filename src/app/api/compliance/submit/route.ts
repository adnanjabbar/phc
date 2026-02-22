import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { facilityIndicatorId, indicatorId, facilityId, status, notes, evidence } = await req.json();

  await prisma.facilityIndicator.update({
    where: { id: facilityIndicatorId },
    data: { status, lastAssessedAt: new Date(), notes },
  });

  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const submission = await prisma.indicatorSubmission.create({
    data: {
      value: status,
      notes,
      status,
      period,
      indicatorId,
      facilityId,
      userId: session.user.id,
      evidence: {
        create: (evidence || []).map((e: { fileName: string; filePath: string; fileSize: number; fileType: string }) => ({
          fileName: e.fileName,
          filePath: e.filePath,
          fileSize: e.fileSize,
          fileType: e.fileType,
        })),
      },
    },
  });

  return NextResponse.json({ success: true, submission });
}
