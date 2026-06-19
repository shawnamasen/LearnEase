import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, Mail, Lock, Eye, EyeOff, User, Sparkles,
  ArrowRight, Shield, Check, Rocket, Bot
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import axios from '../axiosConfig';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAhKOC9eML-D7oRo_zAY3dEbSME_atnNl4",
  authDomain: "learnease-7a1fe.firebaseapp.com",
  projectId: "learnease-7a1fe",
  storageBucket: "learnease-7a1fe.firebasestorage.app",
  messagingSenderId: "930899346583",
  appId: "1:930899346583:web:a040e638f2dd80f59e95d2",
  measurementId: "G-DGGXF6ZV5D"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const NAME_REGEX = /^[A-Za-z ]*$/;
const EMAIL_ALLOWED_REGEX = /^[a-z0-9._@]*$/;
const EMAIL_FINAL_REGEX = /^[a-z0-9._]+@(gmail\.com|phinmaed\.com)$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 16;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[^\s]{8,16}$/;

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailHadSpace, setEmailHadSpace] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const nameHint = useMemo(() => {
    if (!formData.name) return '';
    if (!/^[A-Za-z]+(?: [A-Za-z]+)+$/.test(formData.name.trim())) {
      return 'Enter your full name using letters and spaces only.';
    }
    return 'Looks good.';
  }, [formData.name]);

  const emailHint = useMemo(() => {
    if (!formData.email) return '';

    if (emailHadSpace) {
      return 'Spaces are not allowed in email addresses.';
    }

    if (!EMAIL_FINAL_REGEX.test(formData.email)) {
      return 'Enter a valid email address using approved domains.';
    }

    return 'Valid email format.';
  }, [formData.email, emailHadSpace]);

  const passwordHint = useMemo(() => {
    const password = formData.password;

    if (!password) return '';

    if (/\s/.test(password)) {
      return 'Spaces are not allowed.';
    }

    if (password.length < PASSWORD_MIN) {
      return `Minimum ${PASSWORD_MIN} characters required.`;
    }

    if (!/[A-Z]/.test(password)) {
      return 'Add one uppercase letter.';
    }

    if (!/[a-z]/.test(password)) {
      return 'Add one lowercase letter.';
    }

    if (!/\d/.test(password)) {
      return 'Add one number.';
    }

    if (!/[@$!%*?&#^()_\-+=]/.test(password)) {
      return 'Add one special character.';
    }

    return 'Strong password.';
  }, [formData.password]);

  const confirmPasswordHint = useMemo(() => {
    if (!formData.confirmPassword) return '';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
    return 'Passwords match.';
  }, [formData.password, formData.confirmPassword]);

  const handleNameChange = (e) => {
    const rawValue = e.target.value;
    const cleaned = rawValue
      .replace(/[^A-Za-z\s]/g, '')
      .replace(/\s{2,}/g, ' ');

    if (NAME_REGEX.test(cleaned)) {
      setFormData((prev) => ({ ...prev, name: cleaned }));
    }
  };

  const handleEmailChange = (e) => {
    const rawValue = e.target.value.toLowerCase();

    setEmailHadSpace(/\s/.test(rawValue));

    const cleaned = rawValue.replace(/\s/g, '').replace(/[^a-z0-9._@]/g, '');

    if (EMAIL_ALLOWED_REGEX.test(cleaned)) {
      setFormData((prev) => ({ ...prev, email: cleaned }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value.replace(/\s/g, '').slice(0, PASSWORD_MAX);
    setFormData((prev) => ({ ...prev, password: value }));
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value.replace(/\s/g, '').slice(0, PASSWORD_MAX);
    setFormData((prev) => ({ ...prev, confirmPassword: value }));
  };

  const validateForm = () => {
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      setError('Full name is required.');
      return false;
    }

    if (!/^[A-Za-z]+(?: [A-Za-z]+)+$/.test(trimmedName)) {
      setError('Full name must contain letters and spaces only, and should include at least first and last name.');
      return false;
    }

    if (emailHadSpace) {
      setError('Email must not contain spaces.');
      return false;
    }

    if (!EMAIL_FINAL_REGEX.test(formData.email)) {
      setError('Email must use lowercase letters, numbers, ".", "_" and end with @gmail.com or @phinmaed.com.');
      return false;
    }

    if (!PASSWORD_REGEX.test(formData.password)) {
      setError('Password must be 8-16 characters and include at least one uppercase letter, one lowercase letter, and one number. Spaces are not allowed.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      const response = await axios.post('/auth/signup', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setEmailHadSpace(false);

        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    } catch (error) {
      console.error('Signup error:', error);

      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        setError(errorMessages);
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const response = await axios.post('/auth/google', {
        idToken: idToken
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        setSuccess(true);

        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
    } catch (error) {
      console.error('Google sign-up error:', error);

      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-up cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email address but a different sign-in method.');
      } else {
        setError(error.response?.data?.error || 'Google sign-up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const hintClass = (ok) =>
    `mt-2 text-xs ${ok ? 'text-emerald-400' : 'text-gray-400'}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block space-y-8">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur-lg opacity-50"></div>
              <Brain className="h-12 w-12 text-emerald-400 relative" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              LearnEase AI
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight">
              Start Learning with
              <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                AI-Powered Intelligence
              </span>
            </h1>
            <p className="text-xl text-gray-300">
              Join thousands of learners who are accelerating their growth with personalized AI tutoring
            </p>
          </div>

          <div className="space-y-4 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
            <h3 className="font-semibold flex items-center">
              <Rocket className="h-5 w-5 text-emerald-400 mr-2" />
              Free account includes:
            </h3>
            {[
              "AI chatbot tutor - 24/7 assistance",
              "5 AI-generated quizzes per month",
              "Smart reviewer summaries",
              "Basic progress tracking",
              "Community access"
            ].map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3" />
                </div>
                <span className="text-sm text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 border-2 border-gray-900 flex items-center justify-center text-xs font-bold">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div>
              <span className="text-sm text-gray-400">Join 100K+ smart learners</span>
              <div className="flex items-center text-xs text-emerald-400">
                <Sparkles className="h-3 w-3 mr-1" />
                <span>14-day free trial on Pro</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-2xl"></div>
          <div className="relative bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
                <Bot className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold">Create your account</h2>
              <p className="text-gray-400 mt-2">Start your AI-powered learning journey</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-6">
                <p className="text-emerald-400 text-sm">
                  Account created successfully! Redirecting to login...
                </p>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg opacity-0 group-hover:opacity-30 transition-opacity blur-sm"></div>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={handleNameChange}
                      className="w-full bg-gray-900/60 border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      placeholder="Full name"
                      required
                      disabled={loading || success}
                      maxLength={50}
                    />
                  </div>
                </div>
                {formData.name && (
                  <p className={hintClass(/^[A-Za-z]+(?: [A-Za-z]+)+$/.test(formData.name.trim()))}>
                    {nameHint}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg opacity-0 group-hover:opacity-30 transition-opacity blur-sm"></div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={handleEmailChange}
                      className="w-full bg-gray-900/60 border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      placeholder="example.example_01@gmail.com/@phinmaed.com"
                      required
                      disabled={loading || success}
                      maxLength={60}
                    />
                  </div>
                </div>
                {formData.email && (
                  <p className={hintClass(EMAIL_FINAL_REGEX.test(formData.email) && !emailHadSpace)}>
                    {emailHint}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg opacity-0 group-hover:opacity-30 transition-opacity blur-sm"></div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handlePasswordChange}
                      className="w-full bg-gray-900/60 border border-gray-700 rounded-lg py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      placeholder="••••••••••••••••"
                      required
                      disabled={loading || success}
                      minLength={8}
                      maxLength={16}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition"
                      disabled={loading || success}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {formData.password && (
                  <p className={hintClass(formData.password.length >= 8 && formData.password.length <= 16 && !/\s/.test(formData.password))}>
                    {passwordHint}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg opacity-0 group-hover:opacity-30 transition-opacity blur-sm"></div>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      className="w-full bg-gray-900/60 border border-gray-700 rounded-lg py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      placeholder="••••••••••••••••"
                      required
                      disabled={loading || success}
                      minLength={8}
                      maxLength={16}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition"
                      disabled={loading || success}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {formData.confirmPassword && (
                  <p className={hintClass(formData.password === formData.confirmPassword)}>
                    {confirmPasswordHint}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 focus:ring-offset-gray-800"
                  required
                  disabled={loading || success}
                />
                <label htmlFor="terms" className="text-sm text-gray-300">
                  I agree to the{' '}
                  <a href="#" className="text-emerald-400 hover:text-emerald-300">Terms</a>
                  {' '}and{' '}
                  <a href="#" className="text-emerald-400 hover:text-emerald-300">Privacy Policy</a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Creating account...</span>
                ) : success ? (
                  <span>Account created!</span>
                ) : (
                  <>
                    <span>Create free account</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-400">
                By signing up, you agree to receive AI learning recommendations and updates.
                You can unsubscribe at any time.
              </p>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-800/50 backdrop-blur-sm text-gray-400">Or sign up with</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6">
              <button
                onClick={handleGoogleSignUp}
                disabled={loading || success}
                className="flex items-center justify-center space-x-2 py-3 border border-gray-700 rounded-lg hover:bg-gray-700/50 hover:border-emerald-400/50 transition group w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" className="text-emerald-400" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" className="text-cyan-400" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" className="text-emerald-400" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" className="text-cyan-400" />
                </svg>
                <span className="text-sm">Sign up with Google</span>
              </button>
            </div>

            <p className="text-center text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;