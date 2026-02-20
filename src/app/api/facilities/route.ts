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

    const where = role === "REGX" ? {} : { id: facilityId ?? "" };

    const [facilities, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        include: { admin: { select: { fullName: true, email: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.facility.count({ where }),
    ]);

    return NextResponse.json({ facilities, total, page, limit });
  } catch (err) {
    console.error("Facilities error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
