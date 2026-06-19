import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  Mail,
  ArrowRight,
  Bot,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import axios from '../axiosConfig';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailHadSpace, setEmailHadSpace] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const EMAIL_ALLOWED_REGEX = /^[a-z0-9._@]*$/;
  const EMAIL_FINAL_REGEX = /^[a-z0-9._]+@(gmail\.com|phinmaed\.com)$/;

  const handleEmailChange = (e) => {
    const rawValue = e.target.value.toLowerCase();

    setEmailHadSpace(/\s/.test(rawValue));

    const cleaned = rawValue
      .replace(/\s/g, '')
      .replace(/<[^>]*>?/gm, '')
      .replace(/[^a-z0-9._@]/g, '');

    if (EMAIL_ALLOWED_REGEX.test(cleaned)) {
      setEmail(cleaned);
    }
  };

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required.');
      return false;
    }

    if (emailHadSpace) {
      setError('Email must not contain spaces.');
      return false;
    }

    if (!EMAIL_FINAL_REGEX.test(email)) {
      setError('Enter a valid Gmail or institutional email address.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail()) return;

    setLoading(true);

    try {
      const response = await axios.post('/auth/forgot-password', {
        email: email.trim()
      });

      setSuccess(
        response?.data?.message ||
          'If an account exists with this email, you will receive a reset link.'
      );
      setEmail('');
      setEmailHadSpace(false);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Unable to process your request right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hintText = () => {
    if (!email) return '';
    if (emailHadSpace) return 'Spaces are not allowed.';
    if (!EMAIL_FINAL_REGEX.test(email)) {
      return 'Use a valid Gmail or institutional email address.';
    }
    return 'Valid email format.';
  };

  const hintClass = EMAIL_FINAL_REGEX.test(email) && !emailHadSpace
    ? 'mt-2 text-xs text-emerald-400'
    : 'mt-2 text-xs text-gray-400';

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
              Reset your
              <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                account password
              </span>
            </h1>
            <p className="text-xl text-gray-300">
              Enter your email and we’ll send you a secure password reset link.
            </p>
          </div>

          <div className="space-y-4 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
            <h3 className="font-semibold flex items-center">
              <Bot className="h-5 w-5 text-emerald-400 mr-2" />
              Account security tips
            </h3>
            {[
              'Enter the email address associated with your account',
              'A secure password reset link will be sent to your email',
              'For your protection, never share reset links or codes'
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-2xl"></div>
          <div className="relative bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
                <Mail className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold">Forgot Password</h2>
              <p className="text-gray-400 mt-2">
                We’ll send a reset link to your email
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-6">
                <p className="text-emerald-400 text-sm">{success}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
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
                      value={email}
                      onChange={handleEmailChange}
                      className="w-full bg-gray-900/60 border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      placeholder="example@gmail.com/@phinmaed.com"
                      required
                      disabled={loading}
                      maxLength={60}
                    />
                  </div>
                </div>

                {email && <p className={hintClass}>{hintText()}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <span>Sending reset link...</span>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
                  </>
                )}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-emerald-400 hover:text-emerald-300 transition"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;