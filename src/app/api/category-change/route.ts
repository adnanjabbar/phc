/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  // Calculate price difference
  const [currentPricing, newPricing] = await Promise.all([
    prisma.categoryPricing.findUnique({ where: { category: body.currentCategory } }),
    prisma.categoryPricing.findUnique({ where: { category: body.requestedCategory } }),
  ]);

  const priceDiff = Math.max(0, (newPricing?.annualFee || 0) - (currentPricing?.annualFee || 0));

  const request = await prisma.categoryChangeRequest.create({
    data: {
      facilityId: body.facilityId,
      requestedBy: session.user.id,
      currentCategory: body.currentCategory,
      requestedCategory: body.requestedCategory,
      reason: body.reason,
      priceDifference: priceDiff,
    },
  });

  return NextResponse.json(request, { status: 201 });
}
