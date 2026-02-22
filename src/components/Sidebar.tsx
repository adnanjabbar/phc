"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@prisma/client";
import {
  LayoutDashboard, Building2, Users, FileCheck, ClipboardList,
  Settings, Shield, CreditCard, GraduationCap, UserCheck, BarChart3
} from "lucide-react";

const NAV_ITEMS: Record<string, { label: string; href: string; icon: React.ElementType }[]> = {
  REGX: [
    { label: "Dashboard", href: "/regx", icon: LayoutDashboard },
    { label: "Approvals", href: "/regx/approvals", icon: UserCheck },
    { label: "Facilities", href: "/regx/facilities", icon: Building2 },
    { label: "Users", href: "/regx/users", icon: Users },
    { label: "Consultants", href: "/regx/consultants", icon: Shield },
    { label: "Trainings", href: "/regx/trainings", icon: GraduationCap },
    { label: "Payments", href: "/regx/payments", icon: CreditCard },
    { label: "Standards", href: "/regx/standards", icon: ClipboardList },
    { label: "Reports", href: "/regx/reports", icon: BarChart3 },
    { label: "Pricing", href: "/regx/pricing", icon: CreditCard },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Compliance", href: "/admin/compliance", icon: FileCheck },
    { label: "Drills", href: "/admin/drills", icon: ClipboardList },
    { label: "Staff", href: "/admin/staff", icon: Users },
    { label: "Trainings", href: "/admin/trainings", icon: GraduationCap },
    { label: "Payments", href: "/admin/payments", icon: CreditCard },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ],
  MSDS_FOCAL: [
    { label: "Dashboard", href: "/focal", icon: LayoutDashboard },
    { label: "Self-Assessment", href: "/focal/assessment", icon: FileCheck },
    { label: "Evidence", href: "/focal/evidence", icon: ClipboardList },
    { label: "Reports", href: "/focal/reports", icon: BarChart3 },
  ],
  CONSULTANT: [
    { label: "Dashboard", href: "/consultant", icon: LayoutDashboard },
    { label: "Assigned Facilities", href: "/consultant/facilities", icon: Building2 },
    { label: "Assessments", href: "/consultant/assessments", icon: FileCheck },
    { label: "Reports", href: "/consultant/reports", icon: BarChart3 },
  ],
};

export function Sidebar({ role, facilityName }: { role: UserRole; facilityName?: string }) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role] || NAV_ITEMS.MSDS_FOCAL;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">PHC MSDS</h1>
            <p className="text-[10px] text-gray-400">Compliance Platform</p>
          </div>
        </div>
        {facilityName && (
          <p className="text-xs text-blue-600 mt-2 truncate">{facilityName}</p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== `/${role.toLowerCase()}` && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <div className="px-3 py-2">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{role.replace("_", " ")}</p>
        </div>
      </div>
    </aside>
  );
}
