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
import ConnectionsPage from "./pages/ConnectionsPage";
import { Loader } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useThemeStore } from "./store/useThemeStore";
import { useConnectionStore } from "./store/useConnectionStore";
import { useChatStore } from "./store/useChatStore";

const App = () => {
  // Get authentication state and functions from auth store
  const { authUser, needsOTP, checkAuth, isCheckingAuth } = useAuthStore();

  // Get theme preference from theme store
  const { activeTheme, initThemeListener } = useThemeStore();

  // Check authentication status on component mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Prompt for browser notifications if 'default' (not yet asked)
  useEffect(() => {
    if (authUser && "Notification" in window && Notification.permission === "default") {
      // Small timeout to not show immediately on login flash
      const timer = setTimeout(() => {
        toast.custom(
          (t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white dark:bg-[#16152a] shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="ml-3 flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Desktop Notifications</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Can we notify you of new messages when the app is in the background?</p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    import('./lib/notifications').then(({ requestNotificationPermission }) => {
                      requestNotificationPermission().then(perm => {
                         if (perm === 'granted') {
                             import('./lib/sounds').then(({ updateSoundSettings }) => {
                                 updateSoundSettings({ browserNotifications: true });
                             });
                             toast.success("Notifications enabled!", { id: "notif-success" });
                         }
                      });
                    });
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-bold text-[#6764f2] hover:text-[#524fcc] focus:outline-none transition-colors"
                >
                  Enable
                </button>
              </div>
            </div>
          ),
          { duration: 15000, position: "top-center" }
        );
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [authUser]);

  const { subscribeToFriendEvents, unsubscribeFromFriendEvents } = useConnectionStore();
  const { subscribeToMessages, unsubscribeFromMessages } = useChatStore();

  useEffect(() => {
    if (authUser) {
      subscribeToFriendEvents();
      subscribeToMessages();
    }
    return () => {
      unsubscribeFromFriendEvents();
      unsubscribeFromMessages();
    };
  }, [authUser, subscribeToFriendEvents, unsubscribeFromFriendEvents, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    return initThemeListener();
  }, [initThemeListener]);

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#111022]">
        <Loader className="size-10 animate-spin text-[#6764f2]" />
      </div>
    );
  }

  return (
    <div data-theme={activeTheme}>
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

        {/* Connections route - requires authentication */}
        <Route
          path="/connections"
          element={
            authUser ? (
              <ConnectionsPage />
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
