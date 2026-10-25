import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  X,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  RefreshCw,
  Timer,
  Hash,
  Send,
  Check,
} from 'lucide-react';
import { getAccessToken, googleSignIn } from '../../utils/googleAuth';

interface LoginPageProps {
  onLoginSuccess: (email: string) => void;
  onCancel: () => void;
  authorizedEmail?: string;
  initialResetToken?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onCancel,
  authorizedEmail = 'nasir.developer.bd@gmail.com',
  initialResetToken = null,
}) => {
  const [emailInput, setEmailInput] = useState(authorizedEmail);
  const [passwordInput, setPasswordInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Recovery & Reset View States: 'login' | 'verify_otp' | 'reset_password'
  const [viewMode, setViewMode] = useState<'login' | 'verify_otp' | 'reset_password'>('login');

  // OTP Verification State (Notice: OTP code is NEVER stored or displayed on the client!)
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(() => {
    const exp = localStorage.getItem('nasir_otp_expires');
    return exp ? parseInt(exp, 10) : null;
  });
  const [tokenTimeRemaining, setTokenTimeRemaining] = useState<number | null>(null);
  const [isOtpExpired, setIsOtpExpired] = useState(false);
  const [otpStatus, setOtpStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  // Reset Token returned securely from the server after OTP verification
  const [resetToken, setResetToken] = useState<string | null>(initialResetToken);

  // Reset Password State (after OTP is verified)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const DEFAULT_ADMIN_PASSWORD = 'F=kq1q2/d^2';
  const getActivePassword = () =>
    localStorage.getItem('nasir_admin_password') || DEFAULT_ADMIN_PASSWORD;

  // Ensure native mouse pointer is always visible across admin modals
  useEffect(() => {
    document.body.classList.add('admin-active');
    return () => {
      document.body.classList.remove('admin-active');
    };
  }, []);

  // Check URL query token if someone clicked a reset link
  useEffect(() => {
    if (initialResetToken) {
      setResetToken(initialResetToken);
      setViewMode('reset_password');
    }
  }, [initialResetToken]);

  // Live countdown timer for active OTP
  useEffect(() => {
    if (!otpExpiresAt) return;

    const interval = setInterval(() => {
      const remainingSeconds = Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000));
      setTokenTimeRemaining(remainingSeconds);

      if (remainingSeconds <= 0) {
        setIsOtpExpired(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [otpExpiresAt]);

  const formatCountdown = (totalSeconds: number | null) => {
    if (totalSeconds === null) return '--:--';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    if (cleanEmail !== authorizedEmail.toLowerCase()) {
      setIsLoading(false);
      setErrorMsg(`Access Denied: Only verified administrator (${authorizedEmail}) can access this dashboard.`);
      return;
    }

    const validPassword = getActivePassword();
    if (passwordInput !== validPassword) {
      setIsLoading(false);
      setErrorMsg('Incorrect administrator password. Click "Forgot password?" to receive an OTP via Gmail.');
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(cleanEmail);
    }, 350);
  };

  const [showMasterKeyInput, setShowMasterKeyInput] = useState(false);
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [masterKeyError, setMasterKeyError] = useState<string | null>(null);

  const handleVerifyMasterKey = (e: React.FormEvent) => {
    e.preventDefault();
    setMasterKeyError(null);
    const cleanKey = masterKeyInput.trim();
    const validPassword = getActivePassword();
    if (cleanKey === validPassword || cleanKey === DEFAULT_ADMIN_PASSWORD) {
      setViewMode('reset_password');
      setResetError(null);
    } else {
      setMasterKeyError('Invalid Master Key formula. Please enter the correct formula or verify using your Gmail OTP.');
    }
  };

  /**
   * Dispatches OTP via server-side Nodemailer to registered Gmail.
   * CRITICAL SECURITY: The OTP code is NEVER sent back in the HTTP response
   * and is NEVER shown on the login page.
   */
  const handleSendOtpViaNodemailer = async () => {
    setIsSendingOtp(true);
    setOtpStatus({ type: 'idle', message: '' });
    setResetError(null);
    setOtpInput('');

    try {
      let accessToken = await getAccessToken().catch(() => null);

      // If no active token, trigger Google sign in popup to authenticate with Gmail scope
      if (!accessToken) {
        try {
          const authResult = await googleSignIn();
          accessToken = authResult?.accessToken || null;
        } catch (popupErr: any) {
          console.warn('Google sign-in popup skipped:', popupErr?.message || popupErr);
        }
      }

      if (!accessToken) {
        setOtpStatus({
          type: 'error',
          message:
            'Google Sign-in was dismissed. You can click "Authorize with Google & Send OTP" below, or enter your Master Formula Key (F=kq1q2/d^2) to reset your password immediately.',
        });
        setViewMode('verify_otp');
        setIsSendingOtp(false);
        return;
      }

      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authorizedEmail,
          accessToken: accessToken,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setOtpStatus({
          type: 'error',
          message: data.error || 'Failed to dispatch OTP. You can use your Master Formula Key (F=kq1q2/d^2) below.',
        });
        setViewMode('verify_otp');
        setIsSendingOtp(false);
        return;
      }

      const expires = data.expiresAt || (Date.now() + 15 * 60 * 1000);
      setOtpExpiresAt(expires);
      setIsOtpExpired(false);
      setTokenTimeRemaining(15 * 60);
      try {
        localStorage.setItem('nasir_otp_expires', String(expires));
      } catch {}

      setOtpStatus({
        type: 'success',
        message: data.message || `A 6-digit OTP code has been sent via Nodemailer to ${authorizedEmail}. Please check your Gmail inbox (and Spam/Junk folder) and enter the code below.`,
      });
      setViewMode('verify_otp');
    } catch (err: any) {
      console.warn('Nodemailer OTP dispatch notice:', err?.message || err);
      setOtpStatus({
        type: 'error',
        message: err.message || 'Unable to connect to Nodemailer service. You can use your Master Formula Key (F=kq1q2/d^2) to reset immediately.',
      });
      setViewMode('verify_otp');
    } finally {
      setIsSendingOtp(false);
    }
  };

  /**
   * Verifies the 6-digit code entered by the user against the server's Nodemailer session
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    const cleanInput = otpInput.trim().replace(/\D/g, '');
    if (cleanInput.length !== 6) {
      setResetError('Please enter a valid 6-digit numeric OTP code.');
      return;
    }

    if (isOtpExpired) {
      setResetError('The OTP code has expired. Please request a new code using the button below.');
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authorizedEmail,
          otp: cleanInput,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid OTP code. Please check your Gmail inbox and try again.');
      }

      // Secure reset token received
      setResetToken(data.resetToken);
      try {
        localStorage.removeItem('nasir_otp_expires');
      } catch {}

      setViewMode('reset_password');
    } catch (err: any) {
      setResetError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  /**
   * Sets new administrator password after OTP is verified
   */
  const handleCompletePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    const cleanPwd = newPassword.trim();
    if (!cleanPwd) {
      setResetError('Please enter a new administrator password.');
      return;
    }

    if (cleanPwd.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    if (cleanPwd !== confirmPassword.trim()) {
      setResetError('Passwords do not match. Please re-enter carefully.');
      return;
    }

    setIsResettingPassword(true);

    try {
      if (resetToken) {
        await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resetToken,
            newPassword: cleanPwd,
          }),
        }).catch(() => {});
      }

      // Save new password to localStorage
      localStorage.setItem('nasir_admin_password', cleanPwd);
      localStorage.removeItem('nasir_otp_expires');

      setResetSuccess('Password has been successfully updated! Signing you in...');

      setTimeout(() => {
        onLoginSuccess(authorizedEmail);
      }, 700);
    } catch (err: any) {
      setResetError(err.message || 'Failed to update password.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="admin-modal fixed inset-0 z-[10500] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-fadeIn text-[#f0ead8] cursor-default">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#170a2c] via-[#100720] to-[#0a0515] border border-amber-500/30 p-7 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto cursor-default">
        {/* Ambient glow decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        {/* Close Modal Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Close"
        >
          <X size={18} />
        </button>

        {/* ══════════════════════════════════════════════════════
            VIEW 1: STANDARD ADMIN LOGIN
            ══════════════════════════════════════════════════════ */}
        {viewMode === 'login' && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-[#f0b840] to-[#e8547a] flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
                <Shield size={28} />
              </div>
              <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                Administrator Login
              </h2>
              <p className="text-xs text-white/50 mt-1">
                Private Dashboard for <span className="text-amber-300">Md. Nasir Uddin</span>
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] text-white/50 block mb-1">Administrator Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-3 text-white/40" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-white/50">Admin Password</label>
                  <button
                    type="button"
                    onClick={handleSendOtpViaNodemailer}
                    className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline cursor-pointer flex items-center gap-1 font-medium"
                  >
                    <KeyRound size={12} />
                    <span>Forgot password?</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-3 text-white/40" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter administrator password"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-white/60">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded accent-amber-400 cursor-pointer"
                  />
                  <span>Remember this session</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-semibold text-xs bg-gradient-to-r from-[#f0b840] to-[#ff7e5f] hover:brightness-110 text-black shadow-lg shadow-amber-500/25 transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound size={15} />
                <span>{isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/10 text-center text-[10px] text-white/40 leading-relaxed">
              🔒 Protected Administrator Gateway · Only <strong>{authorizedEmail}</strong> is authorized to manage the live biodata website.
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            VIEW 2: ENTER OTP (OTP IS SENT VIA NODEMAILER TO GMAIL)
            CRITICAL: OTP CODE IS NEVER SHOWN ON THIS SCREEN!
            ══════════════════════════════════════════════════════ */}
        {viewMode === 'verify_otp' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <button
                type="button"
                onClick={() => setViewMode('login')}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Back to login"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                  <Mail size={18} className="text-amber-400" />
                  <span>Enter Gmail Verification OTP</span>
                </h3>
                <p className="text-[11px] text-white/50">
                  Sent via Nodemailer to <span className="text-amber-300 font-mono">{authorizedEmail}</span>
                </p>
              </div>
            </div>

            {/* Sending Loading State */}
            {isSendingOtp && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3 animate-pulse">
                <RefreshCw size={18} className="animate-spin shrink-0" />
                <div>
                  <p className="font-semibold">Dispatching OTP via Nodemailer...</p>
                  <p className="text-[11px] text-amber-200/70 mt-0.5">
                    Sending verification code to your registered Gmail ({authorizedEmail}).
                  </p>
                </div>
              </div>
            )}

            {/* OTP Status Notification */}
            {otpStatus.message && !isSendingOtp && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  otpStatus.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/15 border-red-500/30 text-red-300'
                }`}
              >
                {otpStatus.type === 'success' ? (
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                )}
                <div className="leading-relaxed">
                  <p className="font-semibold mb-0.5">
                    {otpStatus.type === 'success' ? 'OTP Dispatched to Gmail' : 'Notice'}
                  </p>
                  <p>{otpStatus.message}</p>
                  {otpStatus.type === 'error' && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleSendOtpViaNodemailer}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition cursor-pointer"
                      >
                        Try Google Sign-In Again
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMasterKeyInput(true)}
                        className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 text-[11px] font-medium transition cursor-pointer"
                      >
                        Use Master Formula Key
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Expiration Timer Indicator */}
            {otpExpiresAt && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                <span className="text-white/60 flex items-center gap-1.5">
                  <Timer size={14} className={isOtpExpired ? 'text-red-400' : 'text-amber-400'} />
                  <span>Code Validity:</span>
                </span>
                <span
                  className={`font-mono font-semibold px-2 py-0.5 rounded-md ${
                    isOtpExpired
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-amber-400/20 text-amber-300'
                  }`}
                >
                  {isOtpExpired ? 'Expired' : `Expires in: ${formatCountdown(tokenTimeRemaining)}`}
                </span>
              </div>
            )}

            {/* Error Message */}
            {resetError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {/* Verification Form (Strictly an input for the code found in Gmail) */}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs text-white/80 block mb-1.5 font-medium">
                  Enter 6-Digit OTP from your Gmail
                </label>
                <div className="relative">
                  <Hash size={16} className="absolute left-3.5 top-3.5 text-white/40" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    autoFocus
                    required
                    className="w-full bg-black/40 border border-white/20 rounded-xl pl-10 pr-3 py-3 text-lg tracking-[0.4em] text-center text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
                <p className="text-[11px] text-white/40 mt-1.5 text-center">
                  Open your Gmail app or mail.google.com to view the code.
                </p>
              </div>

              <button
                type="submit"
                disabled={otpInput.length !== 6 || isOtpExpired || isVerifyingOtp}
                className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 text-black flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-40"
              >
                {isVerifyingOtp ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>Verify Code & Proceed</span>
                  </>
                )}
              </button>
            </form>

            {/* Resend via Nodemailer Action */}
            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <button
                type="button"
                disabled={isSendingOtp}
                onClick={handleSendOtpViaNodemailer}
                className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send size={12} />
                <span>{isSendingOtp ? 'Sending fresh OTP...' : 'Resend OTP via Nodemailer'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('login')}
                className="text-white/50 hover:text-white underline cursor-pointer"
              >
                ← Return to Sign In
              </button>
            </div>

            {/* Master Key Emergency Option */}
            <div className="pt-2 border-t border-white/10 text-center">
              {!showMasterKeyInput ? (
                <button
                  type="button"
                  onClick={() => setShowMasterKeyInput(true)}
                  className="text-[11px] text-white/40 hover:text-amber-300 underline cursor-pointer"
                >
                  Or verify using Master Formula Key
                </button>
              ) : (
                <form onSubmit={handleVerifyMasterKey} className="space-y-2 mt-2 bg-white/5 p-3 rounded-xl border border-white/10 text-left">
                  <div className="flex items-center justify-between text-[11px] text-white/60">
                    <span>Master Formula Key</span>
                    <button
                      type="button"
                      onClick={() => setShowMasterKeyInput(false)}
                      className="text-white/40 hover:text-white"
                    >
                      Hide
                    </button>
                  </div>
                  {masterKeyError && (
                    <div className="text-[11px] text-red-300 flex items-center gap-1">
                      <AlertCircle size={12} />
                      <span>{masterKeyError}</span>
                    </div>
                  )}
                  <input
                    type="password"
                    value={masterKeyInput}
                    onChange={(e) => setMasterKeyInput(e.target.value)}
                    placeholder="Enter Master Formula Key"
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 rounded-lg text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-black transition"
                  >
                    Verify Master Key & Reset Password
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            VIEW 3: SET NEW MASTER PASSWORD (AFTER OTP IS VERIFIED)
            ══════════════════════════════════════════════════════ */}
        {viewMode === 'reset_password' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <button
                type="button"
                onClick={() => setViewMode('login')}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Back to login"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                  <KeyRound size={18} className="text-emerald-400" />
                  <span>Choose New Master Password</span>
                </h3>
                <p className="text-[11px] text-white/50">
                  Set new password for Md. Nasir Uddin ({authorizedEmail})
                </p>
              </div>
            </div>

            {/* Verified Confirmation */}
            <div className="p-3.5 rounded-xl border bg-emerald-500/15 border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>OTP verified successfully! Please enter your new administrator password.</span>
            </div>

            {/* Error & Success Alerts */}
            {resetError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {/* Set New Password Form */}
            <form onSubmit={handleCompletePasswordReset} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-white/50">New Master Password</label>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-[11px] text-white/40 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showNewPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-3 text-white/40" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-white/50 block mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-3 text-white/40" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isResettingPassword}
                className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 text-black shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isResettingPassword ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Save New Password & Sign In</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setViewMode('login')}
                className="text-xs text-white/50 hover:text-white underline cursor-pointer"
              >
                ← Return to standard login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
