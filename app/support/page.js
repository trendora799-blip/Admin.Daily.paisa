'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return toast.error('Please enter a reply');
    if (!selectedTicket) return;

    setSending(true);
    try {
      const res = await fetch('/api/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTicket.id,
          adminReply: replyText.trim(),
          status: 'replied'
        }),
      });

      if (!res.ok) throw new Error('Failed to send reply');

      toast.success('Reply sent successfully!');
      setReplyText('');
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!confirm('Are you sure you want to delete this ticket? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/support?id=${ticketId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete ticket');

      toast.success('Ticket deleted successfully!');
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
      fetchTickets();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-32">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Support <span className="text-purple-400">Tickets</span></h1>

        {tickets.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl">
            <p className="text-xl">No support tickets yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className="bg-slate-800 rounded-2xl p-5 border border-slate-700 hover:border-purple-500/50 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setReplyText(ticket.adminReply || '');
                    }}
                  >
                    <h3 className="font-bold text-lg text-white mb-1">{ticket.subject}</h3>
                    <p className="text-sm text-slate-400">From: {ticket.userName || 'Guest'} ({ticket.userEmail})</p>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      ticket.status === 'replied' ? 'bg-green-500/20 text-green-400' :
                      ticket.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {ticket.status?.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                  <p className="text-slate-300 text-sm line-clamp-2">
                    {ticket.message}
                  </p>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {ticket.screenshot ? (
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowImageModal(true);
                        }}
                        className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 px-2 py-1 rounded"
                      >
                         Screenshot
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">No attachment</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-700">
                  <button
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setReplyText(ticket.adminReply || '');
                    }}
                    className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
                  >
                     Reply
                  </button>
                  <button
                    onClick={() => handleDeleteTicket(ticket.id)}
                    className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedTicket && !showImageModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 w-full max-w-2xl rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col border-t sm:border border-slate-700 shadow-2xl mb-24">

            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 rounded-t-3xl sm:rounded-t-2xl z-10">
              <div>
                <h2 className="text-xl font-bold text-white">Ticket Details</h2>
                <p className="text-sm text-slate-400">{selectedTicket.userName} • {selectedTicket.userEmail}</p>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white text-xl"
              >

              </button>
            </div>

            <div className="overflow-y-auto p-5 flex-1 space-y-6">

              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-purple-400 uppercase">User Message</span>
                  <span className="text-xs text-slate-500">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{selectedTicket.subject}</h3>
                <p className="text-slate-300 whitespace-pre-wrap">{selectedTicket.message}</p>
                {selectedTicket.screenshot && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-400 mb-2">Screenshot attached:</p>
                    <button
                      onClick={() => setShowImageModal(true)}
                      className="text-sm text-purple-400 hover:text-purple-300 underline"
                    >
                      Click to view screenshot
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/30">
                <span className="text-xs font-bold text-indigo-400 uppercase mb-2 block">Admin Reply</span>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />

                <button
                  onClick={handleSendReply}
                  disabled={sending || !replyText.trim()}
                  className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold transition flex items-center justify-center gap-2 mt-4 shadow-lg"
                >
                  {sending ? 'Sending...' : ' Send Reply'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Full Screen Image Modal */}
      {showImageModal && selectedTicket?.screenshot && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >

            </button>
            <img 
              src={selectedTicket.screenshot} 
              alt="User Screenshot" 
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
    }
