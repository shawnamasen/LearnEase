import LogoutConfirmModal from '../components/LogoutConfirmModal';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Home, Library, Bot, FileText, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { getProgress } from '../lib/progress';

function initialsFromName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export default function Progress() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem('user') ||
        localStorage.getItem('user') ||
        'null'
      );
    } catch {
      return null;
    }
  }, []);

  const displayName = user?.name || user?.displayName || user?.email || 'Student';
  const avatar = initialsFromName(displayName);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const p = await getProgress(user);
      if (mounted) {
        setData(p);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleConfirmLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const avg = useMemo(() => {
    if (!data) return 0;
    const total = Number(data.totalAnswers || 0);
    const correct = Number(data.correctAnswers || 0);
    return total ? Math.round((correct / total) * 100) : 0;
  }, [data]);

  const navItems = [
    { icon: <Home className="h-5 w-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Library className="h-5 w-5" />, label: 'Study Materials', path: '/study-materials' },
    { icon: <Bot className="h-5 w-5" />, label: 'AI Assistant', path: '/ai-assistant' },
    { icon: <FileText className="h-5 w-5" />, label: 'Quiz Generator', path: '/quiz' },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Progress', path: '/progress', active: true },
    { icon: <Settings className="h-5 w-5" />, label: 'Settings', path: '/settings' }
  ];

  const Card = ({ title, value, sub }) => (
    <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-5">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub ? <p className="text-sm text-gray-300 mt-1">{sub}</p> : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 transition-all duration-300 flex flex-col fixed h-screen z-50`}>
        <div className={`p-5 border-b border-gray-700/50 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen ? (
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-emerald-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">LearnEase AI</span>
            </Link>
          ) : (
            <Brain className="h-8 w-8 text-emerald-400" />
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white transition">
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        <div className={`p-5 border-b border-gray-700/50 ${!sidebarOpen && 'flex justify-center'}`}>
          <div className={`flex ${sidebarOpen ? 'items-center space-x-4' : 'flex-col items-center space-y-2'}`}>
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-lg">{avatar}</div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{displayName}</p>
                <p className="text-xs text-gray-400 truncate">Your progress</p>
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

        {/* Logout */}
        <div className="p-5 border-t border-gray-700/50">
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`w-full flex items-center ${sidebarOpen ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-xl text-gray-400 hover:text-white hover:bg-red-500/10 transition-all`}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>

        <LogoutConfirmModal 
          isOpen={showLogoutModal}
          onConfirm={handleConfirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      </aside>

      <main className={`flex-1 ${sidebarOpen ? 'md:ml-72' : 'md:ml-20'} transition-all duration-300 h-screen overflow-y-auto`}>
        <header className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-white">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-6 w-6 text-emerald-400" />
              <h1 className="text-xl font-semibold">Progress</h1>
            </div>
            <button
              onClick={async () => {
                setLoading(true);
                setData(await getProgress(user));
                setLoading(false);
              }}
              className="text-sm px-3 py-2 rounded-xl bg-gray-800/70 border border-gray-700/60 hover:bg-gray-800"
            >
              Refresh
            </button>
          </div>
        </header>

        <div className="p-6 max-w-5xl mx-auto">
          {loading ? (
            <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-6 text-gray-300">Loading progress…</div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <Card title="AI Chats" value={data?.chats || 0} sub="Total AI assistant conversations" />
                <Card title="Quizzes Generated" value={data?.quizzesGenerated || 0} sub="Created with Gemini" />
                <Card title="Reviewers Generated" value={data?.reviewersGenerated || 0} sub="From your study materials" />
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <Card title="Quizzes Taken" value={data?.quizzesTaken || 0} sub="Interactive quiz attempts" />
                <Card title="Average Score" value={`${avg}%`} sub={`${data?.correctAnswers || 0} correct out of ${data?.totalAnswers || 0}`} />
                <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-5">
                  <p className="text-sm text-gray-400">Goal</p>
                  <p className="text-lg font-semibold mt-1">Reach 90% average</p>
                  <div className="mt-3 h-3 rounded-full bg-gray-800/70 border border-gray-700/60 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${Math.min(avg, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Keep taking quizzes to improve.</p>
                </div>
              </div>

              <div className="mt-6 bg-gray-900/60 border border-gray-700/50 rounded-2xl p-6">
                <h2 className="text-lg font-semibold">What counts in Progress?</h2>
                <ul className="mt-3 list-disc pl-5 text-gray-300 space-y-1">
                  <li>Every successful AI chat message increases <b>AI Chats</b>.</li>
                  <li>Every generated quiz increases <b>Quizzes Generated</b>.</li>
                  <li>Submitting a quiz updates <b>Quizzes Taken</b> and <b>Average Score</b>.</li>
                  <li>Generating an AI reviewer increases <b>Reviewers Generated</b>.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
