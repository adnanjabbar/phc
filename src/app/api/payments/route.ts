/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where: Record<string, string> = {};
  if (session.user.role !== "REGX") {
    where.userId = session.user.id;
  }

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { facility: { select: { name: true } }, user: { select: { fullName: true } } },
  });

  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const payment = await prisma.payment.create({
    data: {
      amount: body.amount,
      type: body.type,
      method: body.method || "bank_transfer",
      description: body.description,
      facilityId: body.facilityId || null,
      userId: session.user.id,
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
