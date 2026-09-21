'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id;

  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activePlans, setActivePlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('dailypaisa_admin')) {
      router.replace('/');
      return;
    }

    if (!userId) {
      router.replace('/users');
      return;
    }

    fetchUserDetails();
  }, [userId, router]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);

      const usersRes = await fetch('/api/users');
      const allUsers = await usersRes.json();
      const foundUser = Array.isArray(allUsers) ? allUsers.find(u => u.id === userId) : null;

      if (!foundUser) {
        toast.error('User not found');
        router.replace('/users');
        return;
      }

      setUser(foundUser);

      const txRes = await fetch(`/api/transactions?userId=${userId}`);
      const txData = await txRes.json();
      if (Array.isArray(txData)) {
        setTransactions(txData);
      } else {
        setTransactions([]);
      }

      const userSubscriptions = foundUser.subscriptions || [];
      setSubscriptions(userSubscriptions);

      const now = new Date();
      const active = userSubscriptions.filter(sub => {
        if (!sub.active) return false;
        const endDate = new Date(sub.endDate);
        return endDate > now;
      });
      setActivePlans(active);

    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const totalDeposits = transactions
    .filter(tx => tx.type === 'deposit' && tx.status === 'approved')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const totalWithdrawals = transactions
    .filter(tx => tx.type === 'withdrawal' && tx.status === 'approved')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const totalEarnings = transactions
    .filter(tx => 
      (tx.type === 'referral_commission' || 
       tx.type === 'spin_win' || 
       tx.type === 'subscription_income' ||
       tx.type === 'daily_income') && 
      tx.status === 'approved'
    )
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading user details...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/users" className="px-3 py-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition">
            ← Back to Users
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold truncate">{user.name}</h1>
            <p className="text-slate-400 text-sm truncate">{user.email}</p>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-800 p-3 rounded-xl">
            <p className="text-slate-400 text-xs uppercase">Balance</p>
            <p className="text-xl font-bold text-emerald-400 break-all">₹{user.balance || 0}</p>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl">
            <p className="text-slate-400 text-xs uppercase">Total Deposits</p>
            <p className="text-xl font-bold text-blue-400 break-all">₹{totalDeposits}</p>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl">
            <p className="text-slate-400 text-xs uppercase">Total Withdrawals</p>
            <p className="text-xl font-bold text-red-400 break-all">₹{totalWithdrawals}</p>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl">
            <p className="text-slate-400 text-xs uppercase">Total Earnings</p>
            <p className="text-xl font-bold text-purple-400 break-all">₹{totalEarnings}</p>
          </div>
        </div>

        {/* Referral & Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-brand-500/10 to-purple-500/10 border border-brand-500/30 p-3 rounded-xl">
            <p className="text-slate-400 text-xs uppercase">Referral Earnings</p>
            <p className="text-xl font-bold text-brand-400 break-all">₹{user.referralEarnings || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 p-3 rounded-xl">
            <p className="text-slate-400 text-xs uppercase">Team Members</p>
            <p className="text-xl font-bold text-blue-400">{user.team?.length || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 p-3 rounded-xl">
            <p className="text-slate-400 text-xs uppercase">Referred By</p>
            <p className="text-sm font-bold text-emerald-400 font-mono break-all">{user.referredBy || 'No Referrer'}</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="font-bold text-lg mb-3">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-slate-400 text-xs">User ID</p>
              <p className="font-mono text-xs break-all">{user.id}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Name</p>
              <p className="break-all">{user.name}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Email</p>
              <p className="break-all">{user.email}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Phone</p>
              <p>{user.phone || 'Not set'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">VIP Level</p>
              <p className="text-brand-400 font-bold">VIP {user.vipLevel || 1}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Referral Code</p>
              <p className="font-mono text-brand-400">{user.referralCode}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Member Since</p>
              <p>{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Active Plans */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="font-bold text-lg mb-3">Active Subscription Plans</h2>
          {activePlans.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No active plans</p>
          ) : (
            <div className="space-y-3">
              {activePlans.map((plan, index) => (
                <div key={plan.id || index} className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-base">{plan.packTitle || 'Subscription Plan'}</h3>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">ACTIVE</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Purchase Amount</p>
                      <p className="font-bold">₹{plan.price}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Daily Income</p>
                      <p className="font-bold text-emerald-400">₹{plan.dailyIncome}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Purchased On</p>
                      <p className="text-xs">{formatDate(plan.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Expires On</p>
                      <p className="text-xs">{formatDate(plan.endDate)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction History Section */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="font-bold text-lg mb-3">Transaction History (Balance Breakdown)</h2>

          {transactions.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No transactions found for this user.</p>
          ) : (
            <div className="space-y-4">
              {/* Balance Calculation Summary */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <p className="text-sm text-slate-400 mb-3 font-semibold">Balance Calculation:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Approved Deposits:</span>
                    <span className="text-blue-400 font-bold">+₹{totalDeposits}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Approved Earnings:</span>
                    <span className="text-purple-400 font-bold">+₹{totalEarnings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Approved Withdrawals:</span>
                    <span className="text-red-400 font-bold">-₹{totalWithdrawals}</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between items-center font-bold text-base">
                    <span className="text-white">Current System Balance:</span>
                    <span className="text-emerald-400">₹{user.balance || 0}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Transaction List */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">All Activity Log:</h3>
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="bg-slate-900/50 rounded-xl p-3 border border-slate-700 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                          tx.type === 'deposit' ? 'bg-blue-500/20 text-blue-400' :
                          tx.type === 'withdrawal' ? 'bg-red-500/20 text-red-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {tx.type === 'deposit' ? '↓' : tx.type === 'withdrawal' ? '↑' : '💰'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-white truncate">
                            {tx.type === 'deposit' ? 'Deposit' : 
                             tx.type === 'withdrawal' ? 'Withdrawal' : 
                             tx.type?.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-xs text-slate-400">{formatDate(tx.createdAt)}</p>
                          {tx.description && (
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">{tx.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}₹{tx.amount}
                        </p>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          tx.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                          tx.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {tx.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
        }
