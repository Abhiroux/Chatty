import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  Eye,
  EyeOff,
  Mail,
  MessageSquare,
  User,
  Lock,
  Loader2,
  Smartphone
} from "lucide-react";
import { Link } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const SignUpPage = () => {
  // ============ STATE MANAGEMENT ============
  const [authMethod, setAuthMethod] = useState("email"); // Toggle between "email" or "phone" authentication
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  }); // Store form input values

  // ============ CUSTOM HOOKS ============
  const { signup, isSigningUp } = useAuthStore(); // Get signup function and loading state from auth store

  // ============ FORM VALIDATION ============
  const validateForm = () => {
    // Check if full name is provided
    if (!formData.fullName.trim()) return toast.error("Full Name is required");

    // Validate based on auth method (email or phone)
    if (authMethod === "email") {
      if (!formData.email.trim()) return toast.error("Email is required");
      if (!/\S+@\S+\.\S+/.test(formData.email))
        return toast.error("Invalid email");
    }

    if (authMethod === "phone") {
      if (!formData.phone.trim()) return toast.error("Phone is required");
      if (!/^\+?\d{10,15}$/.test(formData.phone))
        return toast.error("Invalid phone number");
    }

    // Validate password
    if (!formData.password.trim()) return toast.error("Password is required");
    if (formData.password.length < 6)
      return toast.error("Password must be atleast 6 characters long");

    return true;
  };

  // ============ FORM SUBMISSION HANDLER ============
  const handleSubmit = (e) => {
    e.preventDefault();
    const success = validateForm();
    if (success == true) signup(formData);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-[#111022]">
      {/* ============ LEFT SIDE - SIGN UP FORM ============ */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-[#16152a] p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-black/20 relative z-10 my-8">
          {/* LOGO AND HEADING */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-2xl bg-[#6764f2]/10 dark:bg-[#6764f2]/20 flex items-center justify-center group-hover:bg-[#6764f2]/20 dark:group-hover:bg-[#6764f2]/30 transition-colors">
                <MessageSquare className="w-6 h-6 text-[#6764f2]" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-2">Create Account</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Get Started with your free account
              </p>
            </div>
          </div>

          {/* AUTH METHOD TOGGLE (EMAIL / PHONE) */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              type="button"
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center shadow-sm ${authMethod === "email"
                  ? "bg-[#6764f2] text-white shadow-[#6764f2]/30"
                  : "bg-slate-50 dark:bg-[#1e1d33] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-slate-800"
                }`}
              onClick={() => setAuthMethod("email")}
            >
              <Mail className="size-4 mr-2" />
              Email
            </button>

            <button
              type="button"
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center shadow-sm ${authMethod === "phone"
                  ? "bg-[#6764f2] text-white shadow-[#6764f2]/30"
                  : "bg-slate-50 dark:bg-[#1e1d33] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-slate-800"
                }`}
              onClick={() => setAuthMethod("phone")}
            >
              <Smartphone className="size-4 mr-2" />
              Phone
            </button>
          </div>

          {/* SIGN UP FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* FULL NAME INPUT */}
            <div className="form-control">
              <label className="label pb-2">
                <span className="label-text font-medium text-slate-700 dark:text-slate-300">Full Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="size-5 text-slate-400 z-10" />
                </div>
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#1e1d33] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#6764f2]/50 focus:border-[#6764f2] outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>
            </div>

            {/* CONDITIONAL RENDERING: EMAIL OR PHONE INPUT */}
            {authMethod === "email" ? (
              <div className="form-control">
                <label className="label pb-2">
                  <span className="label-text font-medium text-slate-700 dark:text-slate-300">Email</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="size-5 text-slate-400 z-10" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#1e1d33] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#6764f2]/50 focus:border-[#6764f2] outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
                    placeholder="abc@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                        phone: "",
                      })
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="form-control">
                <label className="label pb-2">
                  <span className="label-text font-medium text-slate-700 dark:text-slate-300">Phone</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Smartphone className="size-5 text-slate-400 z-10" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#1e1d33] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#6764f2]/50 focus:border-[#6764f2] outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
                    placeholder="+91XXXXXXXXXX"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value,
                        email: "",
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* PASSWORD INPUT WITH SHOW/HIDE TOGGLE */}
            <div className="form-control">
              <label className="label pb-2">
                <span className="label-text font-medium text-slate-700 dark:text-slate-300">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="size-5 text-slate-400 z-10" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-[#1e1d33] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#6764f2]/50 focus:border-[#6764f2] outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON WITH LOADING STATE */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#6764f2] hover:bg-[#524fcc] text-white font-medium rounded-xl shadow-lg shadow-[#6764f2]/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="size-5 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* LOGIN REDIRECT LINK */}
          <div className="text-center pt-2">
            <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center gap-1">
              Already have an account?{" "}
              <Link to="/login" className="text-[#6764f2] hover:text-[#524fcc] font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ============ RIGHT SIDE - DECORATIVE IMAGE PATTERN ============ */}
      <div className="hidden lg:block relative bg-[#eef0f5] dark:bg-[#16152a] overflow-hidden">
        <AuthImagePattern
          title="Join our community"
          subtitle="Connect with friends, share moments, and stay in touch with your loved ones"
        />
      </div>
    </div>
  );
};

export default SignUpPage;
