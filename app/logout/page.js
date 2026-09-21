'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    pendingDeposits: 0,
    totalWithdrawals: 0,
    revenueChart: [],
    usersChart: []
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('dailypaisa_admin')) {
      router.replace('/');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, txRes, wdRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/transactions'),
        fetch('/api/withdrawals')
      ]);

      if (!usersRes.ok || !txRes.ok || !wdRes.ok) {
        throw new Error('Failed to load data');
      }

      const users = await usersRes.json();
      const txs = await txRes.json();
      const wds = await wdRes.json();

      setTransactions(txs);

      const totalRevenue = txs.filter(t => t.status === 'approved' && t.type === 'deposit').reduce((sum, t) => sum + (t.amount || 0), 0);
      const pendingDeposits = txs.filter(t => t.status === 'pending' && t.type === 'deposit').length;
      const totalWithdrawals = wds.filter(t => t.status === 'approved').reduce((sum, t) => sum + (t.amount || 0), 0);
      const regularUsers = users.filter(u => !u.isAdmin);

      // Generate last 7 days data
      const days = [];
      const revenueData = [];
      const usersData = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

        days.push(dayName);

        const dayRevenue = txs
          .filter(t => t.status === 'approved' && t.type === 'deposit' && t.createdAt?.startsWith(dateStr))
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        revenueData.push(dayRevenue);

        const dayUsers = regularUsers.filter(u => u.createdAt?.startsWith(dateStr)).length;
        usersData.push(dayUsers);
      }

      const maxRevenue = Math.max(...revenueData, 1);
      const maxUsers = Math.max(...usersData, 1);

      setStats({
        totalUsers: regularUsers.length,
        totalRevenue,
        pendingDeposits,
        totalWithdrawals,
        revenueChart: days.map((day, i) => ({ day, value: revenueData[i], max: maxRevenue })),
        usersChart: days.map((day, i) => ({ day, value: usersData[i], max: maxUsers }))
      });

    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-4">
      <div>
        <h1 className="text-3xl font-bold">Admin <span className="text-brand-400">Overview</span> ️</h1>
        <p className="text-slate-400 mt-1">Welcome back, here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 bg-slate-800 rounded-xl border border-slate-700">
          <p className="text-sm text-slate-400">Total Users</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</p>
        </div>
        <div className="card p-4 bg-slate-800 rounded-xl border border-slate-700">
          <p className="text-sm text-slate-400">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="card p-4 bg-slate-800 rounded-xl border border-slate-700">
          <p className="text-sm text-slate-400">Pending Deposits</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.pendingDeposits}</p>
        </div>
        <div className="card p-4 bg-slate-800 rounded-xl border border-slate-700">
          <p className="text-sm text-slate-400">Total Paid Out</p>
          <p className="text-2xl font-bold text-red-400 mt-1">₹{stats.totalWithdrawals.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card p-6 bg-slate-800 rounded-xl border border-slate-700">
          <h3 className="font-bold text-lg mb-4">💰 Total Revenue (Last 7 Days)</h3>
          <div className="flex items-end justify-between h-48 gap-2">
            {stats.revenueChart.map((item, i) => (
              <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
                <span className="text-[10px] text-slate-400 mb-1">₹{item.value}</span>
                <div 
                  className="w-full max-w-[30px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md"
                  style={{ height: `${(item.value / item.max) * 100}%`, minHeight: item.value > 0 ? '4px' : '0' }}
                ></div>
                <span className="text-[10px] text-slate-500 mt-2">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* New Users Chart */}
        <div className="card p-6 bg-slate-800 rounded-xl border border-slate-700">
          <h3 className="font-bold text-lg mb-4">👥 New Users (Last 7 Days)</h3>
          <div className="flex items-end justify-between h-48 gap-2">
            {stats.usersChart.map((item, i) => (
              <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
                <span className="text-[10px] text-slate-400 mb-1">{item.value}</span>
                <div 
                  className="w-full max-w-[30px] bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-md"
                  style={{ height: `${(item.value / item.max) * 100}%`, minHeight: item.value > 0 ? '4px' : '0' }}
                ></div>
                <span className="text-[10px] text-slate-500 mt-2">{item.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  }
