'use client';

import { useEffect, useState } from 'react'; // ✅ ADD THIS IMPORT
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function QRCodesPage() {
  const router = useRouter();
  const [qrCodes, setQRCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ upiId: '', name: '' });

  useEffect(() => {
    const checkAuth = () => {
      const admin = localStorage.getItem('dailypaisa_admin');
      if (!admin) {
        router.replace('/');
        return false;
      }
      return true;
    };

    if (checkAuth()) {
      fetchQRCodes();
    }
  }, [router]);

  const fetchQRCodes = async () => {
    try {
      const res = await fetch('/api/qr-codes');
      const data = await res.json();
      setQRCodes(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQR = async (e) => {
    e.preventDefault();
    if (!formData.upiId || !formData.name) {
      return toast.error('Please fill in all fields');
    }

    try {
      const res = await fetch('/api/qr-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to add QR code');

      toast.success('QR code added successfully');
      setFormData({ upiId: '', name: '' });
      fetchQRCodes();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this QR code?')) return;

    try {
      const res = await fetch(`/api/qr-codes?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      toast.success('QR code deleted');
      fetchQRCodes();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div>
        <h1 className="text-3xl font-bold">Manage <span className="grad-text">QR Codes</span> 📱</h1>
        <p className="text-slate-400 mt-1">Add, activate, or remove UPI QR codes for users</p>
      </div>

      {/* Add QR Code Form */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Add QR Code</h2>
        <form onSubmit={handleAddQR} className="space-y-4">
          <input
            type="text"
            placeholder="UPI ID (e.g., yourname@oksbi)"
            value={formData.upiId}
            onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
            className="input"
            required
          />
          <input
            type="text"
            placeholder="Account Holder Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input"
            required
          />
          <button type="submit" className="btn-primary w-full">
            Add QR Code
          </button>
        </form>
      </div>

      {/* QR Codes List */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">All QR Codes ({qrCodes.length})</h2>
        {qrCodes.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No QR codes added yet</p>
        ) : (
          <div className="space-y-3">
            {qrCodes.map((qr) => (
              <div key={qr.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-white/5">
                <div>
                  <p className="font-bold text-white">{qr.name}</p>
                  <p className="text-sm text-slate-400 font-mono">{qr.upiId}</p>
                </div>
                <button
                  onClick={() => handleDelete(qr.id)}
                  className="px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-semibold transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
                              }
