'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function WithdrawalsPage() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('dailypaisa_admin')) { router.replace('/'); return; }
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/withdrawals');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWithdrawals(Array.isArray(data) ? data : []);
    } catch (error) { toast.error('Failed to load withdrawals'); } finally { setLoading(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(`Withdrawal ${status}!`);
      fetchWithdrawals();
    } catch (error) { toast.error(error.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this withdrawal record?')) return;
    try {
      const res = await fetch(`/api/withdrawals?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Record deleted!');
      fetchWithdrawals();
    } catch (error) { toast.error(error.message); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const pending = withdrawals.filter(w => w.status === 'pending');
  const history = withdrawals.filter(w => w.status !== 'pending');

  return (
    <div className="space-y-6 animate-fade-in p-4 pb-24">
      <div>
        <h1 className="text-3xl font-bold">Manage <span className="text-brand-400">Withdrawals</span> 💸</h1>
        <p className="text-slate-400 mt-1">{pending.length} pending • {history.length} processed</p>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">⏳ Pending Approvals</h2>
        {pending.length === 0 ? (
          <div className="p-8 bg-slate-800 rounded-xl text-center text-slate-500">No pending withdrawals</div>
        ) : (
          <div className="space-y-3">
            {pending.map(w => (
              <div key={w.id} className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-2xl font-bold text-white">₹{w.amount}</p>
                    <p className="text-sm text-slate-400">{w.accountHolderName}</p>
                    <p className="text-xs text-slate-500 font-mono">{w.userId}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleStatusChange(w.id, 'approved')} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold">Approve</button>
                    <button onClick={() => handleStatusChange(w.id, 'rejected')} className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold">Reject</button>
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-slate-400">Bank Account:</span> <span className="text-white font-mono">{w.bankAccount}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">IFSC Code:</span> <span className="text-white font-mono">{w.ifscCode}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">History</h2>
        <div className="space-y-3">
          {history.map(w => (
            <div key={w.id} className="p-4 bg-slate-800 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-2xl font-bold text-white">₹{w.amount}</p>
                  <p className="text-sm text-slate-400">{w.accountHolderName}</p>
                  <p className="text-xs text-slate-500 font-mono">{w.userId}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${w.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {w.status.toUpperCase()}
                </span>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg text-sm space-y-1 mb-3">
                <div className="flex justify-between"><span className="text-slate-400">Bank Account:</span> <span className="text-white font-mono">{w.bankAccount}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">IFSC Code:</span> <span className="text-white font-mono">{w.ifscCode}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Processed:</span> <span className="text-white">{new Date(w.updatedAt || w.createdAt).toLocaleDateString()}</span></div>
              </div>
              {/* DELETE BUTTON ADDED HERE */}
              <button onClick={() => handleDelete(w.id)} className="w-full py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2">
                ️ Delete Record
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
    }
