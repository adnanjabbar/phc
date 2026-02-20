"use client";
import React, { useState } from "react";
import { signOut } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopNavProps {
  userName: string;
  userEmail?: string;
  userImage?: string | null;
  facilityName?: string;
}

export function TopNav({ userName, userEmail, userImage, facilityName }: TopNavProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
        {facilityName && (
          <div className="hidden sm:block">
            <span className="text-sm text-gray-500">Facility: </span>
            <span className="text-sm font-medium text-gray-900">{facilityName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="relative">
          <button
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <Avatar src={userImage} fallback={userName} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-none">{userName}</p>
              {userEmail && <p className="text-xs text-gray-500 mt-0.5">{userEmail}</p>}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  {userEmail && <p className="text-xs text-gray-500">{userEmail}</p>}
                </div>
                <div className="p-1">
                  <button
                    className={cn("flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md")}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
