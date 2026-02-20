import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole, FacilityCategory } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, username, phone, password, role, facilityName, facilityCategory, registrationNo, address, city, district, bedCount, facilityCode } = body;

    // Validate required fields
    if (!fullName || !email || !username || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["ADMIN", "MSDS_FOCAL"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existingUser) {
      return NextResponse.json({ error: "User with this email or username already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    if (role === "ADMIN") {
      if (!facilityName || !facilityCategory || !registrationNo || !address || !city || !district) {
        return NextResponse.json({ error: "Missing facility information" }, { status: 400 });
      }

      // Check if facility registration number already exists
      const existingFacility = await prisma.facility.findUnique({ where: { registrationNo } });
      if (existingFacility) {
        return NextResponse.json({ error: "Facility with this registration number already exists" }, { status: 409 });
      }

      // Create user then facility
      const user = await prisma.user.create({
        data: {
          fullName, email, username, phone, password: hashedPassword,
          role: UserRole.ADMIN, isActive: true,
        },
      });

      const facility = await prisma.facility.create({
        data: {
          name: facilityName,
          category: facilityCategory as FacilityCategory,
          registrationNo,
          address, city, district,
          bedCount: bedCount ? parseInt(bedCount) : null,
          adminId: user.id, isActive: true,
        },
      });

      await prisma.user.update({ where: { id: user.id }, data: { facilityId: facility.id } });

      return NextResponse.json({ message: "Account created successfully", userId: user.id }, { status: 201 });
    }

    // MSDS_FOCAL role
    if (!facilityCode) {
      return NextResponse.json({ error: "Facility registration code is required" }, { status: 400 });
    }

    const facility = await prisma.facility.findUnique({ where: { registrationNo: facilityCode } });
    if (!facility) {
      return NextResponse.json({ error: "Facility not found with provided registration number" }, { status: 404 });
    }

    const user = await prisma.user.create({
      data: {
        fullName, email, username, phone, password: hashedPassword,
        role: UserRole.MSDS_FOCAL, isActive: true, facilityId: facility.id,
      },
    });

    return NextResponse.json({ message: "Account created successfully", userId: user.id }, { status: 201 });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
