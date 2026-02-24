"use client";
import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Wallet, AlertCircle } from 'lucide-react';
export default function DashboardPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(json => setData(json));
  }, []);

  if (!data) return <div className="p-10 animate-pulse text-slate-400 font-bold">CALCULATING MARKET STATS...</div>;

  const stats = [
    { label: "Total Market Principal", value: `₹${data.stats.totalPrincipal.toLocaleString()}`, icon: <Wallet className="text-blue-600" />, color: "bg-blue-50" },
    { label: "Active Borrowers", value: data.stats.activeBorrowers, icon: <Users className="text-purple-600" />, color: "bg-purple-50" },
    { label: "Today's Collection", value: `₹${data.stats.todayCollection.toLocaleString()}`, icon: <TrendingUp className="text-green-600" />, color: "bg-green-50" },
    { label: "Collected Fines", value: `₹${data.stats.totalFines.toLocaleString()}`, icon: <AlertCircle className="text-red-600" />, color: "bg-red-50" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-xl ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section: Recent Collections */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-sm font-black uppercase tracking-tighter text-slate-600">Recent Live Transactions</h2>
          <button className="text-blue-600 text-xs font-bold hover:underline bg-blue-50 px-3 py-1 rounded-full">View History</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-white border-b border-slate-50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">User Name</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Time/Date</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Amount</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.recentTransactions.map((tx, index) => (
              <tr key={index} className="hover:bg-slate-50/50 transition cursor-default">
                <td className="px-6 py-4 font-bold text-slate-800">{tx.name}</td>
                <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                  {new Date(tx.date).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                   <div className="font-black text-green-600">₹{tx.amount}</div>
                   {tx.fine > 0 && <div className="text-[9px] text-red-500 font-bold">+₹{tx.fine} Fine</div>}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    Received
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}