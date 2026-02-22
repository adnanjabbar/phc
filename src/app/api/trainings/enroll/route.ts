import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { trainingId, facilityId } = await req.json();

  const training = await prisma.training.findUnique({ where: { id: trainingId } });
  if (!training) return NextResponse.json({ error: "Training not found" }, { status: 404 });

  // Check capacity
  const enrolled = await prisma.trainingEnrollment.count({ where: { trainingId } });
  if (training.maxParticipants && enrolled >= training.maxParticipants) {
    return NextResponse.json({ error: "Training is full" }, { status: 400 });
  }

  // Create payment if fee > 0
  let paymentId: string | null = null;
  if (training.fee > 0) {
    const payment = await prisma.payment.create({
      data: {
        amount: training.fee,
        type: "TRAINING_FEE",
        status: "PENDING",
        description: `Training: ${training.title}`,
        facilityId: facilityId || null,
        userId: session.user.id,
      },
    });
    paymentId = payment.id;
  }

  const enrollment = await prisma.trainingEnrollment.create({
    data: {
      trainingId,
      userId: session.user.id,
      facilityId: facilityId || null,
      paymentId,
      status: training.fee > 0 ? "pending_payment" : "enrolled",
    },
  });

  return NextResponse.json({ enrollment, paymentId });
}
