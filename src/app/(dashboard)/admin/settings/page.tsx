import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS } from "@/lib/constants";
import CategoryChangeForm from "./CategoryChangeForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const facility = await prisma.facility.findFirst({ where: { adminId: session.user.id } });
  if (!facility) redirect("/admin");

  const pricing = await prisma.categoryPricing.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  const pendingRequest = await prisma.categoryChangeRequest.findFirst({
    where: { facilityId: facility.id, status: "PENDING" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Facility Settings</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Facility Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-medium ml-2">{facility.name}</span></div>
          <div><span className="text-gray-500">Reg No:</span> <span className="font-medium ml-2">{facility.registrationNo}</span></div>
          <div><span className="text-gray-500">Category:</span> <span className="font-medium ml-2">{FACILITY_CATEGORY_LABELS[facility.category]}</span></div>
          <div><span className="text-gray-500">Location:</span> <span className="font-medium ml-2">{facility.city}, {facility.district}</span></div>
          <div><span className="text-gray-500">Status:</span> <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${facility.approvalStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{facility.approvalStatus}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Change MSDS Category</h2>
        {pendingRequest ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-800">Category change request pending</p>
            <p className="text-xs text-amber-600 mt-1">
              Requested: {FACILITY_CATEGORY_LABELS[pendingRequest.requestedCategory] || pendingRequest.requestedCategory}
              {pendingRequest.priceDifference > 0 && ` · Price difference: PKR ${pendingRequest.priceDifference.toLocaleString()}`}
            </p>
          </div>
        ) : (
          <CategoryChangeForm
            facilityId={facility.id}
            currentCategory={facility.category}
            pricing={JSON.parse(JSON.stringify(pricing))}
          />
        )}
      </div>
    </div>
  );
}
