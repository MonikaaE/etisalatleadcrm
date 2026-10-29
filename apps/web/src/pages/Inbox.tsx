import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Phone,
  Clock,
  CheckCircle2,
  Lock,
  Building2
} from 'lucide-react';
import api from '../lib/api';

export const Inbox: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [conversations, setConversations] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations');
      if (res.data?.success) {
        setConversations(res.data.data);
        if (res.data.data.length > 0 && !selectedConv) {
          loadConversation(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const res = await api.get(`/conversations/${id}`);
      if (res.data?.success) {
        setSelectedConv(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;

    try {
      if (isInternalNote) {
        await api.post(`/conversations/${selectedConv.id}/notes`, { body: replyText });
      } else {
        // Send outbound message
        await api.post(`/conversations/${selectedConv.id}/notes`, { body: replyText });
      }
      setReplyText('');
      loadConversation(selectedConv.id);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">WhatsApp Shared Inbox</h1>
        <p className="text-sm text-slate-400">Manage 2-way customer conversations, incoming SIM queries, and internal team handoffs</p>
      </div>

      <div className="glass-card h-[calc(100vh-220px)] min-h-[500px] flex overflow-hidden border-[rgba(99,102,241,0.2)]">
        {/* Left pane: Conversations List */}
        <div className="w-80 border-r border-[rgba(99,102,241,0.15)] bg-[#0f1629]/60 flex flex-col">
          <div className="p-4 border-b border-[rgba(99,102,241,0.1)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Inquiries
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[rgba(99,102,241,0.08)]">
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading inbox...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No active conversations.</div>
            ) : (
              conversations.map((c) => {
                const isSelected = selectedConv?.id === c.id;
                const contact = c.contacts?.[0]?.contact;
                return (
                  <div
                    key={c.id}
                    onClick={() => loadConversation(c.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-600/15 border-l-2 border-indigo-500' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-semibold text-slate-200 text-sm truncate">
                        {contact ? `${contact.firstName} ${contact.lastName}` : c.phoneNumber}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {contact?.company?.name && (
                      <div className="text-xs text-indigo-300 truncate mt-0.5">
                        {contact.company.name}
                      </div>
                    )}

                    <div className="text-xs text-slate-400 truncate mt-1">
                      {c.messages?.[0]?.body || 'Inbound WhatsApp thread...'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right pane: Chat details & message stream */}
        <div className="flex-1 flex flex-col bg-[#0a0f1e]/40">
          {selectedConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-[rgba(99,102,241,0.15)] bg-[#0f1629]/50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-200 text-sm">
                    {selectedConv.contacts?.[0]?.contact
                      ? `${selectedConv.contacts[0].contact.firstName} ${selectedConv.contacts[0].contact.lastName}`
                      : selectedConv.phoneNumber}
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span>{selectedConv.phoneNumber}</span>
                    <span>•</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> WhatsApp Business
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="badge-purple text-xs">
                    {selectedConv.assignedTo
                      ? `Rep: ${selectedConv.assignedTo.firstName}`
                      : 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {selectedConv.messages?.map((msg: any) => {
                  const isOut = msg.direction === 'outbound';
                  const isNote = msg.isInternal;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isNote
                          ? 'items-center my-2'
                          : isOut
                          ? 'items-end'
                          : 'items-start'
                      }`}
                    >
                      {isNote ? (
                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-3 py-1.5 rounded-lg max-w-md flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Internal Note: {msg.body}</span>
                        </div>
                      ) : (
                        <div
                          className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                            isOut
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-[#131d35] text-slate-200 border border-[rgba(99,102,241,0.15)] rounded-tl-none'
                          }`}
                        >
                          <p>{msg.body}</p>
                          <div
                            className={`text-[10px] mt-1 text-right ${
                              isOut ? 'text-indigo-200' : 'text-slate-500'
                            }`}
                          >
                            {new Date(msg.sentAt || msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-[rgba(99,102,241,0.15)] bg-[#0f1629]/60">
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(false)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      !isInternalNote
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Reply via WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(true)}
                    className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-colors ${
                      isInternalNote
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span>Internal Note (Private)</span>
                  </button>
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      isInternalNote
                        ? 'Leave an internal note for the sales team...'
                        : 'Type your message to customer...'
                    }
                    className="input-field text-xs py-2 flex-1"
                  />
                  <button
                    type="submit"
                    className="btn-primary text-xs py-2 px-4"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              Select a conversation from the left to view the message thread
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
