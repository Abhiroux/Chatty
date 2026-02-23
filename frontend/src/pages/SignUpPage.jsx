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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ============ LEFT SIDE - SIGN UP FORM ============ */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* LOGO AND HEADING */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Create Account</h1>
              <p className="text-base-content/60">
                Get Started with your free account
              </p>
            </div>
          </div>

          {/* AUTH METHOD TOGGLE (EMAIL / PHONE) */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              type="button"
              className={`btn btn-sm ${
                authMethod === "email"
                  ? "btn-primary text-black"
                  : "btn-outline"
              }`}
              onClick={() => setAuthMethod("email")}
            >
              <Mail className="size-4 mr-1" />
              Email
            </button>

            <button
              type="button"
              className={`btn btn-sm ${
                authMethod === "phone"
                  ? "btn-primary text-black"
                  : "btn-outline"
              }`}
              onClick={() => setAuthMethod("phone")}
            >
              <MessageSquare className="size-4 mr-1" />
              Phone
            </button>
          </div>

          {/* SIGN UP FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* FULL NAME INPUT */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Full Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-5 text-base-content/40 z-10" />
                </div>
                <input
                  type="text"
                  className={`input input-bordered w-full pl-10`}
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
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="size-5 text-base-content/40 z-10" />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10"
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
                <label className="label">
                  <span className="label-text font-medium">Phone</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MessageSquare className="size-5 text-base-content/40 z-10" />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10"
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
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-base-content/40 z-10" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input input-bordered w-full pl-10`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-base-content/40 z-10" />
                  ) : (
                    <Eye className="size-5 text-base-content/40 z-10" />
                  )}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON WITH LOADING STATE */}
            <button
              type="submit"
              className="btn btn-primary w-full rounded text-black"
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* LOGIN REDIRECT LINK */}
          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ============ RIGHT SIDE - DECORATIVE IMAGE PATTERN ============ */}
      <AuthImagePattern
        title="Join our community"
        subtitle="Connect with friends, share moments, and stay in touch with your loved ones"
      />
    </div>
  );
};

export default SignUpPage;
