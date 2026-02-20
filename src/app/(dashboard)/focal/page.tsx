import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Upload, CheckCircle, Clock } from "lucide-react";
import { COMPLIANCE_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default async function FocalDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "MSDS_FOCAL") redirect("/login");

  const userId = session.user.id;
  const facilityId = session.user.facilityId;

  if (!facilityId) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No facility linked to your account. Please contact your facility administrator.</p>
      </div>
    );
  }

  const [mySubmissions, pendingIndicators, recentSubmissions, completedCount] = await Promise.all([
    prisma.indicatorSubmission.count({ where: { userId } }),
    prisma.facilityIndicator.count({
      where: { facilityId, status: { in: ["NOT_ASSESSED", "IN_PROGRESS"] } },
    }),
    prisma.indicatorSubmission.findMany({
      where: { userId },
      take: 5,
      orderBy: { submittedAt: "desc" },
      include: { indicator: { select: { title: true, code: true } } },
    }),
    prisma.indicatorSubmission.count({
      where: { userId, status: "COMPLIANT" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-500 mt-1">MSDS compliance submissions and activities</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="My Submissions" value={mySubmissions} subtitle="Total submitted"
          icon={<ClipboardList className="w-6 h-6 text-primary-600" />} iconBg="bg-primary-50" />
        <StatsCard title="Completed" value={completedCount} subtitle="Compliant indicators"
          icon={<CheckCircle className="w-6 h-6 text-green-600" />} iconBg="bg-green-50" />
        <StatsCard title="Pending" value={pendingIndicators} subtitle="Need assessment"
          icon={<Clock className="w-6 h-6 text-amber-600" />} iconBg="bg-amber-50" />
        <StatsCard title="Evidence" value="0" subtitle="Files uploaded"
          icon={<Upload className="w-6 h-6 text-teal-600" />} iconBg="bg-teal-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubmissions.length === 0 && (
                <p className="text-sm text-gray-500">No submissions yet. Start by submitting a questionnaire.</p>
              )}
              {recentSubmissions.map((sub) => (
                <div key={sub.id} className="py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sub.indicator.title}</p>
                      <p className="text-xs text-gray-500">Period: {sub.period} · {formatDate(sub.submittedAt)}</p>
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

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Submit Questionnaire", href: "/focal/questionnaires", icon: ClipboardList, color: "bg-primary-50 text-primary-700 hover:bg-primary-100" },
                { label: "Upload Evidence", href: "/focal/evidence", icon: Upload, color: "bg-teal-50 text-teal-700 hover:bg-teal-100" },
                { label: "Record Drill", href: "/focal/drills", icon: CheckCircle, color: "bg-green-50 text-green-700 hover:bg-green-100" },
                { label: "View Submissions", href: "/focal/submissions", icon: ClipboardList, color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
              ].map((action) => (
                <a key={action.href} href={action.href} className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-colors ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                  {action.label}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
