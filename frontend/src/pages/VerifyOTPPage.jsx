import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Loader2 } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl p-8">
        <h2 className="text-2xl font-bold text-center mb-4">
          Verify Your Account
        </h2>
        <p className="text-center text-base-content/60 mb-6">
          Enter the 6-digit OTP sent to your email or phone
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* OTP input field - accepts only 6 characters */}
          <input
            type="text"
            maxLength="6"
            className="input input-bordered w-full text-center text-xl tracking-widest"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          {/* Submit button with loading state */}
          <button
            type="submit"
            className="btn btn-primary w-full text-black"
            disabled={isVerifyingOTP}
          >
            {isVerifyingOTP ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify OTP"
            )}
          </button>
          <div className="text-center mt-4">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-primary font-medium hover:underline"
              >
                Resend OTP
              </button>
            ) : (
              <p className="text-base-content/60">Resend OTP in {timer}s</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
