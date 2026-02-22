import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { facilityName, category, registrationNo, address, city, district,
            phone, email, bedCount, adminName, adminEmail, adminUsername, adminPassword } = body;

    // Check uniqueness
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: adminEmail }, { username: adminUsername }] },
    });
    if (existingUser) {
      return NextResponse.json({ error: "Email or username already taken" }, { status: 400 });
    }
    const existingFacility = await prisma.facility.findUnique({ where: { registrationNo } });
    if (existingFacility) {
      return NextResponse.json({ error: "Registration number already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create user first
    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        password: hashedPassword,
        fullName: adminName,
        phone,
        role: "ADMIN",
        approvalStatus: "PENDING",
        isActive: false, // inactive until approved
      },
    });

    // Create facility
    const facility = await prisma.facility.create({
      data: {
        name: facilityName,
        category,
        registrationNo,
        address,
        city,
        district,
        phone,
        email,
        bedCount: bedCount ? parseInt(bedCount) : null,
        adminId: user.id,
        approvalStatus: "PENDING",
        isActive: false,
      },
    });

    // Link user to facility
    await prisma.user.update({ where: { id: user.id }, data: { facilityId: facility.id } });

    return NextResponse.json({ success: true, message: "Registration submitted. Awaiting approval from RegX admin." }, { status: 201 });
  } catch (error: unknown) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: (error as Error).message || "Registration failed" }, { status: 500 });
  }
}
