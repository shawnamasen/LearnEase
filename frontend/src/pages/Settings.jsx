import LogoutConfirmModal from '../components/LogoutConfirmModal';

import React, { useEffect, useMemo, useState } from 'react';
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
  User,
  Bell,
  Sliders,
  Shield,
  Save,
  Check,
  X,
  Loader2,
  Trash2,
  RefreshCw,
  Sparkles
} from 'lucide-react';

import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
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

const DEFAULT_SETTINGS = (user, fbUser) => ({
  profile: {
    fullName: user?.name || fbUser?.displayName || '',
    username: user?.username || '',
    email: fbUser?.email || user?.email || '',
    bio: '',
    school: '',
    gradeLevel: '',
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    quizReminders: true,
    weeklyReport: true,
  },
  preferences: {
    theme: 'system',
    fontSize: 'medium',
    language: 'english',
    reducedMotion: false,
    highContrast: false,
  },
  privacy: {
    profileVisibility: 'private',
    shareProgress: false,
    shareAchievements: false,
  },
});

export default function Settings() {
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  const user = useMemo(() => getStoredUser(), []);
  const [fbUser, setFbUser] = useState(null);
  const userId = fbUser?.uid || '';

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState(() => DEFAULT_SETTINGS(user, null));
  const [toast, setToast] = useState(null);

  // Auth watcher
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setFbUser(u || null);
      if (!u) navigate('/login');
    });
    return () => unsub();
  }, [navigate]);

  // Load settings doc
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setInitialLoading(true);
        if (!userId) return;

        const ref = doc(db, 'user_settings', userId);
        const snap = await getDoc(ref);

        const base = DEFAULT_SETTINGS(user, fbUser);

        if (snap.exists()) {
          const data = snap.data() || {};
          const merged = {
            ...base,
            ...data,
            profile: { ...base.profile, ...(data.profile || {}) },
            notifications: { ...base.notifications, ...(data.notifications || {}) },
            preferences: { ...base.preferences, ...(data.preferences || {}) },
            privacy: { ...base.privacy, ...(data.privacy || {}) },
          };
          if (!cancelled) setSettings(merged);
        } else {
          if (!cancelled) setSettings(base);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
        if (!cancelled) setToast({ type: 'error', msg: 'Failed to load settings. Please try again.' });
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, user, fbUser]);

  const handleConfirmLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login');
  }

  function update(path, value) {
    setSettings((prev) => {
      const next = { ...prev };
      const [group, key] = path.split('.');
      next[group] = { ...next[group], [key]: value };
      return next;
    });
  }

  async function saveAll() {
    try {
      setSaving(true);
      setToast(null);

      if (!userId) throw new Error('Missing Firebase uid');

      const payload = {
        ...settings,
        profile: {
          ...settings.profile,
          email: fbUser?.email || settings.profile.email || '',
        },
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'user_settings', userId), payload, { merge: true });

      const newName = String(settings.profile.fullName || '').trim();
      if (newName) {
        const stored = getStoredUser() || {};
        const updatedUser = { ...stored, name: newName };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setToast({ type: 'success', msg: 'Settings saved.' });
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      console.error('Save settings failed:', e);
      setToast({ type: 'error', msg: 'Save failed. Check your connection and try again.' });
    } finally {
      setSaving(false);
    }
  }

  function resetToDefaults() {
    setSettings(DEFAULT_SETTINGS(user, fbUser));
    setToast({ type: 'success', msg: 'Reset to defaults (not saved yet).' });
    setTimeout(() => setToast(null), 2500);
  }

  async function deleteSettingsDoc() {
    try {
      if (!userId) return;
      setSaving(true);
      await deleteDoc(doc(db, 'user_settings', userId));
      setSettings(DEFAULT_SETTINGS(user, fbUser));
      setToast({ type: 'success', msg: 'Settings deleted (restored defaults).' });
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      console.error('Delete settings failed:', e);
      setToast({ type: 'error', msg: 'Failed to delete settings.' });
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  const navItems = [
    { icon: <Home className="h-5 w-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Library className="h-5 w-5" />, label: 'Study Materials', path: '/study-materials' },
    { icon: <Bot className="h-5 w-5" />, label: 'AI Assistant', path: '/ai-assistant' },
    { icon: <FileText className="h-5 w-5" />, label: 'Quiz Generator', path: '/quiz' },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Progress', path: '/progress' },
    { icon: <SettingsIcon className="h-5 w-5" />, label: 'Settings', path: '/settings', active: true }
  ];

  const displayName = settings.profile.fullName || user?.name || fbUser?.displayName || 'User';
  const avatar = initialsFromName(displayName);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex overflow-hidden">
      {/* Sidebar - Quiz Generator style */}
      <aside
        className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 transition-all duration-300 flex flex-col fixed h-screen z-50`}
      >
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
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white transition">
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
                <p className="text-xs text-gray-400 truncate">Signed in</p>
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

      {/* Main Content - Quiz Generator style */}
      <main className={`flex-1 ${sidebarOpen ? 'md:ml-72' : 'md:ml-20'} transition-all duration-300 h-screen flex flex-col`}>
        {/* Top Bar - Quiz Generator style */}
        <header className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-white">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-3">
              <Sparkles className="h-6 w-6 text-emerald-400" />
              <h1 className="text-xl font-semibold">Settings</h1>
            </div>
            <div />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Toast */}
            {toast && (
              <div
                className={`mb-6 rounded-2xl border px-4 py-3 flex items-start justify-between gap-3 ${
                  toast.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-red-500/30 bg-red-500/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  {toast.type === 'success' ? (
                    <Check className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <X className="h-5 w-5 text-red-400" />
                  )}
                  <p className="text-sm">{toast.msg}</p>
                </div>
                <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Settings Header with Tabs and Actions */}
            <div className="bg-gray-800/50 border border-gray-700/60 rounded-3xl p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {tabs.map((t) => {
                    const Icon = t.icon;
                    const active = activeTab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`px-4 py-2 rounded-xl border transition-colors flex items-center gap-2 ${
                          active
                            ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/50 text-emerald-200'
                            : 'border-gray-700/60 hover:bg-gray-800/50 text-gray-200'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${active ? 'text-emerald-400' : 'text-gray-400'}`} />
                        <span className="font-medium">{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={resetToDefaults}
                    className="px-3 py-2 rounded-xl border border-gray-700/60 hover:bg-gray-800/50 transition-colors flex items-center gap-2"
                    disabled={saving || initialLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </button>

                  <button
                    onClick={saveAll}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors font-semibold flex items-center gap-2 disabled:opacity-60"
                    disabled={saving || initialLoading}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </button>
                </div>
              </div>
            </div>

            {initialLoading ? (
              <div className="bg-gray-800/50 border border-gray-700/60 rounded-3xl p-10 flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                <span className="text-gray-300">Loading settings…</span>
              </div>
            ) : (
              <>
                {activeTab === 'profile' && (
                  <section className="bg-gray-800/50 border border-gray-700/60 rounded-3xl p-6">
                    <h2 className="text-lg font-bold mb-1">Profile</h2>
                    <p className="text-sm text-gray-400 mb-6">Stored in Firestore for your account.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm text-gray-300">Full name</label>
                        <input
                          value={settings.profile.fullName}
                          onChange={(e) => update('profile.fullName', e.target.value)}
                          className="mt-2 w-full rounded-2xl bg-gray-900/40 border border-gray-700/60 px-4 py-3 text-sm outline-none focus:border-emerald-500/60"
                          placeholder="Your name"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-300">Username</label>
                        <input
                          value={settings.profile.username}
                          onChange={(e) => update('profile.username', e.target.value)}
                          className="mt-2 w-full rounded-2xl bg-gray-900/40 border border-gray-700/60 px-4 py-3 text-sm outline-none focus:border-emerald-500/60"
                          placeholder="e.g. babe_learner"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-sm text-gray-300">Email (read-only)</label>
                        <input
                          value={fbUser?.email || settings.profile.email || ''}
                          readOnly
                          className="mt-2 w-full rounded-2xl bg-gray-900/40 border border-gray-700/60 px-4 py-3 text-sm text-gray-400 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Email updates require Firebase Auth profile updates. This page saves only Firestore settings.
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-sm text-gray-300">Bio</label>
                        <textarea
                          value={settings.profile.bio}
                          onChange={(e) => update('profile.bio', e.target.value)}
                          rows={4}
                          className="mt-2 w-full rounded-2xl bg-gray-900/40 border border-gray-700/60 px-4 py-3 text-sm outline-none focus:border-emerald-500/60 resize-none"
                          placeholder="Tell us what you're studying…"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-300">School (optional)</label>
                        <input
                          value={settings.profile.school}
                          onChange={(e) => update('profile.school', e.target.value)}
                          className="mt-2 w-full rounded-2xl bg-gray-900/40 border border-gray-700/60 px-4 py-3 text-sm outline-none focus:border-emerald-500/60"
                          placeholder="e.g. PHINMA University of Pangasinan"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-300">Grade/Year level (optional)</label>
                        <input
                          value={settings.profile.gradeLevel}
                          onChange={(e) => update('profile.gradeLevel', e.target.value)}
                          className="mt-2 w-full rounded-2xl bg-gray-900/40 border border-gray-700/60 px-4 py-3 text-sm outline-none focus:border-emerald-500/60"
                          placeholder="e.g. 3rd year"
                        />
                      </div>
                    </div>
                  </section>
                )}

                {activeTab === 'notifications' && (
                  <section className="bg-gray-800/50 border border-gray-700/60 rounded-3xl p-6">
                    <h2 className="text-lg font-bold mb-1">Notifications</h2>
                    <p className="text-sm text-gray-400 mb-6">These toggles are stored in Firestore.</p>

                    <div className="space-y-4">
                      <ToggleRow
                        label="Email notifications"
                        desc="Receive important updates via email."
                        value={settings.notifications.emailNotifications}
                        onChange={(v) => update('notifications.emailNotifications', v)}
                      />
                      <ToggleRow
                        label="Push notifications"
                        desc="In-app notification preference."
                        value={settings.notifications.pushNotifications}
                        onChange={(v) => update('notifications.pushNotifications', v)}
                      />
                      <ToggleRow
                        label="Quiz reminders"
                        desc="Remind you to review and practice."
                        value={settings.notifications.quizReminders}
                        onChange={(v) => update('notifications.quizReminders', v)}
                      />
                      <ToggleRow
                        label="Weekly progress report"
                        desc="Show weekly summary in your dashboard."
                        value={settings.notifications.weeklyReport}
                        onChange={(v) => update('notifications.weeklyReport', v)}
                      />
                    </div>
                  </section>
                )}

                {activeTab === 'preferences' && (
                  <section className="bg-gray-800/50 border border-gray-700/60 rounded-3xl p-6">
                    <h2 className="text-lg font-bold mb-1">Preferences</h2>
                    <p className="text-sm text-gray-400 mb-6">Saved to Firestore (app-wide applying is optional).</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm text-gray-300">Theme</label>
                        <select
                          value={settings.preferences.theme}
                          onChange={(e) => update('preferences.theme', e.target.value)}
                          className="mt-2 w-full rounded-2xl bg-gray-900/40 border border-gray-700/60 px-4 py-3 text-sm outline-none focus:border-emerald-500/60"
                        >
                          <option value="system">System</option>
                          <option value="dark">Dark</option>
                          <option value="light">Light</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm text-gray-300">Font size</label>
                        <select
                          value={settings.preferences.fontSize}
                          onChange={(e) => update('preferences.fontSize', e.target.value)}
                          className="mt-2 w-full rounded-2xl bg-gray-900/40 border border-gray-700/60 px-4 py-3 text-sm outline-none focus:border-emerald-500/60"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm text-gray-300">Language</label>
                        <select
                          value={settings.preferences.language}
                          onChange={(e) => update('preferences.language', e.target.value)}
                          className="mt-2 w-full rounded-2xl bg-gray-900/40 border border-gray-700/60 px-4 py-3 text-sm outline-none focus:border-emerald-500/60"
                        >
                          <option value="english">English</option>
                          <option value="filipino">Filipino</option>
                        </select>
                      </div>

                      <div className="space-y-4">
                        <ToggleRow
                          label="Reduced motion"
                          desc="Prefer fewer animations."
                          value={settings.preferences.reducedMotion}
                          onChange={(v) => update('preferences.reducedMotion', v)}
                        />
                        <ToggleRow
                          label="High contrast"
                          desc="Improve readability."
                          value={settings.preferences.highContrast}
                          onChange={(v) => update('preferences.highContrast', v)}
                        />
                      </div>
                    </div>
                  </section>
                )}

                {activeTab === 'privacy' && (
                  <section className="bg-gray-800/50 border border-gray-700/60 rounded-3xl p-6">
                    <h2 className="text-lg font-bold mb-1">Privacy</h2>
                    <p className="text-sm text-gray-400 mb-6">Control what you share inside LearnEase.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm text-gray-300">Profile visibility</label>
                        <select
                          value={settings.privacy.profileVisibility}
                          onChange={(e) => update('privacy.profileVisibility', e.target.value)}
                          className="mt-2 w-full rounded-2xl bg-gray-900/40 border border-gray-700/60 px-4 py-3 text-sm outline-none focus:border-emerald-500/60"
                        >
                          <option value="private">Private</option>
                          <option value="public">Public</option>
                        </select>
                      </div>

                      <div className="space-y-4">
                        <ToggleRow
                          label="Share progress"
                          desc="Allow progress to be visible in-app."
                          value={settings.privacy.shareProgress}
                          onChange={(v) => update('privacy.shareProgress', v)}
                        />
                        <ToggleRow
                          label="Share achievements"
                          desc="Allow badges/certificates to be visible."
                          value={settings.privacy.shareAchievements}
                          onChange={(v) => update('privacy.shareAchievements', v)}
                        />
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-700/50">
                      <h3 className="font-semibold mb-2">Danger zone</h3>
                      <p className="text-sm text-gray-400 mb-4">
                        This deletes only your Firestore settings document (not your account).
                      </p>

                      <button
                        onClick={deleteSettingsDoc}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center gap-2 disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4 text-red-300" />
                        Delete settings
                      </button>
                    </div>
                  </section>
                )}

                <div className="mt-6 text-xs text-gray-500">
                  Stored at: <span className="text-gray-400">Firestore → user_settings/{userId}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-gray-900/40 border border-gray-700/60">
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${
          value ? 'bg-emerald-600' : 'bg-gray-700'
        }`}
        aria-pressed={value}
        title={value ? 'On' : 'Off'}
      >
        <span
          className={`w-5 h-5 rounded-full bg-white transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}