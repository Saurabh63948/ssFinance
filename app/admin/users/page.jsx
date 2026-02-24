
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, LayoutDashboard, Wallet, FileText, Search, Plus, 
  MoreVertical, Edit3, Trash2, X, Fingerprint, ArrowUpRight, Camera
} from "lucide-react";
import toast from "react-hot-toast";

export default function BorrowersPage() {
  const router = useRouter();
  const menuRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "", phoneNumber: "", aadhaarNumber: "",
    principalAmount: "", interestRate: "10",
    startDate: "", endDate: "",
  });
  
  const [frontSide, setFrontSide] = useState(null);
  const [backSide, setBackSide] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setActiveMenu(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/get-users"); 
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) { console.error("Fetch error"); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (frontSide) data.append("frontSide", frontSide); 
      if (backSide) data.append("backSide", backSide);
      if (editingId) data.append("userId", editingId);

      const endpoint = editingId ? "/api/admin/edit-user" : "/api/admin/add-user";
      const res = await fetch(endpoint, { method: "POST", body: data });
      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: "", phoneNumber: "", aadhaarNumber: "", principalAmount: "", interestRate: "10", startDate: "", endDate: "" });
        setFrontSide(null);
        setBackSide(null);
        fetchUsers();
      }
    } catch (err) { toast.error("Action failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-[#F1F5F9] text-slate-900 font-sans">
      
      {/* Sidebar */}
      <aside className="w-72 bg-[#0F172A] fixed h-full z-40 shadow-2xl flex flex-col">
        <div className="p-8 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Fingerprint className="text-white" size={24} />
            </div>
            <span className="text-xl font-black text-white italic uppercase tracking-tighter">VITTA<span className="text-blue-400">LEKHA</span></span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Overview" onClick={() => router.push("/admin")} />
          <NavItem icon={<Users size={20}/>} label="Borrowers" active onClick={() => router.push("/admin/users")} />
          <NavItem icon={<Wallet size={20}/>} label="Collections" onClick={() => router.push("/admin/collections")} />
          <NavItem icon={<FileText size={20}/>} label="Reports" onClick={() => router.push("/admin/reports")} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-72 flex-1 p-10">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Market Portfolio</h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">{users.length} Active Ledger Accounts</p>
          </div>
          
          <button 
            onClick={() => { setEditingId(null); setShowModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center gap-2"
          >
            <Plus size={20} /> NEW LOAN
          </button>
        </header>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search borrowers..." 
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-14 pr-6 outline-none focus:ring-2 ring-blue-500/20 font-medium"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Updated Table: Fixed overflow for Dropdown */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-visible relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-wider">Borrower</th>
                <th className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-wider">Financial Summary (₹)</th>
                <th className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-wider">Live Status</th>
                <th className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => {
                const principal = Number(user.loanDetails?.principalAmount) || 0;
                const interest = (Number(user.loanDetails?.totalPayableWithInterest) || 0) - principal;
                const totalFines = user.collections?.reduce((acc, curr) => acc + (Number(curr.lateFine) || 0), 0) || 0;
                const totalPaid = user.collections?.reduce((acc, curr) => acc + (Number(curr.amountCollected) || 0), 0) || 0;
                
                const totalPayable = principal + interest + totalFines;
                const balance = totalPayable - totalPaid;
                const progress = Math.min((totalPaid / totalPayable) * 100, 100);

                return (
                  <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-500 font-medium">{user.phoneNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-3 text-[10px] font-bold uppercase tracking-tighter">
                          <span className="text-slate-400">P: <span className="text-slate-700">₹{principal}</span></span>
                          <span className="text-slate-400">I: <span className="text-blue-600">₹{interest}</span></span>
                          <span className="text-slate-400">F: <span className="text-red-500">₹{totalFines}</span></span>
                        </div>
                        <div className="text-lg font-black text-slate-800">
                          Total: ₹{totalPayable.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="max-w-[180px]">
                        <div className="flex justify-between items-end mb-1">
                          <span className="text-xl font-black text-blue-700">₹{balance.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Left</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="mt-2 text-[10px] font-bold text-green-600 bg-green-50 inline-block px-2 py-0.5 rounded-md">
                          Paid: ₹{totalPaid}
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-right relative">
                      <button onClick={() => setActiveMenu(activeMenu === user._id ? null : user._id)} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
                        <MoreVertical size={20} className="text-slate-400" />
                      </button>
                      
                      {/* FIX: Increased z-index and absolute positioning */}
                      {activeMenu === user._id && (
                        <div ref={menuRef} className="absolute right-10 top-0 z-[100] bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 min-w-[180px]">
                          <MenuOption icon={<ArrowUpRight size={16}/>} label="Open Ledger" onClick={() => router.push(`/admin/users/${user._id}`)} />
                          <MenuOption icon={<Edit3 size={16}/>} label="Edit Account" onClick={() => {}} />
                          <div className="h-px bg-slate-100 my-1 mx-2"></div>
                          <MenuOption icon={<Trash2 size={16}/>} label="Delete" onClick={() => {}} danger />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* --- REGISTER / EDIT MODAL --- */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 z-[110] animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-10 w-full max-w-xl shadow-[0_50px_100px_rgba(0,0,0,0.25)] overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                  {editingId ? "Update Account" : "Register New Loan"}
                </h2>
                <button onClick={() => setShowModal(false)} className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                  <input type="text" required className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-bold outline-none focus:border-blue-500/20" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Phone Number</label>
                    <input type="text" maxLength={10} required className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-bold outline-none focus:border-blue-500/20" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Aadhaar Number</label>
                    <input type="text" maxLength={12} required className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-bold outline-none focus:border-blue-500/20" value={formData.aadhaarNumber} onChange={(e) => setFormData({...formData, aadhaarNumber: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Principal (₹)</label>
                    <input type="number" required className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-bold outline-none focus:border-blue-500/20" value={formData.principalAmount} onChange={(e) => setFormData({...formData, principalAmount: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Interest (%)</label>
                    <input type="number" required className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-bold outline-none focus:border-blue-500/20" value={formData.interestRate} onChange={(e) => setFormData({...formData, interestRate: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-400">
                    <div>
                        <label className="ml-4 uppercase text-[10px]">Start Date</label>
                        <input type="date" required className="w-full p-4 bg-slate-50 rounded-2xl mt-1 text-slate-900 border-2 border-transparent focus:border-blue-500/20" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                    </div>
                    <div>
                        <label className="ml-4 uppercase text-[10px]">End Date</label>
                        <input type="date" required className="w-full p-4 bg-slate-50 rounded-2xl mt-1 text-slate-900 border-2 border-transparent focus:border-blue-500/20" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                    </div>
                </div>

                {/* Aadhaar Image Uploads */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                   <label className="cursor-pointer group">
                     <div className={`bg-slate-50 border-2 border-dashed rounded-2xl p-4 text-center group-hover:bg-slate-100 transition-all ${frontSide ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}>
                        <Camera size={20} className={`mx-auto mb-1 ${frontSide ? 'text-green-500' : 'text-slate-400'}`} />
                        <span className="text-[9px] font-black text-slate-500 uppercase">{frontSide ? 'Front Uploaded' : 'Front Side'}</span>
                        <input type="file" className="hidden" onChange={(e) => setFrontSide(e.target.files[0])} />
                     </div>
                   </label>
                   <label className="cursor-pointer group">
                     <div className={`bg-slate-50 border-2 border-dashed rounded-2xl p-4 text-center group-hover:bg-slate-100 transition-all ${backSide ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}>
                        <Camera size={20} className={`mx-auto mb-1 ${backSide ? 'text-green-500' : 'text-slate-400'}`} />
                        <span className="text-[9px] font-black text-slate-500 uppercase">{backSide ? 'Back Uploaded' : 'Back Side'}</span>
                        <input type="file" className="hidden" onChange={(e) => setBackSide(e.target.files[0])} />
                     </div>
                   </label>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-2xl transition-all active:scale-[0.98] disabled:bg-slate-400 mt-2"
                >
                  {loading ? "SAVING..." : editingId ? "UPDATE ACCOUNT" : "REGISTER ACCOUNT"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
    {icon} {label}
  </button>
);

const MenuOption = ({ icon, label, onClick, danger }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-50'}`}>
    {icon} {label}
  </button>
);