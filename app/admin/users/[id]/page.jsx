
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Wallet, AlertTriangle, CalendarDays,
  Trash2, Edit3, Clock, ExternalLink, ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";

export default function UserDetailPage() {

  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form
  const [amount, setAmount] = useState("");
  const [lateFine, setLateFine] = useState("0");
  const [collectionDate, setCollectionDate] =
    useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("EMI Collection");
  const [editingId, setEditingId] = useState(null);

  // Extension
  const [showExtension, setShowExtension] = useState(false);
  const [newEndDate, setNewEndDate] = useState("");
  const [extensionFine, setExtensionFine] = useState("0");
  const fetchUser = async () => {
    const res = await fetch(`/api/admin/get-user-detail?id=${id}`);
    const data = await res.json();
    setUser(data);
  };
  useEffect(() => {
    fetchUser();
  }, [id]);

  if (!user)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  const totalFines = user.collections.reduce(
    (acc, c) => acc + (Number(c.lateFine) || 0), 0
  );
  const totalPaid = user.collections.reduce(
    (acc, c) => acc + (Number(c.amountCollected) || 0), 0
  );
  const currentOutstanding =
    (Number(user.loanDetails.totalPayableWithInterest) + totalFines)
    - totalPaid;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(user.loanDetails.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(user.loanDetails.endDate);
  endDate.setHours(0, 0, 0, 0);

  // ======================
  // TOTAL DURATION
  // ======================

  const totalDurationDays = Math.ceil(
    (endDate - startDate) / (1000 * 60 * 60 * 24)
  );


  // ======================
  // LAST PAYMENT DATE
  // ======================

  let lastPaymentDate = startDate;

  if (user.collections.length > 0) {

    const sorted = [...user.collections].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    lastPaymentDate = new Date(sorted[0].date);
    lastPaymentDate.setHours(0, 0, 0, 0);

  }


  const daysUsed = Math.ceil(
    (lastPaymentDate - startDate) / (1000 * 60 * 60 * 24)
  );


  let daysRemaining = totalDurationDays - daysUsed;

  if (daysRemaining < 0)
    daysRemaining = 0;


  // ======================
  // EXCEEDED LOGIC
  // ======================

  let exceededDays = 0;

  if (today > endDate) {

    exceededDays = Math.ceil(
      (today - endDate) / (1000 * 60 * 60 * 24)
    );

  }


  const isOverdue =
    daysRemaining <= 0;
  

  // ======================
  // EMI CALCULATION
  // ======================

  let displayDays;

  if (isOverdue)
    displayDays = exceededDays || 1;

  else
    displayDays = daysRemaining || 1;


  const dynamicKist = Math.ceil(
    currentOutstanding / displayDays
  );


  // ======================
  // ACTIONS
  // ======================

  const handlePayment = async () => {

    if (Number(amount) > currentOutstanding)
      return toast.error(
        `Max allowed ₹${currentOutstanding}`
      );

    setLoading(true);

    const endpoint =
      editingId
        ? "/api/admin/edit-payment"
        : "/api/admin/collect-payment";

    const res = await fetch(endpoint, {

      method: "POST",

      body: JSON.stringify({

        userId: id,
        entryId: editingId,
        amount: Number(amount),
        lateFine: Number(lateFine),
        date: collectionDate,
        remarks

      })

    });

    if (res.ok) {

      resetForm();

      await fetchUser();

      toast.success("Payment recorded");

    }

    setLoading(false);

  };


  const deleteEntry = async (entryId) => {

    if (!confirm("Delete entry?"))
      return;

    await fetch("/api/admin/delete-entry", {

      method: "POST",

      body: JSON.stringify({
        userId: id,
        entryId
      })

    });

    fetchUser();
  };


  const startEdit = (col) => {

    setEditingId(col._id);
    setAmount(col.amountCollected);
    setLateFine(col.lateFine);
    setCollectionDate(
      new Date(col.date).toISOString().split("T")[0]
    );
    setRemarks(col.remarks);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };


  const resetForm = () => {

    setEditingId(null);
    setAmount("");
    setLateFine("0");
    setRemarks("EMI Collection");

  };


  // const handleExtension = async () => {

  //   if (!newEndDate)
  //     return toast.error("Select date");

  //   setLoading(true);

  //   await fetch("/api/admin/extend-loan", {

  //     method: "POST",

  //     headers: {
  //       "Content-Type": "application/json"
  //     },

  //     body: JSON.stringify({

  //       userId: id,
  //       newEndDate,
  //       fine: Number(extensionFine),
  //       date: collectionDate

  //     })

  //   });

  //   setShowExtension(false);

  //   await fetchUser();

  //   setLoading(false);

  //   toast.success("Loan Extended");

  // };


  // ======================
  // UI
  // ======================


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
console.log(exceededDays)
console.log(isOverdue,"sar")

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 font-sans text-slate-900">
      {/* Sticky Mobile Header */}

      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 md:px-6 md:py-4">
     
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center gap-2 font-bold text-slate-600 hover:text-black transition-all text-sm md:text-base">
            <ArrowLeft size={18} /> <span className="hidden md:inline">Back to Dashboard</span> <span className="md:hidden">Back</span>
          </button>
          <div className="flex items-center gap-2">
             <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live: {user.name.split(' ')[0]}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 space-y-6">
        
        {/* Overdue Alert */}
        {isOverdue && (
          <div className="bg-red-600 rounded-2xl md:rounded-[2rem] p-4 md:p-6 flex flex-col md:flex-row items-center justify-between shadow-xl shadow-red-100">
            <div className="flex items-center gap-4 text-white mb-4 md:mb-0">
              <AlertTriangle size={32} className="animate-bounce shrink-0" />
              <div>
                <p className="font-black text-lg md:text-xl uppercase tracking-tighter">Loan Overdue</p>
                <p className="text-xs md:text-sm font-bold opacity-80">Deadline was: </p>
              </div>
            </div>
            <button 
              onClick={() => setShowExtension(true)}
              className="w-full md:w-auto bg-white text-red-600 px-8 py-3 rounded-xl font-black text-sm hover:scale-105 transition-all shadow-lg"
            >
              EXTEND DEADLINE
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Dashboard */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Balance Hero Card */}
            <div className="bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/30 blur-[80px] rounded-full"></div>
              <div className="relative z-10">
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Current Total Outstanding</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-4xl font-light text-slate-500">₹</span>
                  <h2 className="text-5xl md:text-7xl font-black tracking-tighter">
                    {currentOutstanding.toLocaleString()}
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
                  <div className="space-y-1">
                    <p className="text-slate-500 text-[9px] font-black uppercase">Today's Kist</p>
                    <p className="text-xl md:text-2xl font-black text-blue-400">₹{dynamicKist}</p>
                  </div>
                  <div className="space-y-1 border-l md:border-x border-white/10 pl-4 md:px-6">
                    <p className="text-slate-500 text-[9px] font-black uppercase">Fines Added</p>
                    <p className="text-xl md:text-2xl font-black text-red-500">₹{totalFines}</p>
                  </div>
                  <div className="hidden md:block space-y-1">
                    <p className="text-slate-500 text-[9px] font-black uppercase">Paid Till Date</p>
                    <p className="text-xl md:text-2xl font-black text-green-400">₹{totalPaid}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Loan Tenure Info Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               {[
                 { label: "Principal", val: `₹${user.loanDetails.principalAmount}`, color: "text-slate-900" },
                 { label: "Interest", val: `${user.loanDetails.interestRate}%`, color: "text-blue-600" },
                 { label: "Start Date", val: new Date(user.loanDetails.startDate).toLocaleDateString('en-IN', {day:'2-digit', month:'short'}), color: "text-slate-600" },
                 { label: "Days Left", val: `${daysRemaining > 0 ? daysRemaining : 0} Days`, color: daysRemaining < 3 ? "text-red-500" : "text-green-500" },
               ].map((item, i) => (
                 <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                   <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{item.label}</p>
                   <p className={`text-sm font-black ${item.color}`}>{item.val}</p>
                 </div>
               ))}
            </div>

            {/* History Table - Scrollable on Mobile */}
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} /> Payment History
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="p-4">Date</th>
                      <th className="p-4">Notes</th>
                      <th className="p-4 text-right">Fine</th>
                      <th className="p-4 text-right">Amount</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[...user.collections].reverse().map((col, i) => (
                      <tr key={i} className="hover:bg-blue-50/30 transition-all text-sm group">
                        <td className="p-4 font-bold text-slate-600">
                          {new Date(col.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800 leading-tight">{col.remarks}</p>
                          <p className="text-[9px] text-slate-400 font-mono">#{col._id.slice(-4).toUpperCase()}</p>
                        </td>
                        <td className="p-4 text-right font-black text-red-500">
                          {col.lateFine > 0 ? `+₹${col.lateFine}` : "—"}
                        </td>
                        <td className="p-4 text-right font-black text-slate-900">
                          ₹{col.amountCollected}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(col)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit3 size={16} /></button>
                            <button onClick={() => deleteEntry(col._id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Collect Form */}
            <div className={`bg-white rounded-[2rem] p-6 md:p-8 border-2 shadow-xl ${editingId ? 'border-blue-500 shadow-blue-50' : 'border-transparent shadow-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter">
                  {editingId ? <Edit3 className="text-blue-600" size={20}/> : <Wallet className="text-blue-600" size={20}/>} 
                  {editingId ? "Modify Entry" : "Collect Cash"}
                </h3>
                {editingId && <button onClick={resetForm} className="text-[10px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-full">RESET</button>}
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Payment Date</label>
                  <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3 border border-slate-100">
                    <CalendarDays size={16} className="text-slate-400" />
                    <input type="date" value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} className="bg-transparent w-full font-bold outline-none text-sm" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-blue-500 uppercase ml-1">EMI Amount (Cash In)</label>
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <input 
                      type="number" 
                      placeholder="₹ 0.00" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      className="bg-transparent w-full font-black text-2xl text-blue-700 outline-none" 
                    />
                    <p className="text-[8px] text-blue-400 mt-1 font-bold italic">*Max allowed: ₹{currentOutstanding}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-red-500 uppercase ml-1">Late Fine (Penalty)</label>
                  <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                    <input type="number" value={lateFine} onChange={(e) => setLateFine(e.target.value)} className="bg-transparent w-full font-black text-2xl text-red-700 outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Remarks</label>
                  <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="bg-slate-50 p-3 rounded-xl w-full font-bold outline-none text-sm border border-slate-100" />
                </div>

                <button 
                  onClick={handlePayment} 
                  disabled={loading} 
                  className={`w-full p-4 rounded-xl font-black text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-black'} text-white`}
                >
                  {loading ? "PROCESSING..." : editingId ? "SAVE CHANGES" : "APPROVE PAYMENT"}
                </button>
              </div>
            </div>

            {/* KYC & Aadhaar Info */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2 tracking-widest">
                <ShieldCheck size={14} className="text-green-500" /> KYC Verification
              </h4>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Aadhaar Front</p>
                    <a href={user.aadhaarImages.frontSide.url} target="_blank" className="block relative group rounded-lg overflow-hidden border border-slate-100 aspect-video">
                      <img src={user.aadhaarImages.frontSide.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Front" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink size={14} className="text-white"/></div>
                    </a>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Aadhaar Back</p>
                    <a href={user.aadhaarImages.backSide.url} target="_blank" className="block relative group rounded-lg overflow-hidden border border-slate-100 aspect-video">
                      <img src={user.aadhaarImages.backSide.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Back" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink size={14} className="text-white"/></div>
                    </a>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Aadhaar Number</p>
                   <p className="text-sm font-black tracking-widest text-slate-700">{user.aadhaarNumber}</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                   <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-black text-blue-600 text-sm">
                     {user.name.charAt(0)}
                   </div>
                   <div>
                     <p className="text-xs font-black text-slate-900 leading-none">{user.name}</p>
                     <p className="text-[10px] font-bold text-slate-400 mt-1">{user.phoneNumber}</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Extension Modal */}
      {showExtension && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tighter uppercase italic">Extension</h3>
            <p className="text-slate-400 text-xs font-bold mb-6">Modify loan duration & penalty.</p>
            
            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">New Deadline</label>
                <input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} className="bg-transparent w-full font-black text-lg outline-none" />
              </div>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-red-700">
                <label className="text-[9px] font-black text-red-400 uppercase block mb-1">Extension Fine (₹)</label>
                <input type="number" value={extensionFine} onChange={(e) => setExtensionFine(e.target.value)} className="bg-transparent w-full font-black text-2xl outline-none" />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowExtension(false)} className="flex-1 p-4 rounded-xl font-black text-slate-400 hover:bg-slate-50 transition-all text-xs">CANCEL</button>
                <button onClick={handleExtension} className="flex-[2] bg-slate-900 text-white p-4 rounded-xl font-black text-sm shadow-lg">UPDATE LOAN</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}