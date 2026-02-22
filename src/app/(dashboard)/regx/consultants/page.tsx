import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ConsultantManager from "./ConsultantManager";

export default async function ConsultantsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const [consultants, facilities, assignments] = await Promise.all([
    prisma.user.findMany({ where: { role: "CONSULTANT" }, orderBy: { createdAt: "desc" } }),
    prisma.facility.findMany({ where: { approvalStatus: "APPROVED", isActive: true }, select: { id: true, name: true, category: true }, orderBy: { name: "asc" } }),
    prisma.consultantAssignment.findMany({
      where: { status: "active" },
      include: {
        consultant: { select: { fullName: true, specialization: true } },
        facility: { select: { name: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Consultant Management</h1>

      <ConsultantManager
        consultants={JSON.parse(JSON.stringify(consultants))}
        facilities={JSON.parse(JSON.stringify(facilities))}
        assignments={JSON.parse(JSON.stringify(assignments))}
      />
    </div>
  );
}
