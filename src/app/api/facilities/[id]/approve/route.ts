import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const { action, reason } = body; // action: 'approve' | 'reject' | 'suspend'

  const updateData: Record<string, unknown> = { approvedBy: session.user.id };

  if (action === "approve") {
    updateData.approvalStatus = "APPROVED";
    updateData.approvedAt = new Date();
    updateData.isActive = true;
  } else if (action === "reject") {
    updateData.approvalStatus = "REJECTED";
    updateData.rejectionReason = reason || "Not specified";
    updateData.isActive = false;
  } else if (action === "suspend") {
    updateData.approvalStatus = "SUSPENDED";
    updateData.rejectionReason = reason || "Suspended by admin";
    updateData.isActive = false;
  }

  const facility = await prisma.facility.update({ where: { id }, data: updateData });

  // Also update admin user approval status
  if (facility.adminId) {
    await prisma.user.update({
      where: { id: facility.adminId },
      data: { approvalStatus: action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "SUSPENDED" },
    });
  }

  return NextResponse.json({ success: true, facility });
}
