
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Wallet, Plus, AlertTriangle, CalendarDays, 
  Trash2, Edit3, CheckCircle2, XCircle, Info,
  Clock
} from "lucide-react";
import toast from "react-hot-toast";

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  // Data States
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [amount, setAmount] = useState("");
  const [lateFine, setLateFine] = useState("0");
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState("EMI Collection");
  const [editingId, setEditingId] = useState(null); 

  // Extension States
  const [showExtension, setShowExtension] = useState(false);
  const [newEndDate, setNewEndDate] = useState("");
  const [extensionFine, setExtensionFine] = useState("0");

  const fetchUser = async () => {
    const res = await fetch(`/api/admin/get-user-detail?id=${id}`);
    const data = await res.json();
    setUser(data);
  };

  useEffect(() => { fetchUser(); }, [id]);

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Loading Fin-Data...</p>
    </div>
  );

  // --- CALCULATIONS ---
  const totalFines = user.collections.reduce((acc, curr) => acc + (Number(curr.lateFine) || 0), 0);
  const totalPaid = user.collections.reduce((acc, curr) => acc + (Number(curr.amountCollected) || 0), 0);
  const currentOutstanding = (Number(user.loanDetails.totalPayableWithInterest) + totalFines) - totalPaid;
  
  const today = new Date().setHours(0,0,0,0);
  const deadline = new Date(user.loanDetails.endDate).setHours(0,0,0,0);
  const isOverdue = today >= deadline;

  // --- ACTIONS ---

  const handlePayment = async () => {
    if (!amount && !lateFine) return toast.error("plz provide input");
    setLoading(true);
    
    const endpoint = editingId ? "/api/admin/edit-payment" : "/api/admin/collect-payment";
    
    const res = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify({ 
        userId: id, 
        entryId: editingId,
        amount: Number(amount), 
        lateFine: Number(lateFine),
        date: collectionDate, 
        remarks: remarks 
      })
    });

    if (res.ok) {
      resetForm();
      await fetchUser();
      toast.success(editingId ? "Entry Updated!" : "Payment Recorded!");
    }
    setLoading(false);
  };

  const deleteEntry = async (entryId) => {
    if (!confirm("Are you sure? Isse Daily Kist badal jayegi!")) return;
    setLoading(true);
    const res = await fetch("/api/admin/delete-entry", {
      method: "POST",
      body: JSON.stringify({ userId: id, entryId })
    });
    if (res.ok) await fetchUser();
    setLoading(false);
  };

  const startEdit = (col) => {
  setEditingId(col._id);
  setAmount(col.amountCollected);
  setLateFine(col.lateFine);
  const d = new Date(col.date);
  const formattedDate = d.toISOString().split('T')[0];
  setCollectionDate(formattedDate);
  setRemarks(col.remarks);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

  const resetForm = () => {
    setEditingId(null);
    setAmount("");
    setLateFine("0");
    setRemarks("EMI Collection");
  };

  const handleExtension = async () => {
    if (!newEndDate) return toast.error("select Date plz");
    setLoading(true);
    const res = await fetch("/api/admin/extend-loan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, newEndDate, fine: Number(extensionFine), date: collectionDate })
    });
    if (res.ok) {
      setShowExtension(false);
      await fetchUser();
      toast.success("Loan Extended!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-20 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button onClick={() => router.back()} className="group flex items-center gap-2 font-bold text-slate-500 hover:text-black transition-all">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
             <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Server</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Overdue Alert */}
        {isOverdue && (
          <div className="bg-orange-500 rounded-3xl p-1 flex flex-col md:flex-row items-center justify-between shadow-lg shadow-orange-200 overflow-hidden">
            <div className="flex items-center gap-4 p-4 text-white">
              <AlertTriangle size={28} className="animate-bounce" />
              <div>
                <p className="font-black text-lg leading-none uppercase tracking-tighter">Deadline Alert</p>
                <p className="text-sm font-bold opacity-90 italic">Payment window expired on {new Date(deadline).toLocaleDateString()}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowExtension(true)}
              className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-black text-sm m-2 hover:bg-slate-50 transition-all active:scale-95"
            >
              MODIFY LOAN PERIOD
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Dashboard - 8 Cols */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Balance Hero Card */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-20 -mt-20 rounded-full"></div>
              
              <div className="relative z-10">
                <p className="text-blue-400 text-xs font-black uppercase tracking-[0.4em] mb-4">Total Outstanding Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-light text-slate-500">₹</span>
                  <h2 className="text-7xl md:text-8xl font-black tracking-tighter">
                    {currentOutstanding.toLocaleString()}
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/10">
                  <div className="space-y-1">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Next Kist</p>
                    <p className="text-2xl font-black text-blue-400">₹{user.loanDetails.dailyPayableAmount}</p>
                  </div>
                  <div className="space-y-1 border-x border-white/5 px-6">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Fines</p>
                    <p className="text-2xl font-black text-red-500">₹{totalFines}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Paid</p>
                    <p className="text-2xl font-black text-green-400">₹{totalPaid}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-black text-slate-400 text-xs uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} /> Transaction Ledger
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="p-6">Date</th>
                      <th className="p-6">Description</th>
                      <th className="p-6 text-right">Fine</th>
                      <th className="p-6 text-right">Paid</th>
                      <th className="p-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[...user.collections].reverse().map((col, i) => (
                      <tr key={i} className="hover:bg-blue-50/30 transition-all group">
                        <td className="p-6 font-bold text-slate-600 text-sm">
                          {new Date(col.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="p-6">
                          <p className="font-bold text-slate-800 text-sm leading-none mb-1">{col.remarks}</p>
                          <p className="text-[10px] text-slate-400 font-medium tracking-tight">Ref: {col._id.slice(-6).toUpperCase()}</p>
                        </td>
                        <td className="p-6 text-right font-black text-red-500">
                          {col.lateFine > 0 ? `+₹${col.lateFine}` : "—"}
                        </td>
                        <td className="p-6 text-right font-black text-slate-900 text-lg">
                          ₹{col.amountCollected}
                        </td>
                        <td className="p-6">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(col)} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 shadow-sm border border-transparent hover:border-blue-100 transition-all">
                              <Edit3 size={16} />
                            </button>
                            <button onClick={() => deleteEntry(col._id)} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-600 shadow-sm border border-transparent hover:border-red-100 transition-all">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar - 4 Cols */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`bg-white rounded-[2rem] p-8 border-2 transition-all ${editingId ? 'border-blue-500 shadow-blue-100' : 'border-white shadow-xl shadow-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter">
                  {editingId ? <Edit3 className="text-blue-600" /> : <Wallet className="text-blue-600"/>} 
                  {editingId ? "Edit Entry" : "Quick Collect"}
                </h3>
                {editingId && (
                  <button onClick={resetForm} className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-md">CANCEL</button>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Collection Date</label>
                  <div className="bg-slate-100 p-4 rounded-2xl flex items-center gap-3">
                    <CalendarDays size={18} className="text-slate-400" />
                    <input type="date" value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} className="bg-transparent w-full font-bold outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 text-blue-600">EMI Amount (Cash In)</label>
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <input type="number" placeholder="₹ 0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-transparent w-full font-black text-2xl text-blue-700 outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 text-red-600">Late Fine (Add to Loan)</label>
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                    <input type="number" placeholder="₹ 0" value={lateFine} onChange={(e) => setLateFine(e.target.value)} className="bg-transparent w-full font-black text-2xl text-red-700 outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Remarks</label>
                  <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="bg-slate-100 p-4 rounded-2xl w-full font-bold outline-none text-sm" placeholder="Purpose of payment..." />
                </div>

                <button 
                  onClick={handlePayment} 
                  disabled={loading} 
                  className={`w-full p-5 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-black'} text-white shadow-slate-200`}
                >
                  {loading ? "PROCESSING..." : editingId ? "UPDATE CHANGES" : "CONFIRM RECEIPT"}
                </button>
              </div>
            </div>

            {/* Borrower Info Mini Card */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200">
               <div className="flex items-center gap-4 mb-4">
                 <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500">
                   {user.name.charAt(0)}
                 </div>
                 <div>
                   <h4 className="font-black text-slate-900 leading-none">{user.name}</h4>
                   <p className="text-xs font-bold text-slate-400 mt-1">ID: {id.slice(-8)}</p>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Phone</p>
                    <p className="text-xs font-bold">{user.phone}</p>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Status</p>
                    <p className="text-xs font-bold text-green-600 italic">● Active</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Extension Modal */}
      {showExtension && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] max-w-md w-full p-10 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter uppercase italic">Extension</h3>
            <p className="text-slate-500 text-sm font-medium mb-8">Nayi deadline chuno aur penalty add karo.</p>
            
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">New End Date</label>
                <input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} className="bg-transparent w-full font-black text-xl outline-none" />
              </div>
              <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-red-700">
                <label className="text-[10px] font-black text-red-400 uppercase block mb-2">Extension Fine (One Time)</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black">₹</span>
                  <input type="number" value={extensionFine} onChange={(e) => setExtensionFine(e.target.value)} className="bg-transparent w-full font-black text-3xl outline-none" />
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowExtension(false)} className="flex-1 p-5 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all uppercase text-xs">Cancel</button>
                <button onClick={handleExtension} className="flex-[2] bg-slate-900 text-white p-5 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all">UPDATE</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}