'use client';

import React, { useState } from "react";
import Sidebar from "@/components/shared/Sidebar";
import Header from "@/components/shared/Header";
import { cn } from "@/lib/utils";
import AuthGuard from "@/components/shared/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-fond-doux overflow-hidden">
        {/* Sidebar for mobile */}
        <div className={cn("fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden", { "hidden": !isSidebarOpen })} onClick={toggleSidebar}></div>
        <div className={cn("fixed top-0 left-0 h-full z-40 transform transition-transform duration-300 ease-in-out lg:hidden", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
          <Sidebar />
        </div>

        {/* Sidebar for desktop */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <Sidebar />
        </div>

        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          <Header onMenuClick={toggleSidebar} />
          <main className="flex-1 relative overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
