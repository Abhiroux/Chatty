import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import {
  generateKeyPair,
  storePrivateKey,
  getLocalPrivateKey,
  wrapPrivateKey,
  unwrapPrivateKey,
  doKeysMatch,
  getPublicKeyFromPrivateJwk,
} from "../lib/crypto";

const BASE_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.MODE === "production" ? "/" : "http://localhost:5001");

export const useAuthStore = create((set, get) => ({
  // State
  authUser: null, // Current authenticated user
  pendingUserId: null, // User ID waiting for OTP verification
  needsOTP: false, // Flag indicating OTP verification is required
  isSigningUp: false, // Loading state for signup
  isLoggingIn: false, // Loading state for login
  isVerifyingOTP: false, // Loading state for OTP verification
  isUpdatingProfile: false, // Loading state for profile update
  isCheckingAuth: true, // Loading state for auth check
  onlineUsers: [], // List of online user IDs
  socket: null, // Socket.io connection instance
  pendingPassword: null, // Temporarily holds password during signup flow for key wrapping

  // Forgot password state
  forgotPasswordUserId: null,
  forgotPasswordResetToken: null,
  forgotPasswordStep: null, // 'request' | 'verify' | 'reset' | null
  isSendingResetOTP: false,
  isVerifyingResetOTP: false,
  isResettingPassword: false,

  // Check if user is authenticated (page refresh — no password available)
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
      // On checkAuth, we don't have the password. Try localStorage first.
      // If localStorage is empty but server has encrypted key, user needs to re-login.
      await get().initKeysFromLocal(res.data);
    } catch (error) {
      console.log("Error in checkAuth", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // Sign up new user — store password temporarily for key init after OTP
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      console.log(res);
      set({
        pendingUserId: res.data.userId,
        needsOTP: true,
        pendingPassword: data.password, // Store temporarily for initKeys after OTP
      });
      toast.success("OTP sent successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup Failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  // Verify OTP for user account
  verifyOTP: async (otp) => {
    const { pendingUserId, pendingPassword } = get();

    if (!pendingUserId) return;

    set({ isVerifyingOTP: true });
    try {
      const res = await axiosInstance.post("/auth/verify-otp", {
        userId: pendingUserId,
        otp,
      });

      set({
        authUser: res.data,
        pendingUserId: null,
        needsOTP: false,
      });

      toast.success("Account Verified Successfully");
      get().connectSocket();
      await get().initKeysWithPassword(res.data, pendingPassword);
      set({ pendingPassword: null }); // Clear password after key init
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
    } finally {
      set({ isVerifyingOTP: false });
    }
  },

  resendOTP: async () => {
    const { pendingUserId } = get();

    if (!pendingUserId) return;

    try {
      await axiosInstance.post("/auth/resend-otp", {
        userId: pendingUserId,
      });

      toast.success("OTP resent successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend otp");
    }
  },

  // Log in existing user — password available for key recovery
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
      await get().initKeysWithPassword(res.data, data.password);
    } catch (error) {
      if (error.response?.status === 403) {
        set({
          needsOTP: true,
          pendingUserId: error.response.data.userId || null,
          pendingPassword: data.password, // Store for after OTP verification
        });
        toast.error("Please verify your account first");
      } else {
        toast.error(error.response?.data?.message || "Login Failed");
      }
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // Log out current user
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null, pendingPassword: null });
      toast.success("Logout Successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error("Something went wrong");
      console.log(error.response?.data?.message);
    }
  },

  // Update user profile
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile Updated Successfully");
    } catch (error) {
      console.log("error in update profile: ", error);
      toast.error(error.response?.data?.message || "Error updating profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // Request update for email or phone
  requestContactUpdate: async (data) => {
    try {
      const res = await axiosInstance.post("/auth/request-contact-update", data);
      toast.success(res.data.message || "OTP sent to new contact");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to request contact update");
      return false;
    }
  },

  // Verify contact update OTP
  verifyContactUpdate: async (data) => {
    try {
      const res = await axiosInstance.post("/auth/verify-contact-update", data);
      set({ authUser: res.data.updatedUser });
      toast.success("Contact updated successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or expired OTP");
      return false;
    }
  },

  // Change password and re-wrap the private key
  changePassword: async ({ oldPassword, newPassword }) => {
    try {
      const { authUser } = get();
      const privateKey = await getLocalPrivateKey(authUser._id);

      let payload = { oldPassword, newPassword };

      if (privateKey) {
        // Export the current private key JWK from localStorage
        const privateKeyJwk = JSON.parse(localStorage.getItem(`privateKey_${authUser._id}`));

        // Re-wrap with new password
        const { encryptedPrivateKey, keySalt } = await wrapPrivateKey(privateKeyJwk, newPassword);
        payload.encryptedPrivateKey = encryptedPrivateKey;
        payload.keySalt = keySalt;
      }

      await axiosInstance.post("/auth/change-password", payload);
      toast.success("Password changed successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
      return false;
    }
  },

  // ═══════════════════════════════════════════════════════════
  // FORGOT PASSWORD FLOW
  // ═══════════════════════════════════════════════════════════

  // Step 1: Request OTP for password reset
  forgotPassword: async (data) => {
    set({ isSendingResetOTP: true });
    try {
      const res = await axiosInstance.post("/auth/forgot-password", data);
      set({
        forgotPasswordUserId: res.data.userId,
        forgotPasswordStep: "verify",
      });
      toast.success("OTP sent to your registered email/phone");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reset OTP");
      return false;
    } finally {
      set({ isSendingResetOTP: false });
    }
  },

  // Step 2: Verify the forgot-password OTP
  verifyForgotPasswordOTP: async (otp) => {
    const { forgotPasswordUserId } = get();
    if (!forgotPasswordUserId) return false;

    set({ isVerifyingResetOTP: true });
    try {
      const res = await axiosInstance.post("/auth/verify-forgot-password-otp", {
        userId: forgotPasswordUserId,
        otp,
      });
      set({
        forgotPasswordResetToken: res.data.resetToken,
        forgotPasswordStep: "reset",
      });
      toast.success("OTP verified! Set your new password");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or expired OTP");
      return false;
    } finally {
      set({ isVerifyingResetOTP: false });
    }
  },

  // Step 3: Reset the password with the reset token
  resetPassword: async (newPassword) => {
    const { forgotPasswordUserId, forgotPasswordResetToken } = get();
    if (!forgotPasswordUserId || !forgotPasswordResetToken) return false;

    set({ isResettingPassword: true });
    try {
      await axiosInstance.post("/auth/reset-password", {
        userId: forgotPasswordUserId,
        resetToken: forgotPasswordResetToken,
        newPassword,
      });
      toast.success("Password reset successfully! Please login.");
      set({
        forgotPasswordUserId: null,
        forgotPasswordResetToken: null,
        forgotPasswordStep: null,
      });
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
      return false;
    } finally {
      set({ isResettingPassword: false });
    }
  },

  // Resend OTP for forgot password
  resendForgotPasswordOTP: async () => {
    const { forgotPasswordUserId } = get();
    if (!forgotPasswordUserId) return;

    try {
      await axiosInstance.post("/auth/resend-forgot-password-otp", {
        userId: forgotPasswordUserId,
      });
      toast.success("OTP resent successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    }
  },

  // Clear forgot password state (e.g., when navigating away)
  clearForgotPassword: () => {
    set({
      forgotPasswordUserId: null,
      forgotPasswordResetToken: null,
      forgotPasswordStep: null,
      isSendingResetOTP: false,
      isVerifyingResetOTP: false,
      isResettingPassword: false,
    });
  },

  // Establish socket connection and listen for online users
  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;
    const socket = io(BASE_URL, {
      query: { userId: authUser._id },
    });
    socket.connect();
    set({ socket: socket });
    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  // Disconnect socket connection
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },

  // ═══════════════════════════════════════════════════════════
  // E2EE KEY INITIALIZATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Initialize keys when PASSWORD IS AVAILABLE (login / signup+OTP).
   * This is the main key recovery path:
   * 1. Check localStorage for existing private key
   * 2. If not found, try to unwrap from server using password
   * 3. If server has no key either, generate a brand new pair
   *
   * IMPORTANT: If the server has existing keys but unwrapping fails,
   * we MUST NOT generate new keys — that would overwrite the server's
   * public key and permanently break decryption of old messages.
   */
  initKeysWithPassword: async (user, password) => {
    try {
      if (!user || !password) return;

      // Step 1: Check localStorage
      let hasLocalKey = await getLocalPrivateKey(user._id);

      if (hasLocalKey) {
        const privateKeyJwk = JSON.parse(localStorage.getItem(`privateKey_${user._id}`));

        // Check if the local key matches the server's public key.
        // If they don't match, the server's key was likely corrupted by a
        // failed key regeneration on another device. The local key is the
        // authoritative source — re-upload the correct public key.
        const needsReSync = !user.encryptedPrivateKey ||
          (user.publicKey && !doKeysMatch(privateKeyJwk, user.publicKey));

        if (needsReSync) {
          console.log(needsReSync && user.publicKey
            ? "⚠️ Local key doesn't match server — re-syncing correct keys..."
            : "Backing up private key to server..."
          );
          const publicKeyJwk = getPublicKeyFromPrivateJwk(privateKeyJwk);
          const { encryptedPrivateKey, keySalt } = await wrapPrivateKey(privateKeyJwk, password);
          const res = await axiosInstance.put("/auth/update-profile", {
            encryptedPrivateKey,
            keySalt,
            publicKey: JSON.stringify(publicKeyJwk),
          });
          set({ authUser: res.data });
          console.log("Keys re-synced to server successfully ✅");
        }
        return; // Done — local key is ready
      }

      // Step 2: Try to recover from server
      if (user.encryptedPrivateKey && user.keySalt) {
        console.log("Recovering private key from server...");

        // Try up to 2 attempts in case of transient crypto failures
        let privateKeyJwk = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
          privateKeyJwk = await unwrapPrivateKey(
            user.encryptedPrivateKey,
            user.keySalt,
            password
          );
          if (privateKeyJwk) break;
          if (attempt < 2) {
            console.log(`Key recovery attempt ${attempt} failed, retrying...`);
            await new Promise(r => setTimeout(r, 500));
          }
        }

        if (privateKeyJwk) {
          storePrivateKey(user._id, privateKeyJwk);
          console.log("Private key recovered successfully ✅");
          return; // Done — key recovered from server
        }

        // CRITICAL: Do NOT generate new keys here!
        // The server already has a public key that was used to encrypt
        // existing messages. Generating a new key pair would overwrite
        // the public key and make ALL old messages permanently unreadable.
        console.error("Failed to recover private key from server. Old messages cannot be decrypted on this device.");
        toast.error(
          "Could not recover encryption keys. Your old messages cannot be decrypted on this device. Try logging in again.",
          { duration: 8000 }
        );
        return; // Do NOT fall through to key generation
      }

      // Step 3: No key anywhere (fresh account) — generate new pair
      // This ONLY runs when the server has NO existing keys, meaning
      // this is a brand new user who hasn't generated keys yet.
      console.log("Generating new E2EE KeyPair (fresh account)...");
      const { publicKeyJwk, privateKeyJwk } = await generateKeyPair();
      storePrivateKey(user._id, privateKeyJwk);

      // Wrap private key with password for server backup
      const { encryptedPrivateKey, keySalt } = await wrapPrivateKey(privateKeyJwk, password);

      // Save public key + encrypted private key to server
      const res = await axiosInstance.put("/auth/update-profile", {
        publicKey: JSON.stringify(publicKeyJwk),
        encryptedPrivateKey,
        keySalt,
      });
      set({ authUser: res.data });
    } catch (error) {
      console.error("Failed to initialize E2EE keys", error);
    }
  },

  /**
   * Initialize keys when PASSWORD IS NOT AVAILABLE (checkAuth / page refresh).
   * Only tries localStorage — if missing, does NOT generate new keys.
   * Also detects key mismatch and warns the user.
   */
  initKeysFromLocal: async (user) => {
    try {
      if (!user) return;
      const hasLocalKey = await getLocalPrivateKey(user._id);

      if (hasLocalKey && user.publicKey) {
        // Verify local key matches server's public key
        const privateKeyJwk = JSON.parse(localStorage.getItem(`privateKey_${user._id}`));
        if (!doKeysMatch(privateKeyJwk, user.publicKey)) {
          console.warn("⚠️ Local private key doesn't match server's public key. Please log out and log back in to re-sync.");
          toast.error("Encryption key mismatch detected. Please log out and log back in to fix this.", { duration: 6000 });
        }
      } else if (!hasLocalKey && user.encryptedPrivateKey) {
        // Key exists on server but we can't decrypt without password.
        // User will need to re-login to recover their keys.
        console.warn("Private key not in localStorage. Please re-login to recover encryption keys.");
        toast.error("Encryption keys missing on this device. Please log out and log back in to decrypt messages.", { duration: 6000 });
      } else if (!hasLocalKey && !user.publicKey) {
        // No key anywhere and no password — can't do anything.
        // Keys will be generated on next login.
        console.log("No E2EE keys found. They will be generated on next login.");
      }
    } catch (error) {
      console.error("Failed to check local E2EE keys", error);
    }
  },
}));
