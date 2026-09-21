'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('dailypaisa_admin')) {
      router.replace('/');
      return;
    }
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUnban = async (userId, currentStatus) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) return;
    setProcessingId(userId);
    try {
      const action = currentStatus ? 'unban' : 'ban';
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`User ${currentStatus ? 'unbanned' : 'banned'}!`);
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!confirm(`️ WARNING: Permanently DELETE ${userName}?`)) return;
    setProcessingId(userId);
    try {
      const res = await fetch(`/api/users?userId=${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('User deleted!');
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div>
        <h1 className="text-3xl font-bold">Manage <span className="text-brand-400">Users</span> 👥</h1>
        <p className="text-slate-400 mt-1">{users.length} total registered users</p>
      </div>

      <div className="card p-4 bg-slate-800 rounded-xl border border-slate-700">
        <input 
          type="text" 
          placeholder="Search by name, email, or phone..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="w-full p-3 bg-slate-900 text-white rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500" 
        />
      </div>

      <div className="space-y-3">
        {filteredUsers.map(user => (
          <div key={user.id} className={`p-4 bg-slate-800 rounded-xl border border-slate-700 ${user.isBanned ? 'border-red-500/50 bg-red-500/5' : ''}`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-600`}>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white text-lg truncate">{user.name || 'Unknown'}</h3>
                  <p className="text-sm text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-emerald-400">₹{user.balance || 0}</p>
                <p className="text-xs text-slate-500">Balance</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Phone</p>
                <p className="text-sm font-mono text-white">{user.phone || 'Not set'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">VIP Level</p>
                <p className="text-sm font-bold text-purple-400">VIP {user.vipLevel || 1}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
              <Link href={`/users/${user.id}`} className="py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs font-semibold text-center transition">
                📄 View Details
              </Link>
              <button onClick={() => copyToClipboard(user.password || 'No password', 'Password')} className="py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-xs font-semibold transition">
                📋 Copy Password
              </button>
              <button 
                onClick={() => handleBanUnban(user.id, user.isBanned)}
                disabled={processingId === user.id}
                className={`py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${user.isBanned ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}
              >
                {processingId === user.id ? '...' : user.isBanned ? '✅ Unban User' : ' Ban User'}
              </button>
              <button 
                onClick={() => handleDelete(user.id, user.name)}
                disabled={processingId === user.id}
                className="py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-semibold transition disabled:opacity-50"
              >
                {processingId === user.id ? '...' : '🗑️ Delete User'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
                                   }
