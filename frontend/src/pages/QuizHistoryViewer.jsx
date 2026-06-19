// QuizHistoryViewer.jsx
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function QuizHistoryViewer({ quiz, onClose }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuizDetails();
  }, [quiz]);

  const loadQuizDetails = async () => {
    setLoading(true);
    setError('');
    
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        console.log('❌ No user authenticated');
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      const uid = user.uid;
      console.log('🔍 Loading quiz details for:', { 
        uid, 
        quizId: quiz.id,
        quizTitle: quiz.title 
      });
      
      // Get the quiz document directly
      const quizRef = doc(db, 'quiz_history', uid, 'quizzes', quiz.id);
      console.log('📄 Quiz document path:', quizRef.path);
      
      const quizSnap = await getDoc(quizRef);
      
      if (quizSnap.exists()) {
        const data = quizSnap.data();
        console.log('✅ Quiz document found:', {
          title: data.title,
          score: data.score,
          completed: data.completed,
          hasQuizData: !!data.quizData,
          questionCount: data.quizData?.items?.length || 0
        });
        
        // Check if quizData exists in the document
        if (data.quizData) {
          console.log('📝 Quiz data found with', data.quizData.items?.length, 'questions');
          console.log('📊 First question sample:', data.quizData.items[0]);
          setQuizData(data.quizData);
        } else {
          console.log('⚠️ No quizData field in document');
          console.log('📄 Document data:', data);
          setError('Quiz results not found. The quiz was generated but never completed.');
        }
      } else {
        console.log('❌ Quiz document not found at path:', quizRef.path);
        setError('Quiz not found in database');
      }
    } catch (error) {
      console.error('❌ Error loading quiz details:', error);
      setError('Failed to load quiz details: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-4xl w-full p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
            <span className="ml-3 text-gray-300">Loading quiz details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-4xl w-full p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{quiz?.title || 'Quiz Details'}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-xl transition">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-red-400 text-center py-8">{error}</p>
          <div className="text-center">
            <button
              onClick={loadQuizDetails}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quizData || !quizData.items || quizData.items.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-4xl w-full p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{quiz?.title || 'Quiz Details'}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-xl transition">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-400 text-center py-8">No questions found for this quiz</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quizData.items[currentQuestionIndex];
  const totalQuestions = quizData.items.length;
  
  // Calculate score from quiz data
  const correctCount = quizData.items.filter(q => q.isCorrect).length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  console.log('📊 Displaying question:', {
    current: currentQuestionIndex + 1,
    total: totalQuestions,
    score: score,
    correctCount: correctCount,
    currentQuestion: currentQuestion
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{quizData.title || quiz?.title}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {quiz?.fileName} • {quiz?.grade && `Grade ${quiz.grade}`} {quiz?.subject && `• ${quiz.subject}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-xl transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Score Summary */}
        <div className="p-6 border-b border-gray-700/50 bg-gray-900/40">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-emerald-400">{score}%</div>
              <div className="text-xs text-gray-400 mt-1">Overall Score</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{correctCount}</div>
              <div className="text-xs text-gray-400 mt-1">Correct</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-400">{totalQuestions - correctCount}</div>
              <div className="text-xs text-gray-400 mt-1">Incorrect</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-cyan-400">{totalQuestions}</div>
              <div className="text-xs text-gray-400 mt-1">Total Questions</div>
            </div>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <div className="flex gap-1 ml-4">
              {quizData.items.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                    currentQuestionIndex === idx
                      ? 'bg-emerald-500 text-black'
                      : quizData.items[idx].isCorrect
                      ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                      : quizData.items[idx].userAnswer
                      ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="p-2 rounded-xl bg-gray-700/50 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
              disabled={currentQuestionIndex === totalQuestions - 1}
              className="p-2 rounded-xl bg-gray-700/50 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Question Display */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentQuestion && (
            <div className="space-y-6">
              {/* Question */}
              <div className="bg-gray-900/40 rounded-xl p-6 border border-gray-700/60">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 rounded-full bg-gray-700 text-xs">
                    {currentQuestion.type || 'Question'}
                  </span>
                  {currentQuestion.userAnswer && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      currentQuestion.isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {currentQuestion.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-medium">{currentQuestion.question}</h3>
              </div>

              {/* Your Answer */}
              {currentQuestion.userAnswer ? (
                <div className="bg-gray-900/40 rounded-xl p-5 border border-gray-700/60">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Your Answer</h4>
                  <div className={`p-3 rounded-lg ${
                    currentQuestion.isCorrect 
                      ? 'bg-green-500/10 border border-green-500/30' 
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}>
                    <p className="text-base">{currentQuestion.userAnswer}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900/40 rounded-xl p-5 border border-gray-700/60">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Your Answer</h4>
                  <p className="text-gray-500 italic">Not answered</p>
                </div>
              )}

              {/* Correct Answer */}
              <div className="bg-gray-900/40 rounded-xl p-5 border border-gray-700/60">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Correct Answer</h4>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-base text-emerald-300">{currentQuestion.answer}</p>
                </div>
              </div>

              {/* Explanation */}
              {currentQuestion.explanation && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                  <h4 className="text-sm font-medium text-blue-400 mb-2">Explanation</h4>
                  <p className="text-gray-300">{currentQuestion.explanation}</p>
                </div>
              )}

              {/* Choices for multiple choice */}
              {currentQuestion.choices && currentQuestion.choices.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">All Choices</h4>
                  <div className="space-y-2">
                    {currentQuestion.choices.map((choice, idx) => {
                      const isUserChoice = currentQuestion.userAnswer === choice;
                      const isCorrectChoice = choice === currentQuestion.answer;
                      
                      let bgColor = 'bg-gray-800/40';
                      if (isCorrectChoice) bgColor = 'bg-emerald-500/10 border border-emerald-500/30';
                      else if (isUserChoice && !isCorrectChoice) bgColor = 'bg-red-500/10 border border-red-500/30';
                      
                      return (
                        <div key={idx} className={`p-3 rounded-lg ${bgColor} flex items-center gap-3`}>
                          <span className="text-sm text-gray-400 w-6">{String.fromCharCode(65 + idx)}.</span>
                          <span className="flex-1">{choice}</span>
                          {isCorrectChoice && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                          {isUserChoice && !isCorrectChoice && <XCircle className="h-4 w-4 text-red-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700/50 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Completed: {quiz?.completedAt ? new Date(quiz.completedAt).toLocaleString() : 'N/A'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}