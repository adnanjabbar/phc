import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, BarChart3, Activity } from "lucide-react";
import { FACILITY_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default async function RegxDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "REGX") redirect("/login");

  const [facilityCount, userCount, recentFacilities, recentActivity] = await Promise.all([
    prisma.facility.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: true, role: { not: "REGX" } } }),
    prisma.facility.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      select: { id: true, name: true, category: true, city: true, createdAt: true, isActive: true },
    }),
    prisma.activityLog.findMany({
      take: 8, orderBy: { createdAt: "desc" },
      include: { user: { select: { fullName: true, role: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform-wide overview of all facilities and compliance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Facilities" value={facilityCount} subtitle="Active facilities"
          icon={<Building2 className="w-6 h-6 text-primary-600" />} iconBg="bg-primary-50" />
        <StatsCard title="Total Users" value={userCount} subtitle="Admins & focal persons"
          icon={<Users className="w-6 h-6 text-teal-600" />} iconBg="bg-teal-50" />
        <StatsCard title="Compliance Score" value="N/A" subtitle="Across all facilities"
          icon={<BarChart3 className="w-6 h-6 text-green-600" />} iconBg="bg-green-50" />
        <StatsCard title="Active Today" value={recentActivity.length} subtitle="Recent activities"
          icon={<Activity className="w-6 h-6 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentFacilities.length === 0 && (
                <p className="text-sm text-gray-500">No facilities registered yet.</p>
              )}
              {recentFacilities.map((facility) => (
                <div key={facility.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{facility.name}</p>
                    <p className="text-xs text-gray-500">{facility.city} · {FACILITY_CATEGORY_LABELS[facility.category]}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={facility.isActive ? "compliant" : "non-compliant"}>
                      {facility.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(facility.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 && (
                <p className="text-sm text-gray-500">No recent activity.</p>
              )}
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-900">{log.action} <span className="text-gray-500">{log.entity}</span></p>
                    <p className="text-xs text-gray-400">{log.user.fullName} · {formatDate(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
