import LogoutConfirmModal from '../components/LogoutConfirmModal';

// QuizTaker.jsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Brain,
  Home,
  Library,
  Bot,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Flag,
  Timer
} from 'lucide-react';
import { trackEvent, saveRecentActivity } from '../lib/progress';
import { db } from '../lib/firebase';
import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

function initialsFromName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function normalize(s) {
  return String(s || '').trim().toLowerCase();
}
function stripChoiceLetter(text) {
  return String(text || '')
    .trim()
    .replace(/^[A-D]\s*[\.\):-]\s*/i, '');
}

function formatChoiceWithLetter(question, answerValue) {
  if (!question || question.type !== 'multiple-choice') {
    return answerValue || 'Not answered';
  }

  const raw = String(answerValue || '').trim();
  if (!raw) return 'Not answered';

  const choices = Array.isArray(question.choices) ? question.choices : [];

  const normalizedRaw = normalize(stripChoiceLetter(raw));

  const index = choices.findIndex((choice) =>
    normalize(stripChoiceLetter(choice)) === normalizedRaw
  );

  if (index === -1) return raw;

  const letter = String.fromCharCode(65 + index);
  return `${letter}. ${choices[index]}`;
}

export default function QuizTaker() {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [uid, setUid] = useState('');
  const [savingError, setSavingError] = useState('');
  const timerRef = useRef(null);

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

  // Get current user UID
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUid(user.uid);
      console.log('🔐 Current user UID:', user.uid);
    } else {
      console.log('❌ No user logged in');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  // Load quiz from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem(`quiz_${quizId}`) || sessionStorage.getItem('quiz_latest');
    if (raw) {
      try {
        const quizData = JSON.parse(raw);
        setQuiz(quizData);
        console.log('📝 Quiz loaded from sessionStorage:', { 
          title: quizData.title, 
          questions: quizData.items?.length,
          firestoreId: quizData.firestoreId,
          id: quizId 
        });
        
        // ⚠️ CRITICAL CHECK - Add warning if firestoreId is missing
        if (!quizData.firestoreId) {
          console.warn('⚠️ No firestoreId found in quiz data! Results will not be saved correctly.');
        } else {
          console.log('✅ Found firestoreId:', quizData.firestoreId);
        }
        
        if (quizData.settings?.timeLimit) {
          setTimeRemaining(quizData.settings.timeLimit * 60);
        }
      } catch {
        setQuiz(null);
        console.error('❌ Failed to parse quiz data');
      }
    } else {
      console.log('❌ No quiz found in sessionStorage for ID:', quizId);
    }
  }, [quizId]);

  // Auto-start countdown
  useEffect(() => {
    if (location.state?.autoStart && quiz && !quizStarted && !submitted) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setQuizStarted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [location.state?.autoStart, quiz, quizStarted, submitted]);

  // Timer functionality
  useEffect(() => {
    if (quizStarted && timeRemaining > 0 && !submitted) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizStarted, timeRemaining, submitted]);

  const handleAutoSubmit = () => {
    clearInterval(timerRef.current);
    setSubmitted(true);
    setShowResults(true);
    trackEvent(user, 'quiz_taken', { 
      autoSubmitted: true,
      answers: Object.keys(answers).length 
    });
    
    saveRecentActivity(user, {
      title: quiz.title || 'Quiz Completed',
      type: 'quiz',
      meta: `Score: ${score.percent}%`
    });
  };

  const handleConfirmLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login');
  };
  const score = useMemo(() => {
    if (!quiz?.items?.length) {
      return { correct: 0, total: 0, percent: 0, details: [] };
    }
  
    let correct = 0;
    const details = [];
  
    quiz.items.forEach((q, idx) => {
      const a = answers[idx];
      let isCorrect = false;
  
      const userAns = normalize(a);
      const correctAns = normalize(q.answer);
  
      if (a != null) {
        if (q.type === 'multiple-choice') {
          isCorrect =
            userAns === correctAns ||
            userAns.includes(correctAns) ||
            correctAns.includes(userAns);
        } else if (q.type === 'true-false') {
          isCorrect = userAns === correctAns;
        } else {
          isCorrect =
            userAns === correctAns ||
            userAns.includes(correctAns) ||
            correctAns.includes(userAns);
        }
      }
  
      if (isCorrect) correct += 1;
  
      details.push({
        isCorrect,
        userAnswer: a,
        correctAnswer: q.answer
      });
    });
  
    const percent = quiz.items.length
      ? Math.round((correct / quiz.items.length) * 100)
      : 0;
  
    return {
      correct,
      total: quiz.items.length,
      percent,
      details
    };
  }, [quiz, answers]);

  const submit = async () => {
    if (!quiz?.items?.length) return;
    
    // ⚠️ CRITICAL CHECK - Log the quiz object to see if firestoreId exists
    console.log('📤 Submitting quiz with data:', {
      firestoreId: quiz.firestoreId,
      quizId: quizId,
      hasFirestoreId: !!quiz.firestoreId,
      uid: uid,
      title: quiz.title,
      questionCount: quiz.items?.length
    });
    
    setSubmitted(true);
    setShowResults(true);
    clearInterval(timerRef.current);
    setSavingError('');
    
    // Check if we have firestoreId
    if (!quiz.firestoreId) {
      console.error('❌ Cannot save: No firestoreId in quiz object!');
      setSavingError('Quiz cannot be saved: Missing Firestore ID. Please generate a new quiz.');
      return;
    }
    
    if (!uid) {
      console.error('❌ Cannot save: No user UID');
      setSavingError('Quiz cannot be saved: User not authenticated.');
      return;
    }
    
    try {
      // Get the firestoreId from the quiz object
      const firestoreId = quiz.firestoreId;
      console.log('💾 Saving to Firestore with ID:', firestoreId);
      
      const quizRef = doc(db, 'quiz_history', uid, 'quizzes', firestoreId);
      console.log('📄 Quiz document path:', quizRef.path);
      
      const quizDataToSave = {
        completed: true,
        score: score.percent,
        correctAnswers: score.correct,
        totalQuestions: score.total,
        completedAt: new Date().toISOString(),
        timeSpent: quiz.settings?.timeLimit ? (quiz.settings.timeLimit * 60) - (timeRemaining || 0) : null,
        quizData: {
          title: quiz.title || 'Untitled Quiz',
          items: quiz.items.map((item, index) => ({
            ...item,
            userAnswer: answers[index] || null,
            isCorrect: score.details[index]?.isCorrect || false
          }))
        }
      };

      console.log('📦 Saving quiz data:', {
        score: quizDataToSave.score,
        questionCount: quizDataToSave.quizData.items.length,
        completed: true
      });

      // Use setDoc with merge: true to update existing document
      await setDoc(quizRef, quizDataToSave, { merge: true });
      
      console.log('✅ Quiz results saved successfully!');
      
    } catch (error) {
      console.error('❌ Error saving quiz results:', error);
      setSavingError('Failed to save quiz results: ' + error.message);
    }
    
    await trackEvent(user, 'quiz_taken', { 
      correct: score.correct, 
      total: score.total,
      score: score.percent
    });

    saveRecentActivity(user, {
      title: quiz.title || 'Quiz Completed',
      type: 'quiz',
      meta: `Score: ${score.percent}%`
    });
  };

  const toggleFlag = (index) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const goToQuestion = (index) => {
    setCurrentQuestion(index);
    setShowSummary(false);
  };

  const answeredCount = Object.keys(answers).length;
  const progress = quiz?.items?.length ? (answeredCount / quiz.items.length) * 100 : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-6">
        <div className="bg-gray-800/90 border border-gray-700/50 rounded-2xl p-8 max-w-md text-center">
          <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Quiz Loaded</h2>
          <p className="text-gray-400 mb-6">Go back to Quiz Generator to create a new quiz</p>
          <Link to="/quiz" className="inline-block px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
            Back to Generator
          </Link>
        </div>
      </div>
    );
  }

  if (!quizStarted && location.state?.autoStart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent animate-pulse mb-4">
            {countdown}
          </div>
          <p className="text-xl text-gray-400">Get ready! Quiz starts in {countdown}...</p>
          <p className="text-sm text-gray-500 mt-4">Total Questions: {quiz.items?.length}</p>
          {timeRemaining && (
            <p className="text-sm text-gray-500">Time Limit: {formatTime(timeRemaining)}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Full Screen Quiz Mode */}
      <div className="fixed inset-0 flex flex-col">
        {/* Header */}
        <header className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/quiz" className="p-2 hover:bg-gray-800 rounded-xl transition">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold">{quiz.title || 'Quiz'}</h1>
                <p className="text-sm text-gray-400">Question {currentQuestion + 1} of {quiz.items?.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Progress Bar */}
              <div className="hidden md:block w-64">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{answeredCount}/{quiz.items?.length}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Timer */}
              {timeRemaining !== null && !submitted && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                  timeRemaining < 60 ? 'bg-red-500/20 border border-red-500/50 animate-pulse' : 'bg-gray-800'
                }`}>
                  <Timer className={`h-5 w-5 ${timeRemaining < 60 ? 'text-red-400' : 'text-emerald-400'}`} />
                  <span className={`font-mono font-bold ${timeRemaining < 60 ? 'text-red-400' : 'text-white'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}

              {/* Settings Toggle */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-800 rounded-xl transition"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-gray-800/95 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setShowSummary(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 transition"
                >
                  <FileText className="h-4 w-4" />
                  <span>Question Summary</span>
                </button>
                <div className="text-sm text-gray-400">
                  <span className="text-emerald-400 font-bold">{flaggedQuestions.size}</span> Flagged
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Question Summary Modal */}
        {showSummary && (
          <div className="absolute top-24 right-6 w-96 bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl z-50">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold">Question Summary</h3>
              <button onClick={() => setShowSummary(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-5 gap-2">
                {quiz.items?.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToQuestion(idx)}
                    className={`aspect-square rounded-lg font-medium transition ${
                      currentQuestion === idx
                        ? 'bg-emerald-500 text-black'
                        : answers[idx] != null
                        ? 'bg-emerald-500/20 border border-emerald-500/50'
                        : flaggedQuestions.has(idx)
                        ? 'bg-yellow-500/20 border border-yellow-500/50'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            {!submitted ? (
              <div className="space-y-6">
                {/* Question */}
                <div className="bg-gray-800/50 border border-gray-700/60 rounded-2xl p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <span className="px-3 py-1 rounded-full bg-gray-700 text-sm">
                        {quiz.items[currentQuestion]?.type}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleFlag(currentQuestion)}
                      className={`p-2 rounded-xl transition ${
                        flaggedQuestions.has(currentQuestion)
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'hover:bg-gray-700'
                      }`}
                    >
                      <Flag className="h-5 w-5" />
                    </button>
                  </div>

                  <h2 className="text-2xl font-bold mb-8">
                    {quiz.items[currentQuestion]?.question}
                  </h2>

                  {/* Answer Input */}
                  {quiz.items[currentQuestion]?.type === 'multiple-choice' ? (
                    <div className="space-y-3">
                      {(quiz.items[currentQuestion]?.choices || []).map((choice, cidx) => (
                        <label
                          key={cidx}
                          className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition ${
                            String(answers[currentQuestion]) === String(choice)
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-gray-700/60 bg-gray-900/40 hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question_${currentQuestion}`}
                            value={choice}
                            checked={String(answers[currentQuestion] || '') === String(choice)}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion]: e.target.value }))}
                            className="sr-only"
                          />
                          <span className="text-lg">{choice}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <textarea
                        className="w-full p-4 rounded-xl bg-gray-900/40 border border-gray-700/60 focus:outline-none focus:border-emerald-500/60 min-h-[120px] text-lg"
                        placeholder="Type your answer here..."
                        value={answers[currentQuestion] || ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion]: e.target.value }))}
                      />
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestion === 0}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800/70 border border-gray-700/60 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">
                      {currentQuestion + 1} / {quiz.items?.length}
                    </span>
                  </div>

                  {currentQuestion === quiz.items?.length - 1 ? (
                    <button
                      onClick={submit}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition"
                    >
                      Submit Quiz
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentQuestion(prev => Math.min(quiz.items?.length - 1, prev + 1))}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition"
                    >
                      Next
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Results Page */
              <div className="space-y-6">
                {savingError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-300 text-sm">
                    {savingError}
                  </div>
                )}
                
                <div className="bg-gray-800/50 border border-gray-700/60 rounded-2xl p-8 text-center">
                  <div className="inline-block p-4 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 mb-4">
                    {score.percent >= 70 ? (
                      <CheckCircle2 className="h-16 w-16 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-16 w-16 text-yellow-400" />
                    )}
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
                  <p className="text-gray-400 mb-6">Here's how you performed</p>
                  
                  <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                    <div className="p-4 bg-gray-900/40 rounded-xl">
                      <div className="text-3xl font-bold text-emerald-400">{score.correct}</div>
                      <div className="text-sm text-gray-400">Correct</div>
                    </div>
                    <div className="p-4 bg-gray-900/40 rounded-xl">
                      <div className="text-3xl font-bold text-red-400">{score.total - score.correct}</div>
                      <div className="text-sm text-gray-400">Incorrect</div>
                    </div>
                    <div className="p-4 bg-gray-900/40 rounded-xl">
                      <div className="text-3xl font-bold text-cyan-400">{score.percent}%</div>
                      <div className="text-sm text-gray-400">Score</div>
                    </div>
                  </div>

                  <Link
                    to="/quiz"
                    className="inline-block px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition"
                  >
                    Generate New Quiz
                  </Link>
                </div>

                {/* Detailed Review */}
                {quiz.items?.map((q, idx) => {
                  const detail = score.details[idx];
                  return (
                    <div key={idx} className="bg-gray-800/50 border border-gray-700/60 rounded-2xl p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${
                          detail.isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20'
                        }`}>
                          {detail.isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-400 mb-1">Question {idx + 1}</p>
                          <p className="text-lg font-semibold mb-3">{q.question}</p>
                          <div className="space-y-2 text-sm">
                            <p>
                              <span className="text-gray-400">Your answer:</span>{' '}
                              {q.type === 'multiple-choice'
                                ? formatChoiceWithLetter(q, detail.userAnswer)
                                : (detail.userAnswer || 'Not answered')}
                            </p>

                            <p>
                              <span className="text-gray-400">Correct answer:</span>{' '}
                              {q.type === 'multiple-choice'
                                ? formatChoiceWithLetter(q, detail.correctAnswer)
                                : detail.correctAnswer}
                            </p>

                            <p className="text-gray-300 mt-2">{q.explanation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}