import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import type { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;