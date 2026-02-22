import Link from "next/link";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS } from "@/lib/constants";
import ApprovalActions from "./ApprovalActions";

export default async function FacilityReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");
  const { id } = await params;

  const facility = await prisma.facility.findUnique({
    where: { id },
    include: {
      admin: { select: { id: true, fullName: true, email: true, phone: true, createdAt: true } },
    },
  });

  if (!facility) redirect("/regx/approvals");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/regx/approvals" className="text-sm text-blue-600 hover:underline">← Back to Approvals</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Review Facility Registration</h1>
      </div>

      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{facility.name}</h2>
            <span className={`px-3 py-1 text-xs rounded-full font-medium ${
              facility.approvalStatus === "PENDING" ? "bg-amber-100 text-amber-700" :
              facility.approvalStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
              facility.approvalStatus === "REJECTED" ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {facility.approvalStatus}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Category</p>
            <p className="font-medium text-gray-900">{FACILITY_CATEGORY_LABELS[facility.category] || facility.category}</p>
          </div>
          <div>
            <p className="text-gray-500">Registration No.</p>
            <p className="font-medium text-gray-900">{facility.registrationNo}</p>
          </div>
          <div>
            <p className="text-gray-500">Address</p>
            <p className="font-medium text-gray-900">{facility.address}</p>
          </div>
          <div>
            <p className="text-gray-500">City / District</p>
            <p className="font-medium text-gray-900">{facility.city}, {facility.district}</p>
          </div>
          <div>
            <p className="text-gray-500">Phone</p>
            <p className="font-medium text-gray-900">{facility.phone || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{facility.email || "—"}</p>
          </div>
          {facility.bedCount && (
            <div>
              <p className="text-gray-500">Bed Count</p>
              <p className="font-medium text-gray-900">{facility.bedCount}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Applied On</p>
            <p className="font-medium text-gray-900">{new Date(facility.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Admin Contact</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{facility.admin.fullName}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{facility.admin.email}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{facility.admin.phone || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {facility.approvalStatus === "PENDING" && (
        <ApprovalActions facilityId={facility.id} />
      )}

      {facility.approvalStatus === "REJECTED" && facility.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
          <p className="text-sm text-red-700 mt-1">{facility.rejectionReason}</p>
        </div>
      )}
    </div>
  );
}
