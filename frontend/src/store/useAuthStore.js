import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = "http://localhost:5001";

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

  // Check if user is authenticated
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // Sign up new user
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      console.log(res);
      set({
        pendingUserId: res.data.userId,
        needsOTP: true,
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
    const { pendingUserId } = get();

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

      toast.success("Accound Verified Successfully");
      get().connectSocket();
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

  // Log in existing user
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      if (error.response?.status === 403) {
        set({
          needsOTP: true,
          pendingUserId: error.response.data.userId || null,
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
      set({ authUser: null });
      toast.success("Logout Successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error("Something went wrong");
      console.log(error.response.data.message);
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
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
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
}));
