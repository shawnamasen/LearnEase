import LogoutConfirmModal from '../components/LogoutConfirmModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

// QuizGenerator.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain,
  Home,
  Settings,
  LogOut,
  Library,
  Bot,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sparkles,
  Loader,
  Clock,
  Upload,
  File,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Eye,
  Search,
  X
} from 'lucide-react';
import axios from '../axiosConfig';
import { trackEvent, saveRecentActivity } from '../lib/progress';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import QuizHistoryViewer from './QuizHistoryViewer';

function initialsFromName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

const QUESTION_TYPES = [
  { id: 'multiple-choice', label: 'Multiple Choice', icon: '📝' },
  { id: 'true-false', label: 'True/False', icon: '✓✗' },
  { id: 'short', label: 'Short Answer', icon: '📋' },
  { id: 'fill-blanks', label: 'Fill in Blanks', icon: '___' },
];

// Firestore collections
function quizzesCol(uid) {
  return collection(db, 'quiz_history', uid, 'quizzes');
}

function quizDoc(uid, quizId) {
  return doc(db, 'quiz_history', uid, 'quizzes', quizId);
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

export default function QuizGenerator() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [step, setStep] = useState(1);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteQuizId, setDeleteQuizId] = useState(null);

  const holdTimeoutRef = React.useRef(null);
  const holdIntervalRef = React.useRef(null);

  const holdTimerTimeoutRef = React.useRef(null);
  const holdTimerIntervalRef = React.useRef(null);

  // Auth state
  const [fbUser, setFbUser] = useState(null);
  const uid = fbUser?.uid || '';

  // File upload state
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [fileValidating, setFileValidating] = useState(false);
  const [fileValid, setFileValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [detectedGrade, setDetectedGrade] = useState('');
  const [detectedSubject, setDetectedSubject] = useState('');

  // Quiz settings
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [selectedTypes, setSelectedTypes] = useState(['multiple-choice', 'true-false']);
  const [timeLimit, setTimeLimit] = useState(10);
  const [enableTimer, setEnableTimer] = useState(true);

  // Generation state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [viewingQuiz, setViewingQuiz] = useState(null);

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

  // Auth watcher
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setFbUser(u || null);
      if (!u) navigate('/login');
    });
    return () => unsub();
  }, [navigate]);

  // Load quiz history
  useEffect(() => {
    if (!uid) return;

    setLoadingHistory(true);
    const q = query(quizzesCol(uid), orderBy('createdAt', 'desc'), limit(30));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setQuizHistory(list);
      console.log('📋 Quiz history loaded:', list.map(q => ({
        id: q.id,
        title: q.title,
        completed: q.completed,
        score: q.score
      })));
      setLoadingHistory(false);
    }, (err) => {
      console.error('Error loading quiz history:', err);
      setLoadingHistory(false);
    });

    return () => unsub();
  }, [uid]);

  const handleConfirmLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  //start count
  const changeCount = (delta) => {
    setCount((prev) => Math.min(50, Math.max(5, prev + delta)));
  };
  
  const startHoldCount = (delta) => {
    changeCount(delta);
  
    holdTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        setCount((prev) => Math.min(50, Math.max(5, prev + delta)));
      }, 80);
    }, 300);
  };
  
  const stopHoldCount = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  const changeTimer = (delta) => {
    setTimeLimit((prev) => Math.min(60, Math.max(10, prev + delta)));
  };
  
  const startHoldTimer = (delta) => {
    changeTimer(delta);
  
    holdTimerTimeoutRef.current = setTimeout(() => {
      holdTimerIntervalRef.current = setInterval(() => {
        setTimeLimit((prev) => Math.min(60, Math.max(10, prev + delta)));
      }, 80);
    }, 300);
  };
  
  const stopHoldTimer = () => {
    if (holdTimerTimeoutRef.current) {
      clearTimeout(holdTimerTimeoutRef.current);
      holdTimerTimeoutRef.current = null;
    }
  
    if (holdTimerIntervalRef.current) {
      clearInterval(holdTimerIntervalRef.current);
      holdTimerIntervalRef.current = null;
    }
  };
  //end count
  
  useEffect(() => {
    return () => {
      stopHoldCount();
      stopHoldTimer();
    };
  }, []);

  const toggleQuestionType = (typeId) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  // Validate uploaded file against K-12 dataset
  const validateFile = async (file) => {
    setFileValidating(true);
    setFileError('');
    setValidationMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/ai/validate-content', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setFileValid(true);
        setExtractedText(response.data.data.extractedText || '');
        setDetectedGrade(response.data.data.detectedGrade || '');
        setDetectedSubject(response.data.data.detectedSubject || '');
        setValidationMessage(response.data.data.message || 'File validated successfully!');

        setTimeout(() => {
          setStep(2);
        }, 1500);
      }
    } catch (err) {
      setFileValid(false);
      if (err.response?.data?.error) {
        setFileError(err.response.data.error);
      } else {
        setFileError('Failed to validate file. Please try again.');
      }
    } finally {
      setFileValidating(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    setFileError('');
    setFileValid(false);
    setValidationMessage('');

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

    setFile(selectedFile);
    validateFile(selectedFile);
  };

  const handleFileRemove = () => {
    setFile(null);
    setFileValid(false);
    setValidationMessage('');
    setDetectedGrade('');
    setDetectedSubject('');
  };

  const generate = async () => {
    if (selectedTypes.length === 0) {
      setError('Please select at least one question type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('count', count);
      formData.append('difficulty', difficulty);
      formData.append('types', JSON.stringify(selectedTypes));
      if (enableTimer) {
        formData.append('timeLimit', timeLimit);
      }
      if (extractedText) {
        formData.append('extractedText', extractedText);
      }

      const resp = await axios.post('/ai/quiz-from-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (!resp.data?.success) throw new Error(resp.data?.error || 'Quiz generation failed');

      const quizData = {
        ...resp.data.data.quiz,
        settings: {
          timeLimit: enableTimer ? timeLimit : null,
          totalQuestions: count,
          difficulty,
          types: selectedTypes
        },
        fileName: file.name,
        grade: detectedGrade,
        subject: detectedSubject
      };

      let firestoreId = null;

      // Save to Firestore and get the document ID
      if (uid) {
        const docRef = await addDoc(quizzesCol(uid), {
          title: quizData.title || 'Untitled Quiz',
          fileName: file.name,
          grade: detectedGrade,
          subject: detectedSubject,
          difficulty,
          questionCount: count,
          score: null,
          completed: false,
          createdAt: serverTimestamp()
        });

        firestoreId = docRef.id;
        console.log('✅ Quiz created in Firestore with ID:', firestoreId);
      }

      // Store the quiz data with the Firestore ID
      const key = String(Date.now());
      const quizToStore = {
        ...quizData,
        firestoreId: firestoreId
      };

      sessionStorage.setItem(`quiz_${key}`, JSON.stringify(quizToStore));
      sessionStorage.setItem('quiz_latest', JSON.stringify(quizToStore));

      console.log('📝 Quiz saved to sessionStorage with firestoreId:', firestoreId);

      await trackEvent(user, 'quiz_generated');
      saveRecentActivity(user, {
        title: quizData.title || 'Quiz Generated',
        type: 'quiz',
        meta: `${count} questions • ${difficulty}`
      });
      
      navigate(`/quiz/take/${key}`, { state: { autoStart: true } });

    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || e.message || 'Quiz generation failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = (quizId, e) => {
    e.stopPropagation();
    setDeleteQuizId(quizId);
    setShowDeleteModal(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!uid || !deleteQuizId) return;

    try {
      await deleteDoc(quizDoc(uid, deleteQuizId));
    } catch (err) {
      console.error('Error deleting quiz:', err);
    } finally {
      setShowDeleteModal(false);
      setDeleteQuizId(null);
    }
  };

  const viewQuiz = (quiz) => {
    console.log('👆 View button clicked for quiz:', quiz);
    console.log('Quiz completed status:', quiz.completed);
    console.log('Quiz ID:', quiz.id);
    setViewingQuiz(quiz);
  };

  const filteredHistory = useMemo(() => {
    const search = historySearch.toLowerCase().trim();
    if (!search) return quizHistory;

    return quizHistory.filter(q =>
      q.title?.toLowerCase().includes(search) ||
      q.fileName?.toLowerCase().includes(search) ||
      q.subject?.toLowerCase().includes(search)
    );
  }, [quizHistory, historySearch]);

  const navItems = [
    { icon: <Home className="h-5 w-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Library className="h-5 w-5" />, label: 'Study Materials', path: '/study-materials' },
    { icon: <Bot className="h-5 w-5" />, label: 'AI Assistant', path: '/ai-assistant' },
    { icon: <FileText className="h-5 w-5" />, label: 'Quiz Generator', path: '/quiz', active: true },
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
                <p className="text-xs text-gray-400 truncate">Quiz Generator</p>
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

      <main className={`flex-1 ${sidebarOpen ? 'md:ml-72' : 'md:ml-20'} transition-all duration-300 min-h-screen flex flex-col`}>
        <header className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-white">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-3">
              <Sparkles className="h-6 w-6 text-emerald-400" />
              <h1 className="text-xl font-semibold">Quiz Generator</h1>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/70 border border-gray-700/60 hover:bg-gray-800 transition"
            >
              <History className="h-4 w-4" />
              <span className="text-sm">History ({quizHistory.length})</span>
            </button>
          </div>
        </header>

        {/* History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[80vh] flex flex-col shadow-2xl">
              <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <History className="h-5 w-5 text-emerald-400" />
                  Your Quiz History
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-700 rounded-xl transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 border-b border-gray-700/50">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search quizzes..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-900/60 border border-gray-700/60 focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {loadingHistory ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader className="h-6 w-6 animate-spin text-emerald-400" />
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No quizzes yet</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Generate your first quiz to see it here
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredHistory.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="bg-gray-900/40 border border-gray-700/50 rounded-xl p-4 hover:border-emerald-500/30 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{quiz.title}</h3>
                            <p className="text-sm text-gray-400 mt-1">
                              {quiz.fileName}
                            </p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-full bg-gray-700/50 text-xs text-gray-300">
                                {quiz.grade || 'Grade 7-12'}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-gray-700/50 text-xs text-gray-300">
                                {quiz.difficulty}
                              </span>
                              <span className="text-xs text-gray-400">
                                {quiz.questionCount} questions
                              </span>
                              {quiz.score !== null && quiz.score !== undefined && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  quiz.score >= 70
                                    ? 'bg-green-500/20 text-green-400'
                                    : quiz.score >= 50
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  Score: {quiz.score}%
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {formatDate(quiz.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => viewQuiz(quiz)}
                              className="p-2 hover:bg-emerald-500/20 rounded-lg transition"
                              title="View quiz results"
                            >
                              <Eye className="h-4 w-4 text-emerald-400" />
                            </button>
                            <button
                              onClick={(e) => deleteQuiz(quiz.id, e)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition"
                              title="Delete quiz"
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

        {/* Quiz History Viewer Modal */}
        {viewingQuiz && (
          <QuizHistoryViewer
            quiz={viewingQuiz}
            onClose={() => {
              console.log('Closing viewer');
              setViewingQuiz(null);
            }}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-3xl">
            {/* Step Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className={`flex items-center ${step >= 1 ? 'text-emerald-400' : 'text-gray-500'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
                    step >= 1 ? 'border-emerald-400 bg-emerald-400/20' : 'border-gray-600'
                  }`}>
                    1
                  </div>
                  <span className="ml-3 font-medium">Upload File</span>
                </div>
                <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                <div className={`flex items-center ${step >= 2 ? 'text-emerald-400' : 'text-gray-500'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
                    step >= 2 ? 'border-emerald-400 bg-emerald-400/20' : 'border-gray-600'
                  }`}>
                    2
                  </div>
                  <span className="ml-3 font-medium">Quiz Settings</span>
                </div>
              </div>
            </div>

            {/* Step 1: File Upload */}
            {step === 1 && (
              <div className="bg-gray-800/50 border border-gray-700/60 rounded-3xl p-8 md:p-10 shadow-2xl">
                <h2 className="text-2xl font-bold mb-2">Upload Your Study Material</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Upload a PDF, DOCX, or TXT file. We'll validate it's appropriate for K-12 learning.
                </p>

                {error && (
                  <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <div className={`border-2 border-dashed rounded-2xl p-8 transition-colors ${
                      fileValid
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : fileError
                        ? 'border-red-500/50 bg-red-500/5'
                        : 'border-gray-700/60 hover:border-emerald-500/50'
                    }`}>
                      {!file ? (
                        <div className="text-center">
                          <Upload className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-300 mb-2 text-lg">Click to upload or drag and drop</p>
                          <p className="text-sm text-gray-500">PDF, DOCX, or TXT (Max 10MB)</p>
                          <input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={fileValidating}
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl ${
                                fileValid
                                  ? 'bg-emerald-500/20'
                                  : fileError
                                  ? 'bg-red-500/20'
                                  : 'bg-gray-700'
                              }`}>
                                <File className={`h-8 w-8 ${
                                  fileValid
                                    ? 'text-emerald-400'
                                    : fileError
                                    ? 'text-red-400'
                                    : 'text-gray-400'
                                }`} />
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
                              disabled={fileValidating}
                            >
                              <X className="h-5 w-5 text-gray-400" />
                            </button>
                          </div>

                          {fileValidating && (
                            <div className="flex items-center gap-2 text-emerald-400">
                              <Loader className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Validating against K-12 curriculum...</span>
                            </div>
                          )}

                          {fileValid && (
                            <div className="mt-4 space-y-3">
                              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm text-emerald-300 font-medium">File Validated!</p>
                                  <p className="text-sm text-emerald-200/80 mt-1">{validationMessage}</p>
                                  {(detectedGrade || detectedSubject) && (
                                    <div className="flex gap-3 mt-2">
                                      {detectedGrade && (
                                        <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-xs">
                                          Grade {detectedGrade}
                                        </span>
                                      )}
                                      {detectedSubject && (
                                        <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-xs">
                                          {detectedSubject}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {fileError && (
                            <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                              <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm text-red-300 font-medium">Validation Failed</p>
                                <p className="text-sm text-red-200/80 mt-1">{fileError}</p>
                                <p className="text-xs text-red-200/60 mt-2">
                                  Please upload materials appropriate for Grades 7-12 following the Philippine DepEd K-12 curriculum.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!fileValid}
                    className="w-full rounded-2xl px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                  >
                    <span>Next: Quiz Settings</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Quiz Settings */}
            {step === 2 && (
              <div className="bg-gray-800/50 border border-gray-700/60 rounded-3xl p-8 md:p-10 shadow-2xl">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm">Back to file upload</span>
                </button>

                <h2 className="text-2xl font-bold mb-2">Customize Your Quiz</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Configure the quiz settings based on your uploaded material
                </p>

                {error && (
                  <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-6">
                  {file && (
                    <div className="p-4 rounded-2xl bg-gray-900/40 border border-gray-700/60">
                      <div className="flex items-center gap-3">
                        <File className="h-5 w-5 text-emerald-400" />
                        <span className="text-sm text-gray-300 truncate flex-1">{file.name}</span>
                        {detectedGrade && (
                          <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-xs">
                            Grade {detectedGrade}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Number of Questions
                    </label>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onMouseDown={() => startHoldCount(-1)}
                        onMouseUp={stopHoldCount}
                        onMouseLeave={stopHoldCount}
                        onTouchStart={() => startHoldCount(-1)}
                        onTouchEnd={stopHoldCount}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 transition select-none"
                      >
                        -
                      </button>

                      <div className="flex-1 text-center py-2 rounded-xl bg-gray-900/40 border border-gray-700 text-lg font-semibold select-none">
                        {count}
                      </div>

                      <button
                        type="button"
                        onMouseDown={() => startHoldCount(1)}
                        onMouseUp={stopHoldCount}
                        onMouseLeave={stopHoldCount}
                        onTouchStart={() => startHoldCount(1)}
                        onTouchEnd={stopHoldCount}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 transition select-none"
                      >
                        +
                      </button>
                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                      Minimum: 5 questions • Maximum: 50 questions
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full rounded-2xl bg-gray-900/40 border border-gray-700/60 px-5 py-3 text-sm outline-none focus:border-emerald-500/60"
                    >
                      <option value="easy">Easy</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Question Types <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      {QUESTION_TYPES.map(type => (
                        <button
                          type="button"
                          key={type.id}
                          onClick={() => toggleQuestionType(type.id)}
                          className={`p-3 rounded-2xl border transition-all ${
                            selectedTypes.includes(type.id)
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-gray-700/60 bg-gray-900/40 hover:border-gray-500'
                          }`}
                        >
                          <div className="text-xl mb-1">{type.icon}</div>
                          <div className="text-[11px] font-medium leading-tight">{type.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-900/40 rounded-2xl p-4 border border-gray-700/60">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-medium">Timer Settings</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableTimer}
                          onChange={(e) => setEnableTimer(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    {enableTimer && (
                    <div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onMouseDown={() => startHoldTimer(-1)}
                          onMouseUp={stopHoldTimer}
                          onMouseLeave={stopHoldTimer}
                          onTouchStart={() => startHoldTimer(-1)}
                          onTouchEnd={stopHoldTimer}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 transition select-none"
                        >
                          -
                        </button>

                        <div className="flex-1 text-center py-2 rounded-xl bg-gray-800/60 border border-gray-700 text-lg font-semibold select-none">
                          {timeLimit}
                        </div>

                        <button
                          type="button"
                          onMouseDown={() => startHoldTimer(1)}
                          onMouseUp={stopHoldTimer}
                          onMouseLeave={stopHoldTimer}
                          onTouchStart={() => startHoldTimer(1)}
                          onTouchEnd={stopHoldTimer}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 transition select-none"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-xs text-gray-400 mt-2">
                        Minimum: 10 minutes • Maximum: 60 minutes
                      </p>
                    </div>
                  )}
                  </div>

                  <button
                    onClick={generate}
                    disabled={loading || selectedTypes.length === 0}
                    className="w-full rounded-2xl px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Generating Quiz...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Generate Quiz</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onConfirm={confirmDeleteQuiz}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeleteQuizId(null);
          }}
          message="Are you sure you want to delete this quiz from your history?"
        />
      </main>
    </div>
  );
}