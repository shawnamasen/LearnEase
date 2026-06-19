import LogoutConfirmModal from '../components/LogoutConfirmModal';

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain, Home, Settings, LogOut,
  Bell, Search, MessageCircle, FileText, BarChart3,
  Clock, Zap, Target,
  PlayCircle, ChevronRight, Filter,
  Bot, Sparkles,
  Menu, Activity, ChevronLeft, ChevronDown,
  Library, Users, Gauge
} from 'lucide-react';
import axios from '../axiosConfig';

function initialsFromName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function formatHours(seconds) {
  const hrs = Math.max(0, Number(seconds || 0)) / 3600;
  if (hrs < 1) return `${Math.round(hrs * 60)} min`;
  return `${hrs.toFixed(1)} hrs`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [user, setUser] = useState(() => getStoredUser());
  const uid = user?.uid || user?.localId || user?.user_id || 'anon';

  const [metrics, setMetrics] = useState({ totalUsers: null, adminConfigured: false });
  const [activityCount, setActivityCount] = useState(0);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [bootError, setBootError] = useState('');

  const displayName = user?.name || user?.displayName || user?.email || 'User';
  const avatar = useMemo(() => initialsFromName(displayName), [displayName]);

  const handleConfirmLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  // Local-only tracking (works even if Firestore rules block writes)
  const activeSecondsKey = `learnease_active_seconds_${uid}`;
  const activityCountKey = `learnease_activity_count_${uid}`;
  const recentActivityKey = `learnease_recent_activity_${uid}`;

  useEffect(() => {
    // Keep user in sync if login updates storage
    const onStorage = () => setUser(getStoredUser());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    // If user isn't logged in, go back to login
    if (!getStoredToken()) return;
  }, []);

  useEffect(() => {
    // Load local counters
    const storedSeconds = Number(localStorage.getItem(activeSecondsKey) || 0);
    const storedCount = Number(localStorage.getItem(activityCountKey) || 0);
    setActiveSeconds(storedSeconds);
    setActivityCount(storedCount);

    try {
      const arr = JSON.parse(localStorage.getItem(recentActivityKey) || '[]');
      setRecentActivity(Array.isArray(arr) ? arr : []);
    } catch {
      setRecentActivity([]);
    }

    // Track active time
    let last = Date.now();
    const t = setInterval(() => {
      const now = Date.now();
      const delta = Math.max(0, Math.floor((now - last) / 1000));
      last = now;

      setActiveSeconds((prev) => {
        const next = prev + delta;
        localStorage.setItem(activeSecondsKey, String(next));
        return next;
      });
    }, 5000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    // Boot: fetch server metrics (total users)
    const boot = async () => {
      setBootError('');
      try {
        const token = getStoredToken();
        if (!token) return;

        const res = await axios.get('/auth/metrics', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res?.data?.success) {
          setMetrics({
            totalUsers: res.data?.data?.totalUsers ?? null,
            adminConfigured: Boolean(res.data?.data?.adminConfigured)
          });
        }
      } catch (e) {
        // Don't crash dashboard on metrics errors.
        setBootError(e?.response?.data?.error || 'Dashboard metrics unavailable');
      }
    };

    boot();
  }, []);

  const stats = useMemo(() => {
    const engagement = Math.min(100, Math.round((activityCount * 7 + activeSeconds / 60) / 5)); // simple heuristic
    return {
      activitiesCompleted: activityCount,
      learningTime: formatHours(activeSeconds),
      totalUsers: metrics.totalUsers,
      engagementScore: engagement
    };
  }, [activityCount, activeSeconds, metrics.totalUsers]);

  const renderTotalUsers = () => {
    if (metrics.totalUsers === null) return metrics.adminConfigured ? '—' : 'Setup needed';
    return String(metrics.totalUsers);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 transition-all duration-300 flex flex-col fixed h-screen z-50`}>
        {/* Sidebar Header */}
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
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        {/* User Profile Summary */}
        <div className={`p-5 border-b border-gray-700/50 ${!sidebarOpen && 'flex justify-center'}`}>
          <div className={`flex ${sidebarOpen ? 'items-center space-x-4' : 'flex-col items-center space-y-2'}`}>
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-lg">
                {avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-gray-900"></div>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{displayName}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-5 px-3">
          <div className="space-y-2">
            {[
              { icon: <Home className="h-5 w-5" />, label: 'Dashboard', path: '/dashboard', active: true },
              { icon: <Library className="h-5 w-5" />, label: 'Study Materials', path: '/study-materials', active: false },
              { icon: <Bot className="h-5 w-5" />, label: 'AI Assistant', path: '/ai-assistant', active: false },
              { icon: <FileText className="h-5 w-5" />, label: 'Quiz Generator', path: '/quiz', active: false },
              { icon: <BarChart3 className="h-5 w-5" />, label: 'Progress', path: '/progress', active: false },
              { icon: <Settings className="h-5 w-5" />, label: 'Settings', path: '/settings', active: false }
            ].map((item, index) => (
              <Link
                key={index}
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

      {/* Main Content */}
      <main className={`flex-1 ${sidebarOpen ? 'md:ml-72' : 'md:ml-20'} transition-all duration-300 h-screen overflow-y-auto`}>
        {/* Top Navigation */}
        <header className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-white" aria-label="Open sidebar">
              <Menu className="h-6 w-6" />
            </button>

            {/* Search Bar (UI only) */}
            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
                <div className="relative flex items-center">
                  <Search className="absolute left-4 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses, quizzes, or ask AI..."
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2.5 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <div className="absolute right-3 flex items-center space-x-2">
                    <span className="text-xs text-gray-500 border border-gray-700 px-2 py-1 rounded-md bg-gray-800/80">⌘ K</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Icons */}
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition" aria-label="Messages">
                <MessageCircle className="h-5 w-5" />
              </button>
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 hover:bg-gray-800/50 rounded-lg transition" aria-label="Profile">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center text-sm font-bold">
                    {avatar}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-8 pb-12">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 p-6">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-purple-500/10"></div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Welcome back, {displayName}!</span>
                </div>
                <h1 className="text-3xl font-bold">
                  Ready to continue your
                  <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    learning journey?
                  </span>
                </h1>
                <p className="text-gray-400 max-w-xl">
                  {bootError ? bootError : 'Your dashboard updates as you use LearnEase (no mock data).'}
                </p>
                <div className="flex items-center space-x-4 pt-2">
                  <Link to="/study-materials" className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center space-x-2">
                    <PlayCircle className="h-5 w-5" />
                    <span>Continue Learning</span>
                  </Link>
                  <Link to="/ai-assistant" className="border border-gray-600 hover:border-emerald-400 px-6 py-2.5 rounded-lg font-medium transition-all flex items-center space-x-2">
                    <Bot className="h-5 w-5" />
                    <span>Chat with AI</span>
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur-3xl opacity-20"></div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Activity className="h-6 w-6 text-emerald-400" />, label: 'Activities Completed', value: String(stats.activitiesCompleted), change: 'Your total actions' },
              { icon: <Clock className="h-6 w-6 text-cyan-400" />, label: 'Learning Time', value: stats.learningTime, change: 'Active time on site' },
              { icon: <Users className="h-6 w-6 text-yellow-400" />, label: 'Total Users', value: renderTotalUsers(), change: metrics.adminConfigured ? 'From Firebase' : 'Needs Admin key' },
              { icon: <Gauge className="h-6 w-6 text-purple-400" />, label: 'Engagement Score', value: `${stats.engagementScore}%`, change: 'Based on usage' }
            ].map((stat, index) => (
              <div key={index} className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-emerald-400/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gray-700/50 p-3 rounded-lg">{stat.icon}</div>
                  <span className="text-xs text-emerald-400">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-6 w-6 text-emerald-400" />
                  <h2 className="text-xl font-semibold">Recent Activity</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="text-sm text-gray-400 hover:text-white flex items-center"
                    onClick={() => {
                      localStorage.removeItem(recentActivityKey);
                      localStorage.removeItem(activityCountKey);
                      setRecentActivity([]);
                      setActivityCount(0);
                    }}
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    Clear
                  </button>
                  <Link to="/progress" className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center">
                    View all
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>

              {recentActivity.length ? (
                <div className="space-y-3">
                  {recentActivity.slice(0, 8).map((a, idx) => (
                    <div key={idx} className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gray-700/50 p-2 rounded-lg">
                          {a.type === 'quiz' ? <FileText className="h-5 w-5 text-cyan-400" /> : <Bot className="h-5 w-5 text-emerald-400" />}
                        </div>
                        <div>
                          <p className="font-medium">{a.title || 'Activity'}</p>
                          <p className="text-xs text-gray-400">{a.time || ''}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{a.meta || ''}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8 text-center">
                  <Activity className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No recent activity</p>
                  <p className="text-sm text-gray-500 mt-1">As you use LearnEase, your activity will appear here.</p>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* AI Recommendations */}
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-emerald-400" />
                    <h3 className="font-semibold">AI Recommendations</h3>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                    Smart
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { title: 'Generate a reviewer from your notes', icon: <Target className="h-4 w-4" />, to: '/study-materials' },
                    { title: 'Ask AI to summarize a topic', icon: <Bot className="h-4 w-4" />, to: '/ai-assistant' },
                    { title: 'Create a quick quiz for practice', icon: <Zap className="h-4 w-4" />, to: '/quiz' }
                  ].map((r, idx) => (
                    <Link key={idx} to={r.to} className="flex items-center justify-between p-3 rounded-xl border border-gray-700 hover:border-emerald-400/50 bg-gray-900/30 transition">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-emerald-400">{r.icon}</span>
                        <span>{r.title}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <Link to="/quiz" className="flex items-center justify-center space-x-2 p-4 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl hover:border-emerald-400/50 transition-all group">
                  <Bot className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition" />
                  <span className="text-sm font-medium">Generate Quiz</span>
                </Link>
                <Link to="/study-materials" className="flex items-center justify-center space-x-2 p-4 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl hover:border-emerald-400/50 transition-all group">
                  <FileText className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition" />
                  <span className="text-sm font-medium">Create Reviewer</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="text-xs text-gray-500">
            Tip: Total Users requires Firebase Admin credentials in <span className="text-gray-300">backend/.env</span> (service account client email + private key).
          </div>
        </div>
      </main>
    </div>
  );
}
