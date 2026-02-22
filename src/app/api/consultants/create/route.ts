import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { fullName, email, username, password, phone, specialization, experience, bio } = body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) return NextResponse.json({ error: "Email or username already taken" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      fullName, email, username, password: hashed, phone,
      role: "CONSULTANT",
      specialization, experience: experience ? parseInt(experience) : null, bio,
      approvalStatus: "APPROVED",
      isActive: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
