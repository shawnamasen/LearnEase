import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";

function ResetPassword() {

  const [params] = useSearchParams();
  const navigate = useNavigate();

  const auth = getAuth();

  const oobCode = params.get("oobCode");

  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[^\s]{8,16}$/;

  useEffect(() => {

    if (!oobCode) {
      setError("Invalid password reset link.");
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        setValid(true);
      })
      .catch(() => {
        setError("This reset link is invalid or expired.");
      });

  }, [auth, oobCode]);

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");

    if (!PASSWORD_REGEX.test(password)) {
      setError(
        "Password must be 8–16 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {

      await confirmPasswordReset(auth, oobCode, password);

      setSuccess(true);

      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (err) {

      console.error(err);

      setError("Failed to reset password. Try again.");

    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="bg-gray-800 p-8 rounded-xl text-center">
          <CheckCircle className="mx-auto text-emerald-400 h-10 w-10 mb-4"/>
          <h2 className="text-xl font-semibold">Password Reset Successful</h2>
          <p className="text-gray-400 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>{error || "Verifying reset link..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">

      <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md">

        <h2 className="text-2xl font-bold mb-6 text-center">
          Reset Password
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400"/>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              className="w-full pl-10 pr-10 py-3 bg-gray-900 border border-gray-700 rounded-lg"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={()=>setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400"
            >
              {showPassword ? <EyeOff/> : <Eye/>}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400"/>
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full pl-10 py-3 bg-gray-900 border border-gray-700 rounded-lg"
              value={confirmPassword}
              onChange={(e)=>setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-emerald-500 py-3 rounded-lg font-semibold"
          >
            {loading ? "Updating Password..." : "Reset Password"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default ResetPassword;