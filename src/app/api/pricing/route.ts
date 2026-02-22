/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const pricing = await prisma.categoryPricing.findMany({
    where: { isActive: true },
    orderBy: { annualFee: "asc" },
  });
  return NextResponse.json(pricing);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { id, annualFee, registrationFee, description } = body;
  const updated = await prisma.categoryPricing.update({
    where: { id },
    data: { annualFee, registrationFee, description, updatedAt: new Date() },
  });
  return NextResponse.json(updated);
}
