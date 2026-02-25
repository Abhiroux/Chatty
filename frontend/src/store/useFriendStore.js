import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useFriendStore = create((set) => ({
  searchResults: [],
  friendRequests: [],
  sentRequests: [],
  isSearching: false,
  isLoadingRequests: false,
  
  searchUsers: async (query) => {
    if (!query) {
      set({ searchResults: [] });
      return;
    }
    set({ isSearching: true });
    try {
      const res = await axiosInstance.get(`/user/search?query=${query}`);
      set({ searchResults: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Error searching users");
    } finally {
      set({ isSearching: false });
    }
  },

  getFriendRequests: async () => {
    set({ isLoadingRequests: true });
    try {
      const res = await axiosInstance.get("/user/requests");
      set({ friendRequests: res.data });
    } catch (error) {
      toast.error("Error fetching friend requests");
    } finally {
      set({ isLoadingRequests: false });
    }
  },

  getSentRequests: async () => {
    try {
      const res = await axiosInstance.get("/user/sent-requests");
      set({ sentRequests: res.data });
    } catch (error) {
      console.error(error);
    }
  },

  sendFriendRequest: async (userId) => {
    try {
      const res = await axiosInstance.post(`/user/request/${userId}`);
      toast.success(res.data.message);
      // update sent requests locally
      set((state) => ({ sentRequests: [...state.sentRequests, { _id: userId }] }));
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send request");
    }
  },

  acceptFriendRequest: async (userId, onSuccess) => {
    try {
      const res = await axiosInstance.post(`/user/accept/${userId}`);
      toast.success(res.data.message);
      // remove from requests
      set((state) => ({
        friendRequests: state.friendRequests.filter((r) => r._id !== userId)
      }));
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to accept request");
    }
  },

  rejectFriendRequest: async (userId) => {
    try {
      const res = await axiosInstance.post(`/user/reject/${userId}`);
      toast.success(res.data.message);
      set((state) => ({
        friendRequests: state.friendRequests.filter((r) => r._id !== userId)
      }));
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to reject request");
    }
  },
  
  clearSearch: () => set({ searchResults: [] }),
}));
