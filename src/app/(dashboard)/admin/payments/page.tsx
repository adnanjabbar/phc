import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PAYMENT_TYPE_LABELS } from "@/lib/constants";

export default async function AdminPaymentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const facility = await prisma.facility.findFirst({ where: { adminId: session.user.id } });
  if (!facility) redirect("/admin");

  const payments = await prisma.payment.findMany({
    where: { facilityId: facility.id },
    orderBy: { createdAt: "desc" },
  });

  const totalPaid = payments.filter(p => p.status === "COMPLETED").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Total Paid</p>
          <p className="text-2xl font-bold text-emerald-600">PKR {totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Transactions</p>
          <p className="text-2xl font-bold text-blue-600">{payments.length}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {payments.length === 0 ? (
          <p className="px-6 py-8 text-gray-400 text-center">No payment records</p>
        ) : payments.map((p) => (
          <div key={p.id} className="px-6 py-3 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">{PAYMENT_TYPE_LABELS[p.type] || p.type}</p>
              <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">PKR {p.amount.toLocaleString()}</p>
              <span className={`text-xs ${p.status === "COMPLETED" ? "text-emerald-600" : "text-amber-600"}`}>{p.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
