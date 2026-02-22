import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const request = await prisma.categoryChangeRequest.update({
    where: { id },
    data: {
      status: body.action === "approve" ? "APPROVED" : "REJECTED",
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      reviewNotes: body.notes,
    },
  });

  // If approved, update the facility category and reset compliance
  if (body.action === "approve") {
    await prisma.facility.update({
      where: { id: request.facilityId },
      data: { category: request.requestedCategory as never },
    });
    // Clear old facility indicators so they can re-initialize
    await prisma.facilityIndicator.deleteMany({ where: { facilityId: request.facilityId } });
  }

  return NextResponse.json(request);
}
