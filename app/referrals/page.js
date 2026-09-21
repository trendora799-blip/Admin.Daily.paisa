'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReferralsPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check admin auth
    const storedAdmin = localStorage.getItem('dailypaisa_admin');
    if (!storedAdmin) {
      router.replace('/');
      return;
    }

    fetchReferrals();
  }, [router]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/referrals');
      const data = await res.json();

      if (Array.isArray(data)) {
        // Filter users who have referrals (team array has members)
        const usersWithReferrals = data.filter(u => u.team && u.team.length > 0);
        setUsers(usersWithReferrals);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId) => {
    router.push(`/referrals/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-24">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Referral Management</h1>
        <p className="text-slate-400 mb-6">{users.length} users with referrals</p>

        {users.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-8 text-center text-slate-400">
            <p className="text-xl mb-2">👥</p>
            <p>No users with referrals yet</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="text-left p-4">User</th>
                    <th className="text-left p-4">Referral Code</th>
                    <th className="text-left p-4">Team Size</th>
                    <th className="text-left p-4">Earnings</th>
                    <th className="text-left p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map((user) => (
                    <tr 
                      key={user.id} 
                      onClick={() => handleUserClick(user.id)}
                      className="hover:bg-slate-700/30 cursor-pointer transition"
                    >
                      <td className="p-4">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-brand-400">{user.referralCode}</span>
                      </td>
                      <td className="p-4">
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm">
                          {user.team?.length || 0} members
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-emerald-400 font-bold">
                          ₹{user.referralEarnings || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <button className="text-blue-400 hover:underline text-sm">
                          View Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  }
