import { useEffect } from "react";
import Navbar from "./components/Navbar";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import SignUpPage from "./pages/SignUpPage";
import { useAuthStore } from "./store/useAuthStore";
import VerifyOTPPage from "./pages/VerifyOTPPage";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { useThemeStore } from "./store/useThemeStore";

const App = () => {
  // Get authentication state and functions from auth store
  const { authUser, needsOTP, checkAuth, isCheckingAuth } = useAuthStore();

  // Get theme preference from theme store
  const { theme } = useThemeStore();

  // Check authentication status on component mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div data-theme={theme}>
      {/* Conditionally render navbar (hidden during OTP verification) */}
      {!needsOTP && <Navbar />}

      {/* Application routes */}
      <Routes>
        {/* OTP Verification route - only accessible when OTP is needed */}
        <Route
          path="/verify-otp"
          element={needsOTP ? <VerifyOTPPage /> : <Navigate to="/" />}
        />

        {/* Home route - requires authentication */}
        <Route
          path="/"
          element={
            authUser ? (
              <HomePage />
            ) : needsOTP ? (
              <Navigate to="/verify-otp" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Sign up route - only for unauthenticated users */}
        <Route
          path="/signup"
          element={
            !authUser && !needsOTP ? (
              <SignUpPage />
            ) : needsOTP ? (
              <Navigate to="/verify-otp" />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Login route - only for unauthenticated users */}
        <Route
          path="/login"
          element={
            !authUser && !needsOTP ? (
              <LoginPage />
            ) : needsOTP ? (
              <Navigate to="/verify-otp" />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Settings route */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Profile route - requires authentication */}
        <Route
          path="/profile"
          element={
            authUser ? (
              <ProfilePage />
            ) : needsOTP ? (
              <Navigate to="/verify-otp" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Catch-all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Toast notification system */}
      <Toaster />
    </div>
  );
};

export default App;
