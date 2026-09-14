'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { api, getToken, socketBase } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Avatar, Card, Spinner } from '@/components/ui';

interface ConversationRow {
  id: string;
  contextType: string;
  other: { id: string; name: string; verified: boolean };
  booking: { id: string; experience: string; startAt: string; status: string } | null;
  lastMessage: { body: string; createdAt: string; moderationStatus: string } | null;
}
interface MessageRow {
  id: string;
  body: string;
  senderId: string;
  moderationStatus: string;
  createdAt: string;
}

function MessagesInner() {
  const params = useSearchParams();
  const [convos, setConvos] = useState<ConversationRow[] | null>(null);
  const [active, setActive] = useState<string | null>(params.get('c'));
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState('');
  const [meId, setMeId] = useState('');
  const [notice, setNotice] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConvos = useCallback(async () => {
    const me = await api<{ id: string }>('/auth/me').catch(() => null);
    if (me) setMeId(me.id);
    setConvos(await api<ConversationRow[]>('/conversations').catch(() => []));
  }, []);

  useEffect(() => { void loadConvos(); }, [loadConvos]);

  useEffect(() => {
    if (!active) return;
    void api<MessageRow[]>(`/conversations/${active}/messages`).then((m) => setMessages(m));
  }, [active]);

  // Realtime
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const socket = io(socketBase, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('message:new', (m: MessageRow) => {
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      void loadConvos();
    });
    socket.on('notification:new', () => void loadConvos());
    return () => { socket.disconnect(); };
  }, [loadConvos]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function send() {
    if (!draft.trim() || !active) return;
    const body = draft.trim();
    setDraft('');
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('message:send', { conversationId: active, body }, (res: { ok: boolean; held?: boolean; warning?: string; message?: MessageRow }) => {
        if (res.warning) setNotice(res.warning);
        if (res.ok && !res.held && res.message) setMessages((p) => [...p, res.message!]);
      });
    } else {
      void api<{ moderationStatus?: string; warning?: string }>('/messages', { method: 'POST', body: { conversationId: active, body } }).then((r) => {
        if (r.warning) setNotice(r.warning);
      });
    }
    setTimeout(() => setNotice(''), 6000);
  }

  const activeConvo = convos?.find((c) => c.id === active);

  return (
    <AppShell title="Messages">
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-[260px_1fr] min-h-[60vh]">
          {/* Conversation list */}
          <div className="border-r border-sand-200 bg-sand-50 overflow-y-auto max-h-[70vh]">
            {convos === null ? (
              <div className="p-4 text-sand-600 flex gap-2"><Spinner /> Loading…</div>
            ) : convos.length === 0 ? (
              <p className="p-4 text-sm text-sand-600">No conversations yet. Book a companion to start chatting.</p>
            ) : (
              convos.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActive(c.id)}
                  className={`w-full text-left p-3 flex gap-3 items-center border-b border-sand-200/60 hover:bg-white ${active === c.id ? 'bg-white' : ''}`}
                >
                  <Avatar name={c.other.name} size="sm" index={c.other.name.length} />
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{c.other.name} {c.other.verified && '🛡'}</div>
                    <div className="text-xs text-sand-600 truncate">{c.booking ? `${c.booking.experience} · ` : ''}{c.lastMessage?.body ?? ''}</div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Thread */}
          <div className="flex flex-col bg-sand-50 min-h-[60vh]">
            {!active ? (
              <div className="flex-1 grid place-items-center text-sand-600 text-sm p-6">Select a conversation</div>
            ) : (
              <>
                <div className="bg-white border-b border-sand-200 px-4 py-3 font-bold text-sm flex items-center gap-2">
                  {activeConvo?.other.name}
                  {activeConvo?.other.verified && <span className="text-teal-700">🛡 Verified</span>}
                  {activeConvo?.booking && (
                    <span className="ml-auto bg-teal-100 text-teal-800 rounded-full px-2.5 py-0.5 text-xs font-bold">
                      {activeConvo.booking.experience}
                    </span>
                  )}
                </div>
                {notice && (
                  <div className="bg-sand-100 text-center text-xs text-sand-600 px-4 py-2 border-b border-sand-200">{notice}</div>
                )}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[55vh]">
                  {messages.map((m) => {
                    const mine = m.senderId === meId;
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${mine ? 'bg-teal-700 text-white rounded-br-md' : 'bg-white border border-sand-200 rounded-bl-md'}`}>
                          {m.moderationStatus === 'HELD' && mine ? (
                            <span className="italic opacity-80">Message held for safety review.</span>
                          ) : (
                            m.body
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
                <div className="p-3 bg-white border-t border-sand-200 flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                    placeholder="Type a message…"
                    className="flex-1 h-11 rounded-lg border border-sand-200 px-3 text-sm focus:outline-none focus:border-teal-600"
                  />
                  <button onClick={send} className="h-11 px-5 rounded-lg bg-teal-700 text-white font-bold text-sm hover:bg-teal-800">
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </AppShell>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8"><Spinner /></div>}>
      <MessagesInner />
    </Suspense>
  );
}
