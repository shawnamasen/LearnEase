import LogoutConfirmModal from '../components/LogoutConfirmModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

// StudyMaterials.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain, Home, Library, Bot, FileText, BarChart3, Settings,
  LogOut, ChevronLeft, ChevronRight, Menu, Upload, Sparkles,
  Loader, Copy, Check, AlertTriangle, History, Search, X,
  Trash2, BookOpen, Eye, Clock
} from 'lucide-react';
import axios from '../axiosConfig';
import { trackEvent, saveRecentActivity } from '../lib/progress';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

function initialsFromName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

// Firestore paths for reviewer history
function reviewersCol(uid) {
  return collection(db, 'study_materials', uid, 'reviewers');
}

function reviewerDoc(uid, reviewerId) {
  return doc(db, 'study_materials', uid, 'reviewers', reviewerId);
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Unknown';
  }
}

export default function StudyMaterials() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fbUser, setFbUser] = useState(null);
  const uid = fbUser?.uid || '';

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [mode, setMode] = useState('reviewer');

  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const [isLoadedFromHistory, setIsLoadedFromHistory] = useState(false);

  const [showWarning, setShowWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [warningMessage, setWarningMessage] = useState('');

  const [reviewers, setReviewers] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');

  // Delete confirmations
  const [showFileDeleteModal, setShowFileDeleteModal] = useState(false);
  const [showHistoryDeleteModal, setShowHistoryDeleteModal] = useState(false);
  const [selectedReviewerId, setSelectedReviewerId] = useState(null);

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
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setFbUser(u || null);
      if (!u) navigate('/login');
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!uid) return;
    setLoadingHistory(true);

    const q = query(reviewersCol(uid), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt
        }));
        setReviewers(list);
        setLoadingHistory(false);
      },
      (err) => {
        console.error('Error loading reviewer history:', err);
        setLoadingHistory(false);
      }
    );

    return () => unsub();
  }, [uid]);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  const handleConfirmLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const hasUnsavedGeneratedContent = () => {
    return result !== null && !isLoadedFromHistory;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    setFileError('');

    if (!selectedFile) return;

    const validTypes = ['.pdf', '.docx', '.txt'];
    const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(fileExt)) {
      setFileError('Please upload a PDF, DOCX, or TXT file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setFileError('File size must be less than 10MB');
      return;
    }

    if (hasUnsavedGeneratedContent()) {
      setWarningMessage('You have unsaved generated content. Selecting a new file will clear your current output. Continue?');
      setShowWarning(true);
      setPendingAction(() => () => {
        setFile(selectedFile);
        setResult(null);
        setIsLoadedFromHistory(false);
      });
    } else {
      setFile(selectedFile);
    }
  };

  // open confirmation modal instead of deleting immediately
  const handleFileRemove = () => {
    setShowFileDeleteModal(true);
  };

  const confirmFileDelete = () => {
    if (hasUnsavedGeneratedContent()) {
      setShowFileDeleteModal(false);
      setWarningMessage('You have unsaved generated content. Removing the file will clear your current output. Continue?');
      setShowWarning(true);
      setPendingAction(() => () => {
        setFile(null);
        setResult(null);
        setIsLoadedFromHistory(false);
      });
    } else {
      setFile(null);
      setResult(null);
      setIsLoadedFromHistory(false);
      setShowFileDeleteModal(false);
    }
  };

  const handleModeChange = (e) => {
    const newMode = e.target.value;
    if (hasUnsavedGeneratedContent()) {
      setWarningMessage('Changing the mode will clear your current output. Continue?');
      setShowWarning(true);
      setPendingAction(() => () => {
        setMode(newMode);
        setResult(null);
        setIsLoadedFromHistory(false);
      });
    } else {
      setMode(newMode);
    }
  };

  const proceedWithAction = () => {
    if (pendingAction) {
      pendingAction();
    }
    setShowWarning(false);
    setPendingAction(null);
  };

  const cancelAction = () => {
    setShowWarning(false);
    setPendingAction(null);
  };

  const loadReviewerFromHistory = (reviewer) => {
    setResult(reviewer);
    setIsLoadedFromHistory(true);
    setShowHistoryModal(false);
  };

  // open confirmation for history delete
  const deleteReviewer = async (reviewerId, e) => {
    e.stopPropagation();
    setSelectedReviewerId(reviewerId);
    setShowHistoryDeleteModal(true);
  };

  const confirmHistoryDelete = async () => {
    if (!uid || !selectedReviewerId) return;

    try {
      await deleteDoc(reviewerDoc(uid, selectedReviewerId));
    } catch (err) {
      console.error('Error deleting reviewer:', err);
    } finally {
      setShowHistoryDeleteModal(false);
      setSelectedReviewerId(null);
    }
  };

  const generate = async () => {
    setError('');

    if (!file) {
      setError('Please upload a file to generate a reviewer.');
      return;
    }

    if (hasUnsavedGeneratedContent()) {
      setWarningMessage('Generating a new reviewer will replace your current output. Continue?');
      setShowWarning(true);
      setPendingAction(() => generate);
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('mode', mode);

      const resp = await axios.post('/ai/reviewer', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (!resp.data?.success) throw new Error(resp.data?.error || 'Reviewer generation failed');

      const reviewerData = resp.data.data.reviewer;
      setResult(reviewerData);
      setIsLoadedFromHistory(false);

      if (uid) {
        await addDoc(reviewersCol(uid), {
          title: reviewerData.title || 'Untitled Reviewer',
          summary: reviewerData.summary || '',
          keyConcepts: reviewerData.keyConcepts || [],
          sections: reviewerData.sections || [],
          flashcards: reviewerData.flashcards || [],
          practice: reviewerData.practice || [],
          mode: mode,
          fileName: file.name,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      await trackEvent(user, 'reviewer_generated');

      saveRecentActivity(user, {
        title: reviewerData.title || 'Reviewer Generated',
        type: 'reviewer',
        meta: mode === 'reviewer' 
          ? 'Full reviewer'
          : mode === 'flashcards'
          ? 'Flashcards'
          : 'Practice questions'
      });
      
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || e.message || 'Reviewer generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    if (!result) return;
    const lines = [];
    lines.push(result.title || 'Reviewer');
    lines.push('');
    lines.push('SUMMARY');
    lines.push(result.summary || '');
    lines.push('');
    lines.push('KEY CONCEPTS');
    (result.keyConcepts || []).forEach((k) => lines.push(`- ${k}`));
    lines.push('');
    lines.push('SECTIONS');
    (result.sections || []).forEach((s) => {
      lines.push(`\n${s.title}`);
      (s.bullets || []).forEach((b) => lines.push(`- ${b}`));
    });
    lines.push('');
    lines.push('FLASHCARDS');
    (result.flashcards || []).forEach((c) => lines.push(`Q: ${c.q}\nA: ${c.a}\n`));
    lines.push('');
    lines.push('PRACTICE QUESTIONS');
    (result.practice || []).forEach((q, i) => {
      lines.push(`${i + 1}. ${q.question}`);
      if (q.choices) lines.push(`   Choices: ${q.choices.join(', ')}`);
      lines.push(`   Answer: ${q.answer}`);
      lines.push(`   Explanation: ${q.explanation}\n`);
    });
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const filteredReviewers = useMemo(() => {
    return reviewers.filter(r => {
      const matchesSearch =
        searchTerm === '' ||
        (r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         r.fileName?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesMode = filterMode === 'all' || r.mode === filterMode;
      return matchesSearch && matchesMode;
    });
  }, [reviewers, searchTerm, filterMode]);

  const navItems = [
    { icon: <Home className="h-5 w-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Library className="h-5 w-5" />, label: 'Study Materials', path: '/study-materials', active: true },
    { icon: <Bot className="h-5 w-5" />, label: 'AI Assistant', path: '/ai-assistant' },
    { icon: <FileText className="h-5 w-5" />, label: 'Quiz Generator', path: '/quiz' },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Progress', path: '/progress' },
    { icon: <Settings className="h-5 w-5" />, label: 'Settings', path: '/settings' }
  ];

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
                <p className="text-xs text-gray-400 truncate">Study Materials</p>
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

        <LogoutConfirmModal
          isOpen={showLogoutModal}
          onConfirm={handleConfirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      </aside>

      <main className={`flex-1 ${sidebarOpen ? 'md:ml-72' : 'md:ml-20'} transition-all duration-300 h-screen overflow-hidden flex flex-col`}>
        <header className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40 flex-shrink-0">
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-white">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-3">
              <Library className="h-6 w-6 text-emerald-400" />
              <h1 className="text-xl font-semibold">AI Reviewer</h1>
            </div>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/70 border border-gray-700/60 hover:bg-gray-800 transition"
            >
              <History className="h-4 w-4" />
              <span className="text-sm">History ({reviewers.length})</span>
            </button>
          </div>
        </header>

        {showWarning && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-amber-400 mb-4">
                <AlertTriangle className="h-8 w-8" />
                <h3 className="text-xl font-semibold">Unsaved Changes</h3>
              </div>
              <p className="text-gray-300 mb-6">{warningMessage}</p>
              <div className="flex gap-3">
                <button
                  onClick={proceedWithAction}
                  className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-200 transition"
                >
                  Continue
                </button>
                <button
                  onClick={cancelAction}
                  className="flex-1 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded-xl text-emerald-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showHistoryModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[80vh] flex flex-col shadow-2xl">
              <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <History className="h-5 w-5 text-emerald-400" />
                  Your Reviewer History
                </h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-xl transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 border-b border-gray-700/50">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by title or filename..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-900/60 border border-gray-700/60 focus:outline-none focus:border-emerald-500/60"
                    />
                  </div>
                  <select
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-gray-900/60 border border-gray-700/60 focus:outline-none focus:border-emerald-500/60"
                  >
                    <option value="all">All Types</option>
                    <option value="reviewer">Comprehensive</option>
                    <option value="flashcards">Flashcards</option>
                    <option value="practice">Practice</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {loadingHistory ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader className="h-6 w-6 animate-spin text-emerald-400" />
                  </div>
                ) : filteredReviewers.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No reviewers yet</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Generate your first reviewer to see it here
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredReviewers.map((reviewer) => (
                      <div
                        key={reviewer.id}
                        className="bg-gray-900/40 border border-gray-700/50 rounded-xl p-4 hover:border-emerald-500/30 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{reviewer.title}</h3>
                            <p className="text-sm text-gray-400 mt-1">
                              {reviewer.fileName}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="px-2 py-0.5 rounded-full bg-gray-700/50 text-xs text-gray-300">
                                {reviewer.mode || 'reviewer'}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(reviewer.createdAt)}
                              </span>
                              <span className="text-xs text-gray-400">
                                {reviewer.keyConcepts?.length || 0} concepts
                              </span>
                              <span className="text-xs text-gray-400">
                                {reviewer.flashcards?.length || 0} cards
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => loadReviewerFromHistory(reviewer)}
                              className="p-2 hover:bg-emerald-500/20 rounded-lg transition"
                              title="Load reviewer"
                            >
                              <Eye className="h-4 w-4 text-emerald-400" />
                            </button>
                            <button
                              onClick={(e) => deleteReviewer(reviewer.id, e)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition"
                              title="Delete reviewer"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl">
              <div className="p-8 border-b border-gray-700/50 flex-shrink-0">
                <h2 className="text-2xl font-bold">Input</h2>
                <p className="text-sm text-gray-400 mt-2">Upload your file. The AI will create a comprehensive study package.</p>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-8">
                  <div>
                    <label className="text-base font-medium text-gray-300 mb-3 block">Reviewer Mode</label>
                    <select
                      value={mode}
                      onChange={handleModeChange}
                      className="w-full px-5 py-4 text-base rounded-xl bg-gray-800/60 border border-gray-700/60 focus:outline-none focus:border-emerald-500/60"
                    >
                      <option value="reviewer">Comprehensive Reviewer + Flashcards + Practice</option>
                      <option value="flashcards">Flashcards Only</option>
                      <option value="practice">Practice Questions Only</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-3">
                      {mode === 'reviewer' && 'Full study package with summary, key concepts, sections, flashcards, and practice questions'}
                      {mode === 'flashcards' && 'Focus on creating study flashcards for quick review'}
                      {mode === 'practice' && 'Generate practice questions to test your knowledge'}
                    </p>
                  </div>

                  <div>
                    <label className="text-base font-medium text-gray-300 mb-3 block">Upload File</label>
                    <div className="border-2 border-dashed border-gray-700/60 rounded-xl p-8 hover:border-emerald-500/50 transition-colors relative">
                      {!file ? (
                        <div className="text-center">
                          <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400 mb-2 text-lg">Click to upload or drag and drop</p>
                          <p className="text-sm text-gray-500">PDF, DOCX, or TXT (Max 10MB)</p>
                          <input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/20 rounded-xl">
                              <FileText className="h-8 w-8 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-base font-medium">{file.name}</p>
                              <p className="text-sm text-gray-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleFileRemove}
                            className="p-2 hover:bg-gray-700 rounded-lg transition"
                          >
                            <Trash2 className="h-5 w-5 text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                    {fileError && (
                      <p className="text-sm text-red-400 mt-3">{fileError}</p>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-red-300 font-medium">Content Not Suitable</p>
                          <p className="text-sm text-red-200/80 mt-1">{error}</p>
                          <p className="text-xs text-red-200/60 mt-2">
                            Please upload materials that are:
                            • From Philippine DepEd K-12 curriculum (Grades 7-12)
                            • Appropriate for Junior or Senior High School
                            • In English or Filipino
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={generate}
                    disabled={loading || !file}
                    className="w-full rounded-xl px-6 py-4 text-lg bg-gradient-to-r from-emerald-500 to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        <span className="font-semibold">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        <span className="font-semibold">Generate Reviewer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl">
              <div className="p-8 border-b border-gray-700/50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Output</h2>
                  <button
                    onClick={copyAll}
                    disabled={!result}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/70 border border-gray-700/60 hover:bg-gray-800 disabled:opacity-50 text-base"
                  >
                    {copied ? (
                      <>
                        <Check className="h-5 w-5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        <span>Copy all</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {!result ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Generate a reviewer to see the output here.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-2xl font-bold mb-3">{result.title}</h3>
                      <p className="text-gray-300 text-base leading-relaxed">{result.summary}</p>
                    </div>

                    <div>
                      <h4 className="text-xl font-semibold text-emerald-200 mb-3">Key Concepts</h4>
                      <ul className="list-disc pl-6 text-gray-300 space-y-2">
                        {(result.keyConcepts || []).map((k, i) => <li key={i} className="text-base">{k}</li>)}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xl font-semibold text-emerald-200 mb-3">Sections</h4>
                      <div className="space-y-4">
                        {(result.sections || []).map((s, i) => (
                          <div key={i} className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-5">
                            <p className="text-lg font-semibold mb-3">{s.title}</p>
                            <ul className="list-disc pl-6 text-gray-300 space-y-2">
                              {(s.bullets || []).map((b, j) => <li key={j} className="text-base">{b}</li>)}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xl font-semibold text-emerald-200 mb-3">Flashcards</h4>
                      <div className="grid gap-4">
                        {(result.flashcards || []).map((c, i) => (
                          <div key={i} className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-5">
                            <p className="text-gray-400 mb-2">Q:</p>
                            <p className="text-base font-medium mb-4">{c.q}</p>
                            <p className="text-gray-400 mb-2">A:</p>
                            <p className="text-base text-gray-200">{c.a}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xl font-semibold text-emerald-200 mb-3">Practice Questions</h4>
                      <div className="space-y-4">
                        {(result.practice || []).map((q, i) => (
                          <div key={i} className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-5">
                            <p className="text-lg font-medium mb-3">{i + 1}. {q.question}</p>
                            {q.type === 'multiple-choice' && Array.isArray(q.choices) && (
                              <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
                                {q.choices.map((c, j) => <li key={j} className="text-base">{c}</li>)}
                              </ul>
                            )}
                            <p className="text-base mt-3"><span className="text-emerald-300 font-semibold">Answer:</span> {q.answer}</p>
                            <p className="text-base text-gray-300 mt-2"><span className="text-cyan-300 font-semibold">Why:</span> {q.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DeleteConfirmModal
          isOpen={showFileDeleteModal}
          title="Delete Uploaded File"
          message="This will remove the selected file. If you have unsaved generated output, it may also be cleared. Do you want to continue?"
          onConfirm={confirmFileDelete}
          onCancel={() => setShowFileDeleteModal(false)}
        />

        <DeleteConfirmModal
          isOpen={showHistoryDeleteModal}
          title="Delete Reviewer History"
          message="This will permanently remove the selected reviewer from your history. This action cannot be undone."
          onConfirm={confirmHistoryDelete}
          onCancel={() => {
            setShowHistoryDeleteModal(false);
            setSelectedReviewerId(null);
          }}
        />
      </main>
    </div>
  );
}