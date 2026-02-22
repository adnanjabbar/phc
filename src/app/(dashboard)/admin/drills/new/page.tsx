import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DrillForm from "./DrillForm";

export default async function NewDrillPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  const facility = await prisma.facility.findFirst({ where: { adminId: session.user.id } });
  if (!facility) redirect("/admin");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/admin/drills" className="text-sm text-blue-600 hover:underline">← Back to Drills</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Record New Drill</h1>
      </div>
      <DrillForm facilityId={facility.id} />
    </div>
  );
}
