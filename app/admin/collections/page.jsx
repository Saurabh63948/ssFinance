"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Search,
  CheckCircle2,
  Clock,
  IndianRupee,
  ArrowRight,
  Filter,
  LayoutDashboard,
  Users,
  FileText,
  Fingerprint,
  AlertTriangle,
} from "lucide-react";

export default function CollectionsPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchDailyTasks = async () => {
    try {
      const res = await fetch("/api/admin/get-users");
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      console.error("Error fetching collections");
    }
  };

  // useEffect(() => {
  //   fetchDailyTasks();
  // }, []);

  const todayStr = new Date().toDateString();

  const stats = {
    totalExpected: users.reduce(
      (acc, u) => acc + (Number(u.loanDetails?.dailyPayableAmount) || 0),
      0,
    ),
    collectedToday: users.reduce((acc, u) => {
      const todayEntry = u.collections?.find(
        (c) => new Date(c.date).toDateString() === todayStr,
      );
      return acc + (Number(todayEntry?.amountCollected) || 0);
    }, 0),
    pendingCount: users.filter((u) => {
      const todayEntry = u.collections?.find(
        (c) => new Date(c.date).toDateString() === todayStr,
      );
      const paidAmount = Number(todayEntry?.amountCollected || 0);
      const targetAmount = Number(u.loanDetails?.dailyPayableAmount || 0);
      return (
        paidAmount < targetAmount &&
        Number(u.loanDetails?.totalPayableWithInterest) > 0
      );
    }).length,
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside className="w-72 bg-[#0F172A] fixed h-full z-40 hidden lg:flex flex-col shadow-2xl">
        <div className="p-8 mb-4 flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Fingerprint className="text-white" size={24} />
          </div>
          <span className="text-xl font-black text-white italic">
            VITTA<span className="text-blue-400">LEKHA</span>
          </span>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Overview"
            onClick={() => router.push("/admin/dashboard")}
          />
          <NavItem
            icon={<Users size={20} />}
            label="Borrowers"
            onClick={() => router.push("/admin/users")}
          />
          <NavItem icon={<Wallet size={20} />} label="Collections" active />
          <NavItem
            icon={<FileText size={20} />}
            label="Reports"
            onClick={() => router.push("/admin/reports")}
          />
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-6 lg:p-12 lg:ml-72">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
              Daily Recovery
            </h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] mt-1">
              Cash Flow Management
            </p>
          </div>
          <div className="flex bg-white p-1.5 rounded-2xl border-2 border-slate-100 shadow-sm">
            <FilterBtn
              active={filter === "all"}
              label="All"
              onClick={() => setFilter("all")}
            />
            <FilterBtn
              active={filter === "pending"}
              label="Pending/Partial"
              onClick={() => setFilter("pending")}
            />
            <FilterBtn
              active={filter === "paid"}
              label="Full Paid"
              onClick={() => setFilter("paid")}
            />
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <StatCard
            label="Market Target"
            value={`₹${stats.totalExpected}`}
            icon={<Wallet size={24} />}
            color="indigo"
          />
          <StatCard
            label="Cash Collected"
            value={`₹${stats.collectedToday}`}
            icon={<CheckCircle2 size={24} />}
            color="green"
          />
          <StatCard
            label="Shortage/Pending"
            value={stats.pendingCount}
            icon={<AlertTriangle size={24} />}
            color="red"
          />
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
            size={22}
          />
          <input
            type="text"
            placeholder="Search by name or phone..."
            className="w-full bg-white border-2 border-slate-100 rounded-[2rem] py-5 pl-16 pr-8 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="space-y-4">
          {users
            .filter((u) =>
              u.name.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            .map((user) => {
              const todayEntry = user.collections?.find(
                (c) => new Date(c.date).toDateString() === todayStr,
              );
              const paidAmount = Number(todayEntry?.amountCollected || 0);
              const targetAmount = Number(
                user.loanDetails?.dailyPayableAmount || 0,
              );

              const isFullPaid = paidAmount >= targetAmount;
              const isPartial = paidAmount > 0 && paidAmount < targetAmount;
              const isNotPaid = paidAmount === 0;

              // Filter Logic
              if (filter === "pending" && isFullPaid) return null;
              if (filter === "paid" && !isFullPaid) return null;

              return (
                <div
                  key={user._id}
                  className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 flex flex-col lg:flex-row items-center justify-between gap-8 hover:border-blue-100 transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-6 w-full lg:w-1/3">
                    <div
                      className={`h-16 w-16 rounded-3xl flex items-center justify-center font-black text-2xl shadow-lg transition-transform group-hover:scale-110 ${isFullPaid ? "bg-green-500 text-white" : isPartial ? "bg-orange-400 text-white" : "bg-slate-100 text-slate-400"}`}
                    >
                      {isFullPaid ? (
                        <CheckCircle2 size={32} strokeWidth={3} />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-xl tracking-tight">
                        {user.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${isFullPaid ? "bg-green-100 text-green-600" : isPartial ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"}`}
                        >
                          {isFullPaid
                            ? "Full Paid"
                            : isPartial
                              ? `Partial (₹${targetAmount - paidAmount} Left)`
                              : "No Payment"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 justify-around w-full border-y lg:border-y-0 lg:border-x border-slate-100 py-4 lg:py-0">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Target Today
                      </p>
                      <p className="font-black text-slate-800 text-lg">
                        ₹{targetAmount}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Paid Today
                      </p>
                      <p
                        className={`font-black text-lg ${isPartial ? "text-orange-500" : isFullPaid ? "text-green-600" : "text-slate-800"}`}
                      >
                        ₹{paidAmount}
                      </p>
                    </div>
                  </div>

                  <div className="w-full lg:w-auto">
                    <button
                      onClick={() => router.push(`/admin/users/${user._id}`)}
                      className={`w-full lg:w-auto px-10 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/10 ${isFullPaid ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white hover:-translate-y-1"}`}
                      disabled={isFullPaid}
                    >
                      {isFullPaid
                        ? "COMPLETED"
                        : isPartial
                          ? "COMPLETE REST"
                          : "COLLECT NOW"}{" "}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </main>
    </div>
  );
}

// --- Internal Components ---
function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-sm ${active ? "bg-blue-600 text-white shadow-xl shadow-blue-500/30" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
    >
      {icon} {label}
    </button>
  );
}

function StatCard({ label, value, icon, color }) {
  const theme = {
    indigo: "from-indigo-600 to-blue-500",
    green: "from-emerald-600 to-green-500",
    red: "from-rose-600 to-red-500",
  };
  return (
    <div
      className={`bg-gradient-to-br ${theme[color]} p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200 relative overflow-hidden`}
    >
      <div className="relative z-10">
        <div className="bg-white/20 w-fit p-3 rounded-2xl mb-4 backdrop-blur-md">
          {icon}
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
          {label}
        </p>
        <p className="text-4xl font-black mt-1 tracking-tighter">{value}</p>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
        {icon}
      </div>
    </div>
  );
}

function FilterBtn({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${active ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:bg-slate-50"}`}
    >
      {label}
    </button>
  );
}
