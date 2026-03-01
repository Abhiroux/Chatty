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
} from "../lib/crypto";

const BASE_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

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
   */
  initKeysWithPassword: async (user, password) => {
    try {
      if (!user || !password) return;

      // Step 1: Check localStorage
      let hasLocalKey = await getLocalPrivateKey(user._id);

      if (hasLocalKey) {
        // We already have the private key locally. But if the server
        // doesn't have the wrapped backup yet, upload it now.
        if (!user.encryptedPrivateKey) {
          console.log("Backing up private key to server...");
          const privateKeyJwk = JSON.parse(localStorage.getItem(`privateKey_${user._id}`));
          const { encryptedPrivateKey, keySalt } = await wrapPrivateKey(privateKeyJwk, password);
          const res = await axiosInstance.put("/auth/update-profile", {
            encryptedPrivateKey,
            keySalt,
            publicKey: user.publicKey || undefined,
          });
          set({ authUser: res.data });
        }
        return; // Done — local key is ready
      }

      // Step 2: Try to recover from server
      if (user.encryptedPrivateKey && user.keySalt) {
        console.log("Recovering private key from server...");
        const privateKeyJwk = await unwrapPrivateKey(
          user.encryptedPrivateKey,
          user.keySalt,
          password
        );

        if (privateKeyJwk) {
          storePrivateKey(user._id, privateKeyJwk);
          console.log("Private key recovered successfully ✅");
          return; // Done — key recovered from server
        }
        console.warn("Failed to unwrap key — password may have changed. Generating new keys.");
      }

      // Step 3: No key anywhere — generate fresh pair
      console.log("Generating new E2EE KeyPair...");
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
   */
  initKeysFromLocal: async (user) => {
    try {
      if (!user) return;
      const hasLocalKey = await getLocalPrivateKey(user._id);

      if (!hasLocalKey && user.encryptedPrivateKey) {
        // Key exists on server but we can't decrypt without password.
        // User will need to re-login to recover their keys.
        console.warn("Private key not in localStorage. Please re-login to recover encryption keys.");
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
