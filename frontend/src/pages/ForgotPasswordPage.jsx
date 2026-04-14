import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  MessageSquare,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Smartphone,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  // Auth method (email or phone)
  const [authMethod, setAuthMethod] = useState("email");

  // Step 1: Request OTP
  const [identifier, setIdentifier] = useState(""); // email or phone value

  // Step 2: Verify OTP
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Step 3: Reset password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Store
  const {
    forgotPasswordStep,
    isSendingResetOTP,
    isVerifyingResetOTP,
    isResettingPassword,
    forgotPassword,
    verifyForgotPasswordOTP,
    resetPassword,
    resendForgotPasswordOTP,
    clearForgotPassword,
  } = useAuthStore();

  // Cleanup on unmount
  useEffect(() => {
    return () => clearForgotPassword();
  }, [clearForgotPassword]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (forgotPasswordStep !== "verify") return;

    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer, forgotPasswordStep]);

  // Reset timer when entering verify step
  useEffect(() => {
    if (forgotPasswordStep === "verify") {
      setTimer(60);
      setCanResend(false);
      setOtp("");
    }
  }, [forgotPasswordStep]);

  // Handle Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();

    if (authMethod === "email") {
      if (!identifier.trim()) return toast.error("Email is required");
      if (!/\S+@\S+\.\S+/.test(identifier))
        return toast.error("Invalid email address");
    } else {
      if (!identifier.trim()) return toast.error("Phone number is required");
      if (!/^\+?\d{10,15}$/.test(identifier))
        return toast.error("Invalid phone number");
    }

    await forgotPassword({
      email: authMethod === "email" ? identifier : "",
      phone: authMethod === "phone" ? identifier : "",
    });
  };

  // Handle Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    await verifyForgotPasswordOTP(otp);
  };

  // Handle Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword.trim()) return toast.error("Password is required");
    if (newPassword.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirmPassword)
      return toast.error("Passwords do not match");

    const success = await resetPassword(newPassword);
    if (success) {
      navigate("/login");
    }
  };

  // Handle OTP resend
  const handleResend = () => {
    if (!canResend) return;
    resendForgotPasswordOTP();
    setTimer(60);
    setCanResend(false);
  };

  // Determine current step
  const step = forgotPasswordStep || "request";

  // Step indicator dots
  const steps = [
    { key: "request", label: "Identify", icon: Mail },
    { key: "verify", label: "Verify", icon: ShieldCheck },
    { key: "reset", label: "Reset", icon: KeyRound },
  ];
  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-[#111022]">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-[#16152a] p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-black/20 relative z-10">
          {/* Logo */}
          <div className="text-center mb-4">
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-2xl bg-[#6764f2]/10 dark:bg-[#6764f2]/20 flex items-center justify-center group-hover:bg-[#6764f2]/20 dark:group-hover:bg-[#6764f2]/30 transition-colors">
                <MessageSquare className="w-6 h-6 text-[#6764f2]" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-2">
                Reset Password
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {step === "request" && "Enter your email or phone to receive an OTP"}
                {step === "verify" && "Enter the 6-digit OTP sent to you"}
                {step === "reset" && "Set your new password"}
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === currentStepIndex;
              const isComplete = i < currentStepIndex;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isComplete
                        ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                        : isActive
                        ? "bg-[#6764f2] text-white shadow-lg shadow-[#6764f2]/30 scale-110"
                        : "bg-slate-100 dark:bg-[#1e1d33] text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`w-8 h-0.5 rounded transition-colors duration-300 ${
                        isComplete
                          ? "bg-green-500"
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* ════════════════════════════════════════════════════ */}
          {/* STEP 1 — Request OTP                               */}
          {/* ════════════════════════════════════════════════════ */}
          {step === "request" && (
            <>
              {/* Auth Method Toggle */}
              <div className="flex justify-center gap-4 mb-6">
                <button
                  type="button"
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center shadow-sm ${
                    authMethod === "email"
                      ? "bg-[#6764f2] text-white shadow-[#6764f2]/30"
                      : "bg-slate-50 dark:bg-[#1e1d33] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-slate-800"
                  }`}
                  onClick={() => {
                    setAuthMethod("email");
                    setIdentifier("");
                  }}
                >
                  <Mail className="size-4 mr-2" />
                  Email
                </button>
                <button
                  type="button"
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center shadow-sm ${
                    authMethod === "phone"
                      ? "bg-[#6764f2] text-white shadow-[#6764f2]/30"
                      : "bg-slate-50 dark:bg-[#1e1d33] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-slate-800"
                  }`}
                  onClick={() => {
                    setAuthMethod("phone");
                    setIdentifier("");
                  }}
                >
                  <Smartphone className="size-4 mr-2" />
                  Phone
                </button>
              </div>

              <form onSubmit={handleRequestOTP} className="space-y-6">
                <div className="form-control">
                  <label className="label pb-2">
                    <span className="label-text font-medium text-slate-700 dark:text-slate-300">
                      {authMethod === "email" ? "Email" : "Phone"}
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      {authMethod === "email" ? (
                        <Mail className="h-5 w-5 text-slate-400 z-10" />
                      ) : (
                        <Smartphone className="h-5 w-5 text-slate-400 z-10" />
                      )}
                    </div>
                    <input
                      type="text"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#1e1d33] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#6764f2]/50 focus:border-[#6764f2] outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      placeholder={
                        authMethod === "email"
                          ? "you@example.com"
                          : "+91XXXXXXXXXX"
                      }
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-[#6764f2] hover:bg-[#524fcc] text-white font-medium rounded-xl shadow-lg shadow-[#6764f2]/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  disabled={isSendingResetOTP}
                >
                  {isSendingResetOTP ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </form>
            </>
          )}

          {/* ════════════════════════════════════════════════════ */}
          {/* STEP 2 — Verify OTP                                */}
          {/* ════════════════════════════════════════════════════ */}
          {step === "verify" && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <input
                type="text"
                maxLength="6"
                className="w-full text-center text-2xl tracking-[0.5em] px-4 py-4 bg-slate-50 dark:bg-[#1e1d33] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#6764f2]/50 focus:border-[#6764f2] outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />

              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#6764f2] hover:bg-[#524fcc] text-white font-medium rounded-xl shadow-lg shadow-[#6764f2]/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isVerifyingResetOTP || otp.length !== 6}
              >
                {isVerifyingResetOTP ? (
                  <>
                    <Loader2 className="size-5 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </button>

              <div className="text-center mt-4">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-[#6764f2] hover:text-[#524fcc] font-medium transition-colors"
                  >
                    Resend OTP
                  </button>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Resend OTP in {timer}s
                  </p>
                )}
              </div>
            </form>
          )}

          {/* ════════════════════════════════════════════════════ */}
          {/* STEP 3 — Reset Password                            */}
          {/* ════════════════════════════════════════════════════ */}
          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* New Password */}
              <div className="form-control">
                <label className="label pb-2">
                  <span className="label-text font-medium text-slate-700 dark:text-slate-300">
                    New Password
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 z-10" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-[#1e1d33] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#6764f2]/50 focus:border-[#6764f2] outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-control">
                <label className="label pb-2">
                  <span className="label-text font-medium text-slate-700 dark:text-slate-300">
                    Confirm Password
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 z-10" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-[#1e1d33] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#6764f2]/50 focus:border-[#6764f2] outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password strength hint */}
              <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
                Password must be at least 6 characters long
              </p>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#6764f2] hover:bg-[#524fcc] text-white font-medium rounded-xl shadow-lg shadow-[#6764f2]/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                disabled={isResettingPassword}
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center gap-1 hover:text-[#6764f2] transition-colors"
              onClick={clearForgotPassword}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Image Pattern */}
      <div className="hidden lg:block relative bg-[#eef0f5] dark:bg-[#16152a] overflow-hidden">
        <AuthImagePattern
          title="Forgot your password?"
          subtitle="No worries! We'll send you a one-time code to verify your identity and let you set a new password in seconds."
        />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
