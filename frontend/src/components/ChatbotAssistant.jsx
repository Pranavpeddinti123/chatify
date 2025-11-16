import { useState, useRef, useEffect } from "react";
import { SparklesIcon, SendIcon, XIcon } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

function ChatbotAssistant({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      _id: "initial-bot-message",
      senderId: "chatbot-user",
      text: "👋 Hey! I'm Chatify AI Assistant. I can help you with questions about your profile, contacts, chats, and more. What would you like to know?",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Add user message to chat
    const userMessage = {
      _id: `user-${Date.now()}`,
      senderId: "user",
      text: inputText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Send query to RAG API
      const response = await axiosInstance.post("/rag/chat", {
        query: inputText,
      });

      const botMessage = {
        _id: `bot-${Date.now()}`,
        senderId: "chatbot-user",
        text: response.data.response,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error communicating with chatbot:", error);
      toast.error("Failed to get response from AI assistant");

      const errorMessage = {
        _id: `error-${Date.now()}`,
        senderId: "chatbot-user",
        text: "Sorry, I encountered an error. Please try again later.",
        isError: true,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-[#0b141a] rounded-2xl shadow-2xl border border-cyan-500/30 flex flex-col z-40">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-cyan-500/30 p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-cyan-400 font-semibold">AI Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-[#374045] scrollbar-track-[#0b141a]">
        {messages.map((msg) => {
          const isBot = msg.senderId === "chatbot-user";
          const isUser = msg.senderId === "user";

          return (
            <div
              key={msg._id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg text-sm leading-relaxed ${
                  isUser
                    ? "bg-cyan-600 text-white rounded-br-none"
                    : isBot
                    ? "bg-blue-900/50 text-slate-100 border border-blue-400/30 rounded-bl-none"
                    : "bg-red-800/70 text-slate-100 rounded-bl-none"
                } ${msg.isError ? "bg-red-800/70" : ""}`}
              >
                {msg.text}
                <p className="text-[10px] text-gray-300 mt-1 opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-lg bg-blue-900/50 border border-blue-400/30 rounded-bl-none">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75" />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-cyan-500/30 p-3 flex gap-2 bg-[#202c33]"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask me anything..."
          disabled={isLoading}
          className="flex-1 bg-[#2a3942] text-white rounded-full px-4 py-2 focus:outline-none placeholder:text-slate-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>

      {/* Footer Info */}
      <div className="px-3 py-2 text-center text-[11px] text-slate-500 bg-[#0a0f14] rounded-b-2xl">
        Powered by AI • Your data stays private
      </div>
    </div>
  );
}

export default ChatbotAssistant;
