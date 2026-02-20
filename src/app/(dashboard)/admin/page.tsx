import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle, XCircle } from "lucide-react";
import { COMPLIANCE_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const facilityId = session.user.facilityId;
  if (!facilityId) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No facility linked to your account. Please contact the administrator.</p>
      </div>
    );
  }

  const [facility, teamCount, indicatorStats, recentSubmissions] = await Promise.all([
    prisma.facility.findUnique({ where: { id: facilityId }, select: { name: true, category: true } }),
    prisma.user.count({ where: { facilityId, role: "MSDS_FOCAL", isActive: true } }),
    prisma.facilityIndicator.groupBy({
      by: ["status"],
      where: { facilityId },
      _count: { status: true },
    }),
    prisma.indicatorSubmission.findMany({
      where: { facilityId },
      take: 5,
      orderBy: { submittedAt: "desc" },
      include: {
        indicator: { select: { title: true, code: true } },
        user: { select: { fullName: true } },
      },
    }),
  ]);

  const totalIndicators = indicatorStats.reduce((sum, s) => sum + s._count.status, 0);
  const compliantCount = indicatorStats.find((s) => s.status === "COMPLIANT")?._count.status ?? 0;
  const nonCompliantCount = indicatorStats.find((s) => s.status === "NON_COMPLIANT")?._count.status ?? 0;
  const complianceScore = totalIndicators > 0 ? Math.round((compliantCount / totalIndicators) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">{facility?.name ?? "Your facility"} compliance overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Compliance Score" value={`${complianceScore}%`} subtitle="Overall facility score"
          icon={<CheckCircle className="w-6 h-6 text-green-600" />} iconBg="bg-green-50" />
        <StatsCard title="Total Indicators" value={totalIndicators} subtitle="Assigned to facility"
          icon={<ClipboardList className="w-6 h-6 text-primary-600" />} iconBg="bg-primary-50" />
        <StatsCard title="Compliant" value={compliantCount} subtitle="Meeting standards"
          icon={<CheckCircle className="w-6 h-6 text-teal-600" />} iconBg="bg-teal-50" />
        <StatsCard title="Non-Compliant" value={nonCompliantCount} subtitle="Need attention"
          icon={<XCircle className="w-6 h-6 text-red-600" />} iconBg="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Indicator Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {indicatorStats.length === 0 && (
                <p className="text-sm text-gray-500">No indicators assigned yet.</p>
              )}
              {indicatorStats.map((stat) => (
                <div key={stat.status} className="flex items-center justify-between">
                  <Badge variant={stat.status === "COMPLIANT" ? "compliant" : stat.status === "NON_COMPLIANT" ? "non-compliant" : stat.status === "PARTIALLY_COMPLIANT" ? "partially-compliant" : stat.status === "IN_PROGRESS" ? "in-progress" : "not-assessed"}>
                    {COMPLIANCE_STATUS_LABELS[stat.status]}
                  </Badge>
                  <span className="text-sm font-medium text-gray-900">{stat._count.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubmissions.length === 0 && (
                <p className="text-sm text-gray-500">No submissions yet.</p>
              )}
              {recentSubmissions.map((sub) => (
                <div key={sub.id} className="py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sub.indicator.title}</p>
                      <p className="text-xs text-gray-500">{sub.user.fullName} · {formatDate(sub.submittedAt)}</p>
                    </div>
                    <Badge variant={sub.status === "COMPLIANT" ? "compliant" : sub.status === "NON_COMPLIANT" ? "non-compliant" : "partially-compliant"}>
                      {COMPLIANCE_STATUS_LABELS[sub.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-gray-500">
        Team members (MSDS Focal): {teamCount}
      </div>
    </div>
  );
}
