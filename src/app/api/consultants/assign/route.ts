import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const assignment = await prisma.consultantAssignment.create({
    data: {
      consultantId: body.consultantId,
      facilityId: body.facilityId,
      assignedBy: session.user.id,
      notes: body.notes,
    },
  });
  return NextResponse.json(assignment, { status: 201 });
}
