import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PAYMENT_TYPE_LABELS } from "@/lib/constants";

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const [payments, stats] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        facility: { select: { name: true } },
        user: { select: { fullName: true } },
      },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalRevenue = stats.filter(s => s.status === "COMPLETED").reduce((sum, s) => sum + (s._sum.amount || 0), 0);
  const pendingAmount = stats.filter(s => s.status === "PENDING").reduce((sum, s) => sum + (s._sum.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">Track all financial transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-600">PKR {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Pending Payments</p>
          <p className="text-2xl font-bold text-amber-600">PKR {pendingAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="text-2xl font-bold text-blue-600">{payments.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No payments yet</td></tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{p.facility?.name || "—"}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{PAYMENT_TYPE_LABELS[p.type] || p.type}</td>
                  <td className="px-6 py-3 text-sm font-medium">PKR {p.amount.toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      p.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                      p.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                      p.status === "FAILED" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>{p.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
