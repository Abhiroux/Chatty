import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { playSend, playReceive, playNotification } from "../lib/sounds";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupsLoading: false,
  isGroupMessagesLoading: false,

  // Fetch all groups the user belongs to
  getMyGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/group");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  // Create a new group
  createGroup: async ({ name, description, memberIds, groupPic }) => {
    try {
      const res = await axiosInstance.post("/group", {
        name,
        description,
        memberIds,
        groupPic,
      });
      set((state) => ({ groups: [res.data, ...state.groups] }));
      toast.success("Group created!");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create group");
      return null;
    }
  },

  // Fetch messages for a group
  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/group/${groupId}/messages`);
      set({ groupMessages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load messages");
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  // Send a message to a group
  sendGroupMessage: async (messageData) => {
    const { selectedGroup, groupMessages } = get();
    if (!selectedGroup) return;

    try {
      const res = await axiosInstance.post(
        `/group/${selectedGroup._id}/messages`,
        messageData
      );
      // Don't duplicate — socket "newGroupMessage" will NOT fire for sender
      // because io.to(room) includes sender. We add it manually here.
      // Actually socket.io room broadcast DOES include sender, so we need to 
      // avoid duplicates. We'll add the message here and filter in subscribe.
      set({ groupMessages: [...groupMessages, res.data] });
      playSend();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send message");
    }
  },

  // Get group details
  getGroupDetails: async (groupId) => {
    try {
      const res = await axiosInstance.get(`/group/${groupId}`);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load group details");
      return null;
    }
  },

  // Leave a group
  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.post(`/group/${groupId}/leave`);
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
        groupMessages: state.selectedGroup?._id === groupId ? [] : state.groupMessages,
      }));
      toast.success("Left group");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to leave group");
    }
  },

  // Add members (admin only)
  addGroupMembers: async (groupId, memberIds) => {
    try {
      const res = await axiosInstance.post(`/group/${groupId}/members`, { memberIds });
      // Update the group in the list
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
      }));
      toast.success("Members added!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add members");
    }
  },

  // Remove a member (admin only)
  removeGroupMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.delete(`/group/${groupId}/members/${userId}`);
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
      }));
      toast.success("Member removed");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove member");
    }
  },

  // Subscribe to real-time group events via socket
  subscribeToGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Remove existing listeners
    socket.off("newGroupMessage");
    socket.off("addedToGroup");
    socket.off("removedFromGroup");
    socket.off("groupUpdated");
    socket.off("groupDeleted");

    // New group message
    socket.on("newGroupMessage", (message) => {
      const { selectedGroup } = get();
      const { authUser } = useAuthStore.getState();

      // Skip messages sent by us (we already added them in sendGroupMessage)
      if (message.senderId?._id === authUser._id || message.senderId === authUser._id) {
        return;
      }

      if (selectedGroup && message.groupId === selectedGroup._id) {
        playReceive();
        set((state) => ({
          groupMessages: [...state.groupMessages, message],
        }));
      } else {
        playNotification();
      }
    });

    // Added to a new group
    socket.on("addedToGroup", (group) => {
      set((state) => {
        if (!state.groups.find((g) => g._id === group._id)) {
          playNotification();
          toast.success(`You were added to "${group.name}"`);
          return { groups: [group, ...state.groups] };
        }
        return state;
      });
    });

    // Removed from a group
    socket.on("removedFromGroup", ({ groupId }) => {
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
        groupMessages: state.selectedGroup?._id === groupId ? [] : state.groupMessages,
      }));
      toast("You were removed from a group", { icon: "👋" });
    });

    // Group updated (members changed, name changed, etc.)
    socket.on("groupUpdated", (updatedGroup) => {
      set((state) => ({
        groups: state.groups.map((g) =>
          g._id === updatedGroup._id ? updatedGroup : g
        ),
        selectedGroup:
          state.selectedGroup?._id === updatedGroup._id
            ? updatedGroup
            : state.selectedGroup,
      }));
    });

    // Group deleted
    socket.on("groupDeleted", ({ groupId }) => {
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
        groupMessages: state.selectedGroup?._id === groupId ? [] : state.groupMessages,
      }));
    });
  },

  // Unsubscribe from group events
  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newGroupMessage");
      socket.off("addedToGroup");
      socket.off("removedFromGroup");
      socket.off("groupUpdated");
      socket.off("groupDeleted");
    }
  },

  // Set selected group (and clear selected user in chat store)
  setSelectedGroup: (group) => {
    set({ selectedGroup: group, groupMessages: [] });
  },
}));
