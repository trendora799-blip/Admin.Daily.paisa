'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function ReferralDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id;

  const [userData, setUserData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('dailypaisa_admin');
    if (!storedAdmin) {
      router.replace('/');
      return;
    }

    if (!userId) {
      router.replace('/referrals');
      return;
    }

    fetchData();
  }, [userId, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/referrals');
      if (!response.ok) throw new Error('Failed to fetch');

      const allUsers = await response.json();

      if (!Array.isArray(allUsers)) {
        throw new Error('Invalid data');
      }

      const foundUser = allUsers.find(u => u && u.id === userId);

      if (!foundUser) {
        setError('User not found');
        return;
      }

      setUserData(foundUser);

      // Get team member details
      if (foundUser.team && foundUser.team.length > 0) {
        const members = foundUser.team.map(memberId => {
          return allUsers.find(u => u && u.id === memberId) || {
            id: memberId,
            name: 'Deleted User',
            email: 'N/A'
          };
        });
        setTeamMembers(members);
      } else {
        setTeamMembers([]);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-6 rounded-xl max-w-md w-full text-center">
          <h2 className="text-red-400 font-bold text-xl mb-2">Error</h2>
          <p className="text-slate-400 mb-4">{error || 'User not found'}</p>
          <Link href="/referrals" className="px-4 py-2 bg-blue-500 rounded-lg text-white inline-block">
            Back to Referrals
          </Link>
        </div>
      </div>
    );
  }

  const teamSize = userData.team?.length || 0;
  const earnings = userData.referralEarnings || 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/referrals" className="text-blue-400 hover:underline">
            ← Back to Referrals
          </Link>
        </div>

        {/* User Info */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h1 className="text-2xl font-bold mb-4">{userData.name}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Email</p>
              <p className="font-medium">{userData.email}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Referral Code</p>
              <p className="font-mono text-brand-400">{userData.referralCode}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Team</p>
              <p className="font-bold text-blue-400">{teamSize} members</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Earnings</p>
              <p className="font-bold text-emerald-400">₹{earnings}</p>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="font-bold text-lg">Team Members ({teamSize})</h2>
          </div>

          {teamSize === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p>No team members yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {teamMembers.map((member, index) => (
                <div key={member.id || index} className="p-4 flex items-center justify-between hover:bg-slate-700/30">
                  <div>
                    <p className="font-medium">{member.name || 'Unknown User'}</p>
                    <p className="text-sm text-slate-400">{member.email || 'No email'}</p>
                  </div>
                  <p className="font-mono text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">
                    {member.id}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
    }
