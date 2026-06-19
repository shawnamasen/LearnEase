import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeRedirect from './components/HomeRedirect';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from "./pages/ResetPassword";
import Dashboard from './pages/Dashboard';
import StudyMaterials from './pages/StudyMaterials';
import AIAssistant from './pages/AIAssistant';
import QuizGenerator from './pages/QuizGenerator';
import QuizTaker from './pages/QuizTaker';  // Add this import
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/study-materials" element={<ProtectedRoute><StudyMaterials /></ProtectedRoute>} />
        <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><QuizGenerator /></ProtectedRoute>} />
        <Route path="/quiz/take/:quizId" element={<ProtectedRoute><QuizTaker /></ProtectedRoute>} />  {/* Add this route */}
        <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;