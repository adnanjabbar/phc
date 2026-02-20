import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { UserRole } from "@prisma/client";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user;
  let facilityName: string | undefined;

  if (user.facilityId) {
    const facility = await prisma.facility.findUnique({
      where: { id: user.facilityId },
      select: { name: true },
    });
    facilityName = facility?.name;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar role={user.role as UserRole} facilityName={facilityName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav
          userName={user.name || user.username}
          userEmail={user.email}
          userImage={null}
          facilityName={facilityName}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
