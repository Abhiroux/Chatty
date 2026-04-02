import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { playSend, playReceive, playNotification } from "../lib/sounds";
import { showMessageNotification } from "../lib/notifications";
import {
  generateSessionKey,
  encryptText,
  decryptText,
  encryptSessionKey,
  decryptSessionKey,
  importPublicKey,
  getLocalPrivateKey,
} from "../lib/crypto";

const processDecryption = async (message, privateKey, myId) => {
  if (!message.iv || !message.text) return message;

  try {
    const encryptedKeyBase64 = message.senderId.toString() === myId.toString() ? message.senderKey : message.receiverKey;
    
    if (!encryptedKeyBase64 || !privateKey) {
        return { ...message, text: "[Cannot decrypt message: Missing Keys]" };
    }

    const sessionKey = await decryptSessionKey(encryptedKeyBase64, privateKey);
    if (!sessionKey) {
        return { ...message, text: "[Cannot decrypt message: Invalid Key]" };
    }
    
    // Decrypt text — create a new object to avoid mutating state
    const decryptedMessage = { ...message };
    if (message.text) {
      decryptedMessage.text = await decryptText(message.text, message.iv, sessionKey);
    }
    return decryptedMessage;
  } catch(error) {
    console.log("Error decrypting message", error);
    return { ...message, text: "[Message could not be decrypted]" };
  }
};

export const useChatStore = create((set, get) => ({
  messages: [], // Array to store chat messages
  users: [], // Array to store list of users
  selectedUser: null, // Currently selected user for chatting
  unreadCounts: {}, // Map of user._id to unread message count
  isUsersLoading: false, // Loading state for fetching users
  isMessagesLoading: false, // Loading state for fetching messages

  // Fetch all available users
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/message/users");
      set((state) => {
        const newUnread = { ...state.unreadCounts };
        res.data.forEach((user) => {
          // Sync with database offline unread counts
          if (user.unreadCount !== undefined) {
             newUnread[user._id] = Math.max(newUnread[user._id] || 0, user.unreadCount);
          }
        });
        return { users: res.data, unreadCounts: newUnread };
      });
    } catch (error) {
      toast.error(error.response?.data?.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Fetch messages for a specific user
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/message/${userId}`);
      
      const { authUser } = useAuthStore.getState();
      const privateKey = await getLocalPrivateKey(authUser._id);
      
      const decryptedMessages = await Promise.all(
        res.data.map((msg) => processDecryption(msg, privateKey, authUser._id))
      );

      set({ messages: decryptedMessages });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send a message to the selected user
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();

    try {
      let payload = { ...messageData };
      if (messageData.text) {
        // Encrypt the message text
        const sessionKey = await generateSessionKey();
        const { cipherText, iv } = await encryptText(messageData.text, sessionKey);
        
        // Import public keys
        const myPubKey = await importPublicKey(authUser.publicKey);
        let theirPubKey = null;
        if (selectedUser.publicKey) {
          theirPubKey = await importPublicKey(selectedUser.publicKey);
        }

        // Encrypt the AES key for both users
        const senderKey = await encryptSessionKey(sessionKey, myPubKey);
        let receiverKey = senderKey; // fallback
        if (theirPubKey) {
          receiverKey = await encryptSessionKey(sessionKey, theirPubKey);
        }

        payload = {
          ...payload,
          text: cipherText, // text is now encrypted
          senderKey,
          receiverKey,
          iv,
        };
      }

      const res = await axiosInstance.post(`/message/${selectedUser._id}`, payload);
      
      // Decrypt our own just sent message so we can render it correctly instantly
      const privateKey = await getLocalPrivateKey(authUser._id);
      const decryptedSentMessage = await processDecryption(res.data, privateKey, authUser._id);
      
      set({ messages: [...messages, decryptedSentMessage] });
      playSend();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // Subscribe to real-time messages via socket
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // First remove any existing listener to avoid duplicates
    socket.off("newMessage");

    // Listen for incoming messages
    socket.on("newMessage", async (newMessage) => {
      const { selectedUser, users } = get();
      const { authUser } = useAuthStore.getState();
      
      const privateKey = await getLocalPrivateKey(authUser._id);
      const decryptedMessage = await processDecryption(newMessage, privateKey, authUser._id);
      
      const isForSelectedUser = selectedUser && newMessage.senderId === selectedUser._id;
      
      if (!isForSelectedUser) {
        // Find sender info from users list to show in notification
        const sender = users.find(u => u._id === newMessage.senderId);
        playNotification();
        
        // Increment unread count
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [newMessage.senderId]: (state.unreadCounts[newMessage.senderId] || 0) + 1
          }
        }));

        if (sender) {
            showMessageNotification(sender.fullName, decryptedMessage.text, sender.profilePic, () => {
                get().setSelectedUser(sender);
            });
        }
        return;
      }
      
      // It is the selected user
      playReceive();
      
      // If document is hidden, show browser notification even for selected user
      if (document.hidden) {
          const sender = users.find(u => u._id === newMessage.senderId) || selectedUser;
          showMessageNotification(sender.fullName, decryptedMessage.text, sender.profilePic, () => {
              window.focus();
          });
      }
      
      set({ messages: [...get().messages, decryptedMessage] });
    });
  },

  // Unsubscribe from real-time messages
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },

  // Set the currently selected user and clear their unread count
  setSelectedUser: (selectedUser) => set((state) => ({ 
    selectedUser,
    unreadCounts: {
      ...state.unreadCounts,
      [selectedUser ? selectedUser._id : "none"]: 0
    }
  })),
}));
