
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { 
  LayoutDashboard, Users, Wallet, FileText, Fingerprint,
  ArrowUpRight, Download, Percent, ArrowRight, 
  AlertCircle, Landmark, Coins, Banknote, ShieldCheck
} from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/get-users")
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  }, []);


  const myInvestment = users.reduce((acc, u) => acc + Number(u.loanDetails?.principalAmount || 0), 0);
  const totalCollectedCash = users.reduce((acc, u) => {
    return acc + (u.collections?.reduce((s, c) => s + Number(c.amountCollected), 0) || 0);
  }, 0);

  const totalExpectedFromMarket = users.reduce((acc, u) => acc + Number(u.loanDetails?.totalPayableWithInterest || 0), 0);
  const totalFinesImposed = users.reduce((acc, u) => {
    return acc + (u.collections?.reduce((s, c) => s + (Number(c.lateFine) || 0), 0) || 0);
  }, 0);

  const marketDebt = (totalExpectedFromMarket + totalFinesImposed) - totalCollectedCash;
  const realizedProfit = Math.max(0, totalCollectedCash - myInvestment) + 
    users.reduce((acc, u) => acc + (u.collections?.reduce((s, c) => s + (Number(c.lateFine) || 0), 0) || 0), 0);
  
  const totalPotentialProfit = (totalExpectedFromMarket - myInvestment) + totalFinesImposed;

  // --- 2. RISK LOGIC ---
  const riskyUsers = users.filter(user => {
    const userDue = (Number(user.loanDetails?.totalPayableWithInterest || 0) + 
                    (user.collections?.reduce((s, c) => s + (Number(c.lateFine) || 0), 0) || 0)) - 
                    (user.collections?.reduce((s, c) => s + Number(c.amountCollected), 0) || 0);
    if (userDue <= 0) return false;
    const lastDate = user.collections?.length > 0 
      ? new Date(user.collections[user.collections.length - 1].date) 
      : new Date(user.loanDetails?.startDate || Date.now());
    return Math.ceil(Math.abs(new Date() - lastDate) / (1000 * 60 * 60 * 24)) >= 3;
  });

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-blue-500 font-black tracking-widest animate-pulse uppercase">Syncing Ledger...</div>;

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200">
      <aside className="w-64 bg-[#020617] border-r border-white/5 fixed h-full z-40 hidden lg:flex flex-col">
        <div className="p-8 flex items-center gap-3">
          <Fingerprint className="text-blue-500" size={28} />
          <span className="text-xl font-black text-white italic tracking-tighter uppercase">VittaLekha</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={<LayoutDashboard size={18}/>} label="Dashboard" onClick={() => router.push("/admin/dashboard")} />
          <NavItem icon={<Users size={18}/>} label="Borrowers" onClick={() => router.push("/admin/borrowers")} />
          <NavItem icon={<Wallet size={18}/>} label="Collections" onClick={() => router.push("/admin/collections")} />
          <NavItem icon={<FileText size={18}/>} label="Reports" active />
        </nav>
      </aside>

      <main className="flex-1 p-6 lg:ml-64 lg:p-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">Financial Audit</h1>
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Market Debt & Liquidity Analysis</p>
          </div>
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
             {['Today', 'Monthly', 'Annual'].map((p) => (
               <button key={p} className="px-4 py-2 text-[9px] font-black text-white hover:bg-blue-600 rounded-lg transition-all uppercase">{p}</button>
             ))}
          </div>
        </header>

        {/* FINANCIAL CARDS - Fixed Scaling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <StatBox label="Principal Out" value={myInvestment} icon={<Landmark/>} color="bg-slate-900 border-white/10" />
          <StatBox label="Market Debt" value={marketDebt} icon={<ArrowUpRight/>} color="bg-blue-600 shadow-xl shadow-blue-500/20" isHighlight />
          <StatBox label="Net Profit" value={realizedProfit} icon={<Banknote/>} color="bg-emerald-600 shadow-xl shadow-emerald-500/20" />
          <StatBox label="Fine Collected" value={totalFinesImposed} icon={<Coins/>} color="bg-orange-600 shadow-xl shadow-orange-500/20" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Recovery Chart Area */}
          <div className="lg:col-span-8 bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-3xl">
             <div className="flex justify-between items-center mb-12">
                <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Recovery Performance</h2>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-500 uppercase">Cash Collected</p>
                   <p className="text-2xl font-black text-blue-500">Rs.{totalCollectedCash.toLocaleString()}</p>
                </div>
             </div>
             
             <div className="space-y-12">
                <ProgressItem label="Principal Back" current={totalCollectedCash} total={myInvestment} color="bg-blue-500" />
                <ProgressItem label="Target Profit" current={realizedProfit} total={totalPotentialProfit} color="bg-emerald-500" />
             </div>
          </div>

          {/* RIGHT: Risk Board */}
          <div className="lg:col-span-4 bg-red-500/5 border border-red-500/10 rounded-[2.5rem] p-8">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 text-red-500">
                    <AlertCircle size={22} />
                    <h2 className="text-lg font-black uppercase italic">High Risk</h2>
                </div>
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-md font-black">{riskyUsers.length}</span>
             </div>
             
             <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {riskyUsers.length > 0 ? riskyUsers.map((user) => (
                   <div key={user._id} onClick={() => router.push(`/admin/users/${user._id}`)} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-red-500/10 cursor-pointer transition-all border border-white/5 group">
                      <div>
                         <p className="text-white font-bold text-xs">{user.name}</p>
                         <p className="text-red-400 text-[8px] font-black uppercase">Payment Overdue</p>
                      </div>
                      <ArrowRight size={14} className="text-white/20 group-hover:text-white transition-all" />
                   </div>
                )) : (
                   <div className="flex flex-col items-center justify-center h-40 opacity-20 italic">
                      <ShieldCheck size={40} className="mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest">Market Clean</p>
                   </div>
                )}
             </div>
             <button className="w-full mt-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Report Defaulters</button>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatBox({ label, value, icon, color, isHighlight }) {
  return (
    <div className={`${color} p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group`}>
      <div className="relative z-10">
        <div className={`${isHighlight ? 'bg-white/20' : 'bg-white/5'} w-fit p-2.5 rounded-xl mb-4 text-white`}>{icon}</div>
        <p className={`text-[9px] font-black uppercase tracking-widest ${isHighlight ? 'text-white/70' : 'text-slate-500'}`}>{label}</p>
        <p className="text-xl md:text-2xl font-black tracking-tighter text-white truncate">Rs.{Math.round(value).toLocaleString()}</p>
      </div>
      <div className="absolute -right-4 -bottom-4 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700 scale-150">
        {icon}
      </div>
    </div>
  );
}

function ProgressItem({ label, current, total, color }) {
  const pct = Math.min((current / total) * 100, 100) || 0;
  return (
    <div>
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
        <span className="text-slate-400">{label}</span>
        <span className={pct >= 100 ? "text-emerald-400" : "text-white"}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
        <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(59,130,246,0.3)]`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all font-black text-[11px] uppercase tracking-wider ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
      {icon} {label}
    </button>
  );
}