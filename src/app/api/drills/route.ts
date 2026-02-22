import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const drill = await prisma.drillRecord.create({
    data: {
      type: body.type,
      title: body.title,
      description: body.description,
      conductedAt: new Date(body.conductedAt),
      participants: body.participants,
      outcome: body.outcome || null,
      observations: body.observations || null,
      facilityId: body.facilityId,
      userId: session.user.id,
      photos: {
        create: (body.photos || []).map((p: { filePath: string; caption: string }) => ({
          filePath: p.filePath,
          caption: p.caption,
        })),
      },
    },
  });

  return NextResponse.json(drill, { status: 201 });
}
