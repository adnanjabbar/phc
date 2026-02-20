"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { REGX_NAV_ITEMS, ADMIN_NAV_ITEMS, FOCAL_NAV_ITEMS } from "@/lib/constants";
import {
  LayoutDashboard, Building2, Users, FileBarChart, Settings,
  ClipboardList, Upload, Activity, FileCheck, ChevronLeft, ChevronRight,
  Menu, X, Shield
} from "lucide-react";
import { UserRole } from "@prisma/client";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Building2, Users, FileBarChart, Settings,
  ClipboardList, Upload, Activity, FileCheck, Shield,
};

interface SidebarProps {
  role: UserRole;
  facilityName?: string;
}

export function Sidebar({ role, facilityName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navItems =
    role === "REGX" ? REGX_NAV_ITEMS :
    role === "ADMIN" ? ADMIN_NAV_ITEMS :
    FOCAL_NAV_ITEMS;

  const roleLabel =
    role === "REGX" ? "Super Admin Panel" :
    role === "ADMIN" ? "Admin Portal" :
    "Focal Person Portal";

  const SidebarContent = () => (
    <>
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-primary-700", collapsed && "justify-center px-2")}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-bold text-sm">PHC MSDS</div>
            <div className="text-primary-300 text-xs">{roleLabel}</div>
          </div>
        )}
      </div>

      {!collapsed && facilityName && (
        <div className="px-4 py-3 bg-primary-700 border-b border-primary-600">
          <p className="text-primary-300 text-xs uppercase tracking-wide">Facility</p>
          <p className="text-white text-sm font-medium truncate">{facilityName}</p>
        </div>
      )}

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-700 text-white"
                  : "text-primary-200 hover:bg-primary-700 hover:text-white",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("p-4 border-t border-primary-700", collapsed && "px-2")}>
        <p className={cn("text-primary-400 text-xs", collapsed && "text-center")}>
          {collapsed ? "v1" : "PHC MSDS v1.0"}
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-primary-800 text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        "lg:hidden fixed left-0 top-0 h-full w-64 bg-primary-800 z-40 flex flex-col transition-transform",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className={cn(
        "hidden lg:flex flex-col bg-primary-800 h-screen sticky top-0 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-md text-gray-600 hover:text-gray-900"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </>
  );
}
