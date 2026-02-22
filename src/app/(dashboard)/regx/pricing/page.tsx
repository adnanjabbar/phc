import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PricingEditor from "./PricingEditor";

export default async function PricingPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const pricing = await prisma.categoryPricing.findMany({ orderBy: { annualFee: "desc" } });
  const changeRequests = await prisma.categoryChangeRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Category Pricing</h1>
        <p className="text-gray-500 mt-1">Set registration and annual fees per MSDS category</p>
      </div>

      {changeRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800">{changeRequests.length} pending category change request(s)</p>
        </div>
      )}

      <PricingEditor initialPricing={JSON.parse(JSON.stringify(pricing))} />
    </div>
  );
}
