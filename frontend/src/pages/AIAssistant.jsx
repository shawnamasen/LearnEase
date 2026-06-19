import LogoutConfirmModal from '../components/LogoutConfirmModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { trackEvent, saveRecentActivity } from '../lib/progress';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain,
  Home,
  Library,
  Bot,
  FileText,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit3,
  X,
  Loader2,
  SendHorizonal,
  Sparkles
} from 'lucide-react';

import axios from '../axiosConfig';

import { db } from '../lib/firebase';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  limit,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

function initialsFromName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

// Firestore paths
function threadsCol(uid) {
  return collection(db, 'ai_chats', uid, 'threads');
}
function threadDoc(uid, threadId) {
  return doc(db, 'ai_chats', uid, 'threads', threadId);
}
function messagesCol(uid, threadId) {
  return collection(db, 'ai_chats', uid, 'threads', threadId, 'messages');
}

// Generate a smart title from the first user message
function generateTitleFromMessage(text) {
  const t = String(text || '').trim();
  if (!t) return 'New conversation';

  const words = t.split(/\s+/).filter(Boolean);
  if (words.length <= 5) {
    return t.length <= 40 ? t : t.slice(0, 40) + '…';
  }

  return words.slice(0, 5).join(' ') + '…';
}

export default function AIAssistant() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const user = useMemo(() => getStoredUser(), []);
  const [fbUser, setFbUser] = useState(null);
  const uid = fbUser?.uid || '';

  const [threads, setThreads] = useState([]);
  const [threadSearch, setThreadSearch] = useState('');
  const [activeThreadId, setActiveThreadId] = useState('');
  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setFbUser(u || null);
      if (!u) navigate('/login');
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!uid) return;
    setLoadingThreads(true);

    const q = query(threadsCol(uid), orderBy('updatedAt', 'desc'), limit(40));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setThreads(list);
        setLoadingThreads(false);

        if (!activeThreadId && list.length) {
          setActiveThreadId(list[0].id);
        }
      },
      (err) => {
        console.error('listenThreads error:', err);
        setLoadingThreads(false);
      }
    );

    return () => unsub();
  }, [uid, activeThreadId]);

  useEffect(() => {
    if (!uid || !activeThreadId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const q = query(messagesCol(uid, activeThreadId), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoadingMessages(false);
      },
      (err) => {
        console.error('listenMessages error:', err);
        setLoadingMessages(false);
      }
    );

    return () => unsub();
  }, [uid, activeThreadId]);

  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const displayName = user?.name || fbUser?.displayName || 'User';
  const avatar = initialsFromName(displayName);
  const email = fbUser?.email || user?.email || '';

  const filteredThreads = useMemo(() => {
    const s = threadSearch.trim().toLowerCase();
    if (!s) return threads;
    return threads.filter((t) => {
      const title = String(t.title || '').toLowerCase();
      const last = String(t.lastMessage || '').toLowerCase();
      return title.includes(s) || last.includes(s);
    });
  }, [threads, threadSearch]);

  async function createNewChat() {
    if (!uid) return;
    try {
      const ref = await addDoc(threadsCol(uid), {
        title: 'New conversation',
        lastMessage: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        pinned: false,
        archived: false,
      });
      setActiveThreadId(ref.id);
      setInput('');
    } catch (e) {
      console.error('createNewChat:', e);
    }
  }

  function openRename() {
    const t = threads.find((x) => x.id === activeThreadId);
    setRenameValue(t?.title || 'New conversation');
    setRenameOpen(true);
  }

  async function confirmRename() {
    if (!uid || !activeThreadId) return;
    const title = String(renameValue || '').trim() || 'New conversation';
    try {
      await updateDoc(threadDoc(uid, activeThreadId), {
        title,
        updatedAt: serverTimestamp(),
      });
      setRenameOpen(false);
    } catch (e) {
      console.error('rename thread:', e);
    }
  }

  async function confirmDelete() {
    if (!uid || !activeThreadId) return;
    try {
      const snap = await getDocs(messagesCol(uid, activeThreadId));
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
      await deleteDoc(threadDoc(uid, activeThreadId));

      const remaining = threads.filter((t) => t.id !== activeThreadId);
      setActiveThreadId(remaining[0]?.id || '');
      setDeleteOpen(false);
    } catch (e) {
      console.error('delete thread:', e);
    }
  }

  async function addMessageToFirestore(threadId, role, content, extra = {}) {
    await addDoc(messagesCol(uid, threadId), {
      role,
      content,
      ...extra,
      createdAt: serverTimestamp(),
    });

    await updateDoc(threadDoc(uid, threadId), {
      lastMessage: String(content || '').slice(0, 120),
      updatedAt: serverTimestamp(),
      ...(extra?.shouldUpdateTitle ? { title: generateTitleFromMessage(content) } : {}),
    });
  }

  async function sendMessage() {
    const text = String(input || '').trim();
    if (!text || sending || !uid) return;

    setSending(true);
    setInput('');

    try {
      let threadId = activeThreadId;
      let isNewThread = false;

      if (!threadId) {
        const ref = await addDoc(threadsCol(uid), {
          title: 'New conversation',
          lastMessage: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          pinned: false,
          archived: false,
        });
        threadId = ref.id;
        setActiveThreadId(threadId);
        isNewThread = true;
      }

      await addMessageToFirestore(threadId, 'user', text, {
        shouldUpdateTitle: isNewThread
      });

      const res = await axios.post('/ai/chat', {
        message: text,
        threadId,
        history: messages.slice(-6).map(m => ({
          role: m.role,
          content: m.content
        }))
      });

      const reply =
        res?.data?.reply ??
        res?.data?.text ??
        res?.data?.message ??
        res?.data?.data?.reply ??
        'Sorry — no response was returned.';

      await addMessageToFirestore(threadId, 'assistant', String(reply), {
        model: res?.data?.model || null,
      });
      await trackEvent(user, 'chat');

      saveRecentActivity(user, {
        title: `AI Chat: ${text.slice(0, 30)}${text.length > 30 ? '...' : ''}`,
        type: 'ai',
        meta: 'AI Assistant'
      });

    } catch (e) {
      console.error('sendMessage:', e);
      try {
        if (activeThreadId) {
          await addMessageToFirestore(activeThreadId, 'assistant', '⚠️ Error: Failed to get AI response.');
        }
      } catch {}
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleConfirmLogout() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login');
  }

  const navItems = [
    { icon: <Home className="h-5 w-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Library className="h-5 w-5" />, label: 'Study Materials', path: '/study-materials' },
    { icon: <Bot className="h-5 w-5" />, label: 'AI Assistant', path: '/ai-assistant', active: true },
    { icon: <FileText className="h-5 w-5" />, label: 'Quiz Generator', path: '/quiz' },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Progress', path: '/progress' },
    { icon: <SettingsIcon className="h-5 w-5" />, label: 'Settings', path: '/settings' }
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 transition-all duration-300 flex flex-col fixed h-screen z-50`}>
        <div className={`p-5 border-b border-gray-700/50 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen ? (
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-emerald-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                LearnEase AI
              </span>
            </Link>
          ) : (
            <Brain className="h-8 w-8 text-emerald-400" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition"
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        <div className={`p-5 border-b border-gray-700/50 ${!sidebarOpen && 'flex justify-center'}`}>
          <div className={`flex ${sidebarOpen ? 'items-center space-x-4' : 'flex-col items-center space-y-2'}`}>
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-lg">
              {avatar}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{displayName}</p>
                <p className="text-xs text-gray-400 truncate">{email}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3">
          <div className="space-y-2">
            {navItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className={`flex items-center ${sidebarOpen ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-xl transition-all ${
                  item.active
                    ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/50 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {item.icon}
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-5 border-t border-gray-700/50">
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`w-full flex items-center ${sidebarOpen ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-xl text-gray-400 hover:text-white hover:bg-red-500/10 transition-all`}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 ${sidebarOpen ? 'md:ml-72' : 'md:ml-20'} transition-all duration-300 h-screen flex flex-col overflow-hidden`}>
        <header className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 flex-shrink-0">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-3">
              <Sparkles className="h-6 w-6 text-emerald-400" />
              <h1 className="text-xl font-semibold">AI Assistant</h1>
            </div>
            <div />
          </div>
        </header>

        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-5">
            <section className="lg:col-span-3 rounded-3xl border border-gray-700/50 bg-gray-900/60 flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-gray-700/50 flex items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-400" />
                  <h2 className="font-semibold">Recent chats</h2>
                </div>
                <button
                  onClick={createNewChat}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-2 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  New
                </button>
              </div>

              <div className="p-4 border-b border-gray-700/50 flex-shrink-0">
                <div className="relative">
                  <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    value={threadSearch}
                    onChange={(e) => setThreadSearch(e.target.value)}
                    placeholder="Search chats..."
                    className="w-full pl-9 pr-3 py-3 rounded-2xl bg-gray-800/50 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                {loadingThreads ? (
                  <div className="p-6 flex items-center gap-2 text-gray-300">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                    Loading chats…
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="p-6 text-sm text-gray-400">
                    No chats yet. Click <span className="text-emerald-300 font-semibold">New</span> to start.
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredThreads.map((t) => {
                      const active = t.id === activeThreadId;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setActiveThreadId(t.id)}
                          className={`w-full text-left px-4 py-3 rounded-2xl border mb-2 transition-colors ${
                            active
                              ? 'bg-emerald-500/15 border-emerald-500/30'
                              : 'bg-gray-800/20 border-gray-700/40 hover:bg-gray-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className={`font-semibold truncate ${active ? 'text-emerald-200' : 'text-gray-100'}`}>
                                {t.title || 'New conversation'}
                              </p>
                              <p className="text-xs text-gray-400 truncate mt-1">
                                {t.lastMessage || 'No messages yet'}
                              </p>
                            </div>
                            <div className="text-xs text-gray-500 whitespace-nowrap">
                              {t.updatedAt?.toDate ? formatTime(t.updatedAt.toDate()) : ''}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className="lg:col-span-9 rounded-3xl border border-gray-700/50 bg-gray-900/60 flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-gray-700/50 flex items-center justify-between gap-3 flex-shrink-0">
                <div className="min-w-0">
                  <p className="font-semibold text-lg truncate">
                    {threads.find((t) => t.id === activeThreadId)?.title || 'New conversation'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {activeThreadId ? 'Conversation saved' : 'Start a new conversation'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={openRename}
                    disabled={!activeThreadId}
                    className="px-3 py-2 rounded-xl border border-gray-700/60 hover:bg-gray-800/40 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Edit3 className="h-4 w-4 text-gray-300" />
                    Rename
                  </button>
                  <button
                    onClick={() => setDeleteOpen(true)}
                    disabled={!activeThreadId}
                    className="px-3 py-2 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4 text-red-300" />
                    Delete
                  </button>
                </div>
              </div>

              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-6 min-h-0"
              >
                {loadingMessages ? (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                    Loading messages…
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-gray-400">
                    Ask anything. Your messages will be saved and show up in <span className="text-emerald-300 font-semibold">Recent chats</span>.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((m) => (
                      <MessageBubble key={m.id} role={m.role} content={m.content} />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-700/50 flex-shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    rows={2}
                    placeholder="Message LearnEase AI…"
                    className="flex-1 px-4 py-3 rounded-2xl bg-gray-800/50 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                    disabled={!uid}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!uid || sending || !input.trim()}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 transition-colors font-semibold flex items-center gap-2 disabled:opacity-60"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
                    <span>Send</span>
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Enter to send • Shift+Enter for new line
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      <DeleteConfirmModal
        isOpen={deleteOpen}
        title="Delete Chat"
        message="This will permanently delete the selected chat and all its messages. This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      {renameOpen && (
        <Modal title="Rename chat" onClose={() => setRenameOpen(false)}>
          <div className="space-y-3">
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-800/50 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              placeholder="Chat title"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRenameOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-700/60 hover:bg-gray-800/40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRename}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MessageBubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-5 py-3 border ${
          isUser
            ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-50'
            : 'bg-gray-800/35 border-gray-700/40 text-gray-100'
        }`}
      >
        <div className="text-xs opacity-70 mb-1">{isUser ? 'You' : 'LearnEase AI'}</div>
        <div className="whitespace-pre-wrap text-base leading-relaxed">{content}</div>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-gray-700/50 bg-gray-900/95 backdrop-blur-xl overflow-hidden">
        <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-800/40 transition-colors">
            <X className="h-4 w-4 text-gray-300" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function formatTime(d) {
  try {
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  } catch {
    return '';
  }
}