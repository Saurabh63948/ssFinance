"use client";
import React from 'react';
import { LayoutDashboard, Users, IndianRupee, History, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const router = useRouter();

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Overview", path: "/admin/dashboard" },
    { icon: <Users size={20} />, label: "Borrowers", path: "/admin/users" },
    { icon: <IndianRupee size={20} />, label: "Daily Entry", path: "/admin/collection" },
    { icon: <History size={20} />, label: "Reports", path: "/admin/reports" },
  ];

  const handleLogout = async () => {
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col shadow-xl">
        <div className="p-6 text-2xl font-bold border-b border-blue-800">
          Vitta-Lekha Admin
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-blue-800 transition-colors"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button 
          onClick={handleLogout}
          className="p-4 m-4 flex items-center gap-3 bg-red-600 rounded-lg hover:bg-red-700 transition"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Dashboard Overview</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Admin Account</span>
          </div>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}