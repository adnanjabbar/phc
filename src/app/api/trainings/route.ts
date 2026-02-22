import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const trainings = await prisma.training.findMany({
    orderBy: { scheduledAt: "asc" },
    include: { _count: { select: { enrollments: true } } },
  });
  return NextResponse.json(trainings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const training = await prisma.training.create({
    data: {
      title: body.title,
      description: body.description,
      category: body.category || null,
      scheduledAt: new Date(body.scheduledAt),
      duration: body.duration || 60,
      location: body.location,
      isOnline: body.isOnline || false,
      meetingUrl: body.meetingUrl,
      maxParticipants: body.maxParticipants || 50,
      fee: body.fee || 0,
      conductedBy: body.conductedBy,
    },
  });
  return NextResponse.json(training, { status: 201 });
}
