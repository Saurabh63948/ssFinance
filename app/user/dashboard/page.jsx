"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/user/me") 
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  const loan = user.loanDetails;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      
      {/* --- SIDEBAR (Desktop) / Bottom Nav (Mobile) --- */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between order-2 md:order-1 fixed md:relative bottom-0 z-50 md:z-auto h-20 md:h-screen shadow-2xl md:shadow-none">
        <div className="hidden md:block">
          <h2 className="text-2xl font-black text-blue-700 tracking-tighter mb-10">VITTA-LEKHA</h2>
          <nav className="space-y-4">
            <div className="bg-blue-50 text-blue-700 p-3 rounded-xl font-bold flex items-center gap-3 cursor-pointer">
               🏠 Dashboard
            </div>
            <div className="text-slate-400 p-3 rounded-xl font-medium hover:bg-slate-50 transition cursor-pointer flex items-center gap-3">
               📊 History
            </div>
            <div className="text-slate-400 p-3 rounded-xl font-medium hover:bg-slate-50 transition cursor-pointer flex items-center gap-3">
               🛡️ Privacy
            </div>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="flex md:flex-col items-center justify-between md:items-start w-full gap-4">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                {user.name[0]}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-slate-800 leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Verified Borrower</p>
              </div>
           </div>
           <button 
             onClick={handleLogout}
             className="bg-red-50 text-red-500 p-2 md:w-full md:mt-4 rounded-xl text-sm font-bold hover:bg-red-100 transition"
           >
             LOGOUT
           </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-6 md:p-12 order-1 md:order-2 overflow-y-auto mb-20 md:mb-0">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Ram Ram, {user.name}! </h1>
            <p className="text-slate-500 font-medium">Aapka financial overview yahan hai.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Main Loan Card & Stats */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Elegant Loan Card */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
              <div className="absolute top-[-20%] right-[-10%] h-64 w-64 bg-blue-600 rounded-full blur-[100px] opacity-40"></div>
              
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Total Payable Amount</p>
                  <h2 className="text-5xl font-black mt-2 tracking-tighter italic">₹{loan?.totalPayableWithInterest.toLocaleString()}</h2>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold border border-white/20">
                   ACTIVE LOAN
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-4 mt-12 pt-8 border-t border-white/10">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-black">Daily Installment</p>
                  <p className="text-2xl font-bold text-blue-400">₹{loan?.dailyPayableAmount}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-black">Due Date</p>
                  <p className="text-lg font-bold">{new Date(loan?.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Principal</p>
                 <p className="text-2xl font-black text-slate-800">₹{loan?.principalAmount}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Interest Rate</p>
                 <div className="flex items-center gap-2">
                    <p className="text-2xl font-black text-green-600">{loan?.interestRate}%</p>
                    <span className="text-[10px] text-slate-400 font-medium leading-none">p.a.<br/>Flat</span>
                 </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100">
               <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
                 <span className="h-2 w-2 bg-blue-600 rounded-full"></span> Secure Documents
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="group cursor-pointer">
                    <p className="text-[9px] font-black text-slate-400 mb-2 uppercase">Aadhaar Front</p>
                    <div className="h-40 bg-slate-50 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center group-hover:border-blue-300 transition-all">
                       <img src={user.aadhaarImages?.frontSide?.url} className="w-full h-full object-cover" alt="Front" />
                    </div>
                 </div>
                 <div className="group cursor-pointer">
                    <p className="text-[9px] font-black text-slate-400 mb-2 uppercase">Aadhaar Back</p>
                    <div className="h-40 bg-slate-50 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center group-hover:border-blue-300 transition-all">
                       <img src={user.aadhaarImages?.backSide?.url} className="w-full h-full object-cover" alt="Back" />
                    </div>
                 </div>
               </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-500 to-green-700 p-6 rounded-[2rem] text-white shadow-lg shadow-green-100">
               <p className="text-xs font-black uppercase text-green-100">Credit Score Tip </p>
               <h4 className="text-lg font-bold mt-2">Time par kist bharein aur ₹10,000 tak ka extra loan paayein!</h4>
            </div>

            <div className="bg-blue-600 p-8 rounded-[2rem] text-white relative overflow-hidden">
               <div className="relative z-10">
                 <h4 className="text-xl font-black leading-tight italic">Safe & Secure Finance Management</h4>
                 <p className="text-blue-100 text-sm mt-4 font-medium leading-relaxed">Vitta-Lekha aapke data ko 256-bit encryption ke saath secure rakhta hai.</p>
               </div>
               <div className="absolute bottom-[-20px] right-[-20px] text-white/10 text-8xl font-black select-none"></div>
            </div>

            {/* WhatsApp Support Button integrated in sidebar */}
            <button className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white p-5 rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95">
               SUPPORT ON WHATSAPP
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
