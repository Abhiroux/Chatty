import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Loader2, MessageSquare } from "lucide-react";
import { useEffect } from "react";

const VerifyOTPPage = () => {
  // State to store the OTP input value
  const [otp, setOtp] = useState("");

  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Get verifyOTP function and loading state from auth store
  const { verifyOTP, isVerifyingOTP, resendOTP } = useAuthStore();

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate OTP length before submitting
    if (otp.length !== 6) return;
    verifyOTP(otp);
  };

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleResend = () => {
    if (!canResend) return;

    resendOTP();
    setTimer(60);
    setCanResend(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#111022] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#16152a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl dark:shadow-black/20 p-8 sm:p-10 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[#6764f2]/10 dark:bg-[#6764f2]/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-[#6764f2]" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-2">
              Verify Your Account
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Enter the 6-digit OTP sent to your email or phone
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP input field - accepts only 6 characters */}
          <input
            type="text"
            maxLength="6"
            className="w-full text-center text-2xl tracking-[0.5em] px-4 py-4 bg-slate-50 dark:bg-[#1e1d33] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#6764f2]/50 focus:border-[#6764f2] outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          />

          {/* Submit button with loading state */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-[#6764f2] hover:bg-[#524fcc] text-white font-medium rounded-xl shadow-lg shadow-[#6764f2]/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isVerifyingOTP || otp.length !== 6}
          >
            {isVerifyingOTP ? (
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
      </div>
    </div>
  );
};

export default VerifyOTPPage;
