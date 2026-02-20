import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, facilityId } = session.user;
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = parseInt(url.searchParams.get("limit") ?? "10");
    const skip = (page - 1) * limit;

    if (role !== "REGX" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const where = role === "REGX"
      ? { role: { not: "REGX" as const } }
      : { facilityId: facilityId ?? "" };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, email: true, username: true, fullName: true, phone: true, role: true, isActive: true, facilityId: true, createdAt: true },
        skip, take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, limit });
  } catch (err) {
    console.error("Users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
