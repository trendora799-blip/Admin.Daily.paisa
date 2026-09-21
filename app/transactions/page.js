'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // ✅ NEW: State for viewing screenshot
  const [viewScreenshot, setViewScreenshot] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('dailypaisa_admin')) return router.push('/');
    fetchTransactions();
  }, [router]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();

      // ✅ TRIPLE FILTER: Only show deposits
      const depositTransactions = Array.isArray(data) 
        ? data.filter(t => {
            // Must be type 'deposit'
            if (t.type !== 'deposit') return false;
            // Must have positive amount (deposits are always positive)
            if (t.amount <= 0) return false;
            return true;
          })
        : [];

      setTransactions(depositTransactions);
    } catch (error) { 
      toast.error('Failed to load transactions'); 
      console.error('Error:', error);
    } finally { 
      setLoading(false); 
    }
  };

  const handleStatusChange = async (id, status) => {
    if (processingId) return;
    setProcessingId(id);

    try {
      const res = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');

      toast.success(`Transaction ${status} successfully!`);
      fetchTransactions();
    } catch (err) { 
      toast.error(err.message); 
    } finally { 
      setProcessingId(null); 
    }
  };

  // ✅ Delete transaction function
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return;
    }

    if (processingId) return;
    setProcessingId(id);

    try {
      const res = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      toast.success('Transaction deleted successfully!');
      fetchTransactions();
    } catch (err) { 
      toast.error(err.message); 
    } finally { 
      setProcessingId(null); 
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter !== 'all' && tx.status !== filter) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        tx.id?.toLowerCase().includes(query) ||
        tx.userId?.toLowerCase().includes(query) ||
        tx.description?.toLowerCase().includes(query) ||
        tx.utrId?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const pendingCount = transactions.filter(t => t.status === 'pending').length;
  const approvedCount = transactions.filter(t => t.status === 'approved').length;
  const rejectedCount = transactions.filter(t => t.status === 'rejected').length;

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div>
        <h1 className="text-3xl font-bold">Manage <span className="grad-text">Deposits</span> 💰</h1>
        <p className="text-slate-400 mt-1">{transactions.length} total deposit requests</p>
      </div>

      <div className="card">
        <input
          type="text"
          placeholder="Search by Txn ID, User, or UTR..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input w-full"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition ${filter === 'all' ? 'bg-brand-500 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}>
          All ({transactions.length})
        </button>
        <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}>
          Pending ({pendingCount})
        </button>
        <button onClick={() => setFilter('approved')} className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition ${filter === 'approved' ? 'bg-green-500 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}>
          Approved ({approvedCount})
        </button>
        <button onClick={() => setFilter('rejected')} className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition ${filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}>
          Rejected ({rejectedCount})
        </button>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {/* ✅ Increased min-w to 1000px to fit the new Screenshot column */}
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10 bg-slate-800/30">
                <th className="py-3 px-4">Txn ID</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">UTR / Note</th>
                <th className="py-3 px-4">Screenshot</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* ✅ Updated colSpan to 8 */}
              {filteredTransactions.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500">No deposit requests found</td></tr>
              ) : filteredTransactions.map(tx => {
                const isProcessing = processingId === tx.id;
                return (
                  <tr key={tx.id} className={`border-b border-white/5 hover:bg-white/[.02] transition ${tx.status === 'rejected' ? 'bg-red-900/10' : tx.status === 'approved' ? 'bg-green-900/10' : ''}`}>
                    <td className="py-3 px-4"><span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{tx.id?.slice(-10) || 'N/A'}</span></td>
                    <td className="py-3 px-4 font-medium text-white">{tx.userName || tx.userId || 'Unknown'}</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">₹{tx.amount}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 font-mono max-w-[150px] truncate">{tx.utrId || tx.description || '-'}</td>

                    {/* ✅ NEW: Screenshot Thumbnail Column */}
                    <td className="py-3 px-4">
                      {tx.screenshot ? (
                        <div 
                          className="w-16 h-16 rounded-lg overflow-hidden border border-slate-600 hover:border-brand-500 transition cursor-pointer" 
                          onClick={() => setViewScreenshot(tx.screenshot)}
                        >
                          <img 
                            src={tx.screenshot} 
                            alt="Receipt" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">None</span>
                      )}
                    </td>

                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${tx.status === 'approved' ? 'bg-green-500/20 text-green-400' : tx.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{tx.status}</span></td>
                    <td className="py-3 px-4 text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      {tx.status === 'pending' ? (
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => handleStatusChange(tx.id, 'approved')} 
                            disabled={isProcessing}
                            className="px-3 py-1 rounded bg-green-500/15 text-green-400 hover:bg-green-500/25 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition min-w-[70px]"
                          >
                            {isProcessing ? '...' : 'Approve'}
                          </button>
                          <button 
                            onClick={() => handleStatusChange(tx.id, 'rejected')} 
                            disabled={isProcessing}
                            className="px-3 py-1 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition min-w-[70px]"
                          >
                            {isProcessing ? '...' : 'Reject'}
                          </button>
                          <button 
                            onClick={() => handleDelete(tx.id)} 
                            disabled={isProcessing}
                            className="px-3 py-1 rounded bg-slate-700/50 text-slate-400 hover:bg-red-500/25 hover:text-red-400 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition min-w-[60px]"
                          >
                            {isProcessing ? '...' : 'Delete'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end items-center">
                          <span className="text-xs text-slate-500">Processed</span>
                          <button 
                            onClick={() => handleDelete(tx.id)} 
                            disabled={isProcessing}
                            className="px-3 py-1 rounded bg-slate-700/50 text-slate-400 hover:bg-red-500/25 hover:text-red-400 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition min-w-[60px]"
                          >
                            {isProcessing ? '...' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ NEW: Screenshot Full-Size Modal */}
      {viewScreenshot && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setViewScreenshot(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full mb-4">
              <h3 className="text-white font-bold text-lg">Payment Receipt</h3>
              <button 
                onClick={() => setViewScreenshot(null)}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-900 rounded-2xl p-4 overflow-auto flex-1 flex items-center justify-center">
              <img 
                src={viewScreenshot} 
                alt="Payment Screenshot" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            <div className="mt-4 flex gap-3">
              <a 
                href={viewScreenshot} 
                download="payment-screenshot.png"
                className="px-6 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold transition"
              >
                ⬇️ Download
              </a>
              <button 
                onClick={() => setViewScreenshot(null)}
                className="px-6 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
                                         }
