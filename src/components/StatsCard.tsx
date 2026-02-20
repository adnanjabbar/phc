import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  className?: string;
  iconBg?: string;
}

export function StatsCard({ title, value, subtitle, icon, trend, className, iconBg }: StatsCardProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-6 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <div className={cn("mt-2 flex items-center gap-1 text-sm", trend.value > 0 ? "text-green-600" : trend.value < 0 ? "text-red-600" : "text-gray-500")}>
              {trend.value > 0 ? <TrendingUp className="w-4 h-4" /> : trend.value < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              <span>{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn("p-3 rounded-xl", iconBg || "bg-primary-50")}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
