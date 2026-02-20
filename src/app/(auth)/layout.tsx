import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PHC MSDS Compliance - Authentication",
  description: "Punjab Healthcare Commission MSDS Compliance Platform",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {children}
      </div>
    </div>
  );
}
