import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FACILITY_CATEGORY_LABELS } from "@/lib/constants";

export default async function StandardsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const byCategory = await prisma.msdsStandard.groupBy({
    by: ["category"],
    _count: true,
  });

  const standards = await prisma.msdsStandard.findMany({
    include: { _count: { select: { indicators: true } } },
    orderBy: { code: "asc" },
  });

  const indicators = await prisma.indicator.count();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">MSDS Standards</h1>
        <p className="text-gray-500 mt-1">{standards.length} standards · {indicators} indicators across {byCategory.length} categories</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {byCategory.map((cat) => (
          <div key={cat.category} className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-900">{FACILITY_CATEGORY_LABELS[cat.category] || cat.category}</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{cat._count}</p>
            <p className="text-xs text-gray-400">standards</p>
          </div>
        ))}
      </div>

      {byCategory.map((cat) => {
        const catStandards = standards.filter(s => s.category === cat.category);
        return (
          <div key={cat.category} className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">{FACILITY_CATEGORY_LABELS[cat.category] || cat.category}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {catStandards.map((s) => (
                <div key={s.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.title}</p>
                    <p className="text-xs text-gray-400">{s.section}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{s._count.indicators} indicators</span>
                    <p className="text-xs text-gray-400 mt-0.5">{s.code}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
