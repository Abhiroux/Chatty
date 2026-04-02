import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { playNotification } from "../lib/sounds";
import { showFriendRequestNotification, showFriendAcceptedNotification } from "../lib/notifications";

export const useConnectionStore = create((set, get) => ({
  friends: [],
  friendRequests: [],
  sentRequests: [],
  searchResults: [],
  isLoading: false,

  getFriends: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/user/friends");
      set({ friends: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load friends");
    } finally {
      set({ isLoading: false });
    }
  },

  getFriendRequests: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/user/requests");
      set({ friendRequests: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load requests");
    } finally {
      set({ isLoading: false });
    }
  },

  getSentRequests: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/user/sent-requests");
      set({ sentRequests: res.data });
    } catch (error) {
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  },

  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/user/search?query=${query}`);
      set({ searchResults: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Search failed");
    } finally {
      set({ isLoading: false });
    }
  },

  sendRequest: async (userId) => {
    try {
      await axiosInstance.post(`/user/request/${userId}`);
      toast.success("Request sent!");
      get().getSentRequests();
      // Optimistically update search results
      set((state) => ({
        searchResults: state.searchResults.map((user) => 
          user._id === userId ? { ...user, requestSent: true } : user
        )
      }));
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send request");
    }
  },

  acceptRequest: async (userId) => {
    try {
      const res = await axiosInstance.post(`/user/accept/${userId}`);
      toast.success("Request accepted!");
      set((state) => ({
        friendRequests: state.friendRequests.filter((user) => user._id !== userId),
        friends: [...state.friends, res.data.newFriend]
      }));
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to accept request");
    }
  },

  rejectRequest: async (userId) => {
    try {
      await axiosInstance.post(`/user/reject/${userId}`);
      toast.success("Request rejected");
      set((state) => ({
        friendRequests: state.friendRequests.filter((user) => user._id !== userId)
      }));
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to reject request");
    }
  },

  cancelRequest: async (userId) => {
    try {
      await axiosInstance.delete(`/user/cancel/${userId}`);
      toast.success("Request cancelled");
      set((state) => ({
        sentRequests: state.sentRequests.filter((user) => user._id !== userId)
      }));
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to cancel request");
    }
  },

  subscribeToFriendEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newFriendRequest", (data) => {
      set((state) => {
        if (!state.friendRequests.find((req) => req._id === data._id)) {
          playNotification();
          showFriendRequestNotification(data.fullName, data.profilePic);
          return { friendRequests: [...state.friendRequests, data] };
        }
        return state;
      });
    });

    socket.on("friendRequestAccepted", (data) => {
      set((state) => {
        if (!state.friends.find((f) => f._id === data._id)) {
          playNotification();
          showFriendAcceptedNotification(data.fullName, data.profilePic);
          toast.success(`${data.fullName} accepted your friend request!`);
          return {
            friends: [...state.friends, data],
            sentRequests: state.sentRequests.filter((id) => id !== data._id && id._id !== data._id)
          };
        }
        return state;
      });
    });
  },

  unsubscribeFromFriendEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newFriendRequest");
      socket.off("friendRequestAccepted");
    }
  }
}));
