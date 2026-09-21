'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function AdminSocialPage() {
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    platform: '',
    url: '',
    icon: '',
    order: 0,
  });

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const fetchSocialLinks = async () => {
    try {
      const res = await fetch('/api/social');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSocialLinks(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load social links');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const method = editingId ? 'PATCH' : 'POST';
      const body = editingId ? { id: editingId, ...formData } : formData;

      const res = await fetch('/api/social', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success(editingId ? 'Social link updated!' : 'Social link added!');
      resetForm();
      fetchSocialLinks();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (link) => {
    setEditingId(link.id);
    setFormData({
      platform: link.platform,
      url: link.url,
      icon: link.icon,
      order: link.order,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this social link?')) return;

    try {
      const res = await fetch(`/api/social?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      toast.success('Social link deleted!');
      fetchSocialLinks();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({ platform: '', url: '', icon: '', order: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Social <span className="text-purple-400">Links</span></h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-sm"
          >
            {showForm ? '✕ Cancel' : '+ Add Link'}
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-slate-800 rounded-2xl p-6 mb-6 border border-slate-700">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Add'} Social Link</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Platform Name</label>
                <input
                  type="text"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  placeholder="e.g., Telegram, WhatsApp, Instagram"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Icon (Emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., 📱  📸"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold"
              >
                {editingId ? 'Update Link' : 'Add Link'}
              </button>
            </form>
          </div>
        )}

        {/* Social Links List */}
        <div className="space-y-3">
          {socialLinks.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-800/50 rounded-2xl">
              <p>No social links added yet</p>
            </div>
          ) : (
            socialLinks.map((link) => (
              <div key={link.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{link.icon || ''}</span>
                    <div>
                      <h3 className="font-bold">{link.platform}</h3>
                      <p className="text-sm text-slate-400 truncate max-w-xs">{link.url}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(link)}
                      className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
    }
