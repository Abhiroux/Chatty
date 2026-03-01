import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
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
  isUsersLoading: false, // Loading state for fetching users
  isMessagesLoading: false, // Loading state for fetching messages

  // Fetch all available users
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/message/users");
      set({ users: res.data });
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
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // Subscribe to real-time messages via socket
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    // Listen for incoming messages
    socket.on("newMessage", async (newMessage) => {
      if (newMessage.senderId !== selectedUser._id) return;
      
      const { authUser } = useAuthStore.getState();
      const privateKey = await getLocalPrivateKey(authUser._id);
      const decryptedMessage = await processDecryption(newMessage, privateKey, authUser._id);
      
      set({ messages: [...get().messages, decryptedMessage] });
    });
  },

  // Unsubscribe from real-time messages
  unsubscribeFromMessages: (selectedUser) => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  // Set the currently selected user
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
