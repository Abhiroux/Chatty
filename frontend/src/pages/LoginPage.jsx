import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  MessageSquare,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Smartphone,
} from "lucide-react";
import { Link } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const LoginPage = () => {
  // State for password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  // State for authentication method selection (email or phone)
  const [authMethod, setAuthMethod] = useState("email");

  // Form data state
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
  });

  // Auth store functions and state
  const { login, isLoggingIn } = useAuthStore();

  // Validate form based on selected authentication method
  const validateForm = () => {
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

    if (!formData.password.trim()) return toast.error("Password is required");

    return true;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const success = validateForm();
    if (success) {
      login({
        email: authMethod === "email" ? formData.email : "",
        phone: authMethod === "phone" ? formData.phone : "",
        password: formData.password,
      });
    }
  };

  return (
    <div className="h-screen grid lg:grid-cols-2">
      {/* Left Side - Login Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Welcome Back</h1>
              <p className="text-base-content/60">Sign in to your account</p>
            </div>
          </div>

          {/* Auth Method Toggle (Email/Phone) */}
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
              <Smartphone className="size-4 mr-1" />
              Phone
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email OR Phone Input Field */}
            {authMethod === "email" ? (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-base-content/40 z-10" />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10"
                    placeholder="you@example.com"
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
                    <Smartphone className="h-5 w-5 text-base-content/40 z-10" />
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

            {/* Password Input Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-base-content/40 z-1" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                />
                {/* Password Visibility Toggle Button */}
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-base-content/40" />
                  ) : (
                    <Eye className="h-5 w-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-full text-black"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-base-content/60">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="link link-primary">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image Pattern */}
      <AuthImagePattern
        title="Join our community"
        subtitle="Connect with friends, share moments, and stay in touch with your loved ones"
      />
    </div>
  );
};

export default LoginPage;
