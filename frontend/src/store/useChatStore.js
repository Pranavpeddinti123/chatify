import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  chatbotMessages: [
    {
      _id: "initial-bot-message",
      senderId: "chatbot-user",
      text: "Hello! I am the Chatify AI Assistant. How can I help you today?",
      createdAt: new Date().toISOString(),
    },
  ],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isBotTyping: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  toggleSound: () => {
    const newValue = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", newValue);
    set({ isSoundEnabled: newValue });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => {
    if (get().selectedUser?._id !== selectedUser?._id) {
      set({ messages: [] }); // Clear messages when user changes
      if (selectedUser?._id !== "chatbot-user") {
        // Optionally reset chatbot messages when switching to a real user
        // set({ chatbotMessages: [] });
      }
    }
    set({ selectedUser });
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    if (userId === "chatbot-user") {
      set({ messages: get().chatbotMessages });
      return;
    }
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    if (selectedUser._id === "chatbot-user") {
      return get().sendQueryToBot(messageData.text);
    }

    const { messages } = get();
    const { authUser } = useAuthStore.getState();

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ messages: [...state.messages, optimisticMessage] }));

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set((state) => ({
        messages: state.messages.map((m) => (m._id === tempId ? res.data : m)),
      }));
    } catch (error) {
      set((state) => ({ messages: state.messages.filter((m) => m._id !== tempId) }));
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  sendQueryToBot: async (query) => {
    const { authUser } = useAuthStore.getState();

    const userMessage = {
      _id: `user-${Date.now()}`,
      senderId: authUser._id,
      text: query,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      chatbotMessages: [...state.chatbotMessages, userMessage],
      isBotTyping: true,
    }));

    try {
      const res = await axiosInstance.post("/rag/chat", { query });

      const botMessage = {
        _id: `bot-${Date.now()}`,
        senderId: "chatbot-user",
        text: res.data.response,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        chatbotMessages: [...state.chatbotMessages, botMessage],
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Error from AI assistant");
      const errorMessage = {
        _id: `error-${Date.now()}`,
        senderId: "chatbot-user",
        text: "Sorry, I am having trouble connecting. Please try again later.",
        isError: true,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        chatbotMessages: [...state.chatbotMessages, errorMessage],
      }));
    } finally {
      set({ isBotTyping: false });
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser || selectedUser._id === "chatbot-user") return;

    const socket = useAuthStore.getState().socket;

    socket.off("newMessage");
    socket.on("newMessage", (newMessage) => {
      if (newMessage.senderId !== selectedUser._id) return;

      set({ messages: [...get().messages, newMessage] });

      if (isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.play().catch((e) => console.warn("Audio play failed:", e));
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },
}));
