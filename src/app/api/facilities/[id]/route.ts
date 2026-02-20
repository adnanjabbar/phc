import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, facilityId } = session.user;
    const { id } = await params;

    if (role !== "REGX" && facilityId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        admin: { select: { fullName: true, email: true, username: true } },
        users: { where: { role: "MSDS_FOCAL" }, select: { id: true, fullName: true, email: true, username: true } },
        _count: { select: { facilityIndicators: true, submissions: true } },
      },
    });

    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    return NextResponse.json({ facility });
  } catch (err) {
    console.error("Facility error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
