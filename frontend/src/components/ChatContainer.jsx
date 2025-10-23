import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
// Removed unused import of 'Gemini'

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      <ChatHeader />

      <div className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900  bg-cover bg-center bg-no-repeat relative"
        style={{
    backgroundImage: "url('/chatimage.png')",
  }}
      >
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => {
              const isSender = msg.senderId === authUser._id;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`relative px-4 py-3 rounded-2xl shadow-md max-w-xs sm:max-w-sm md:max-w-md break-words transition-all duration-200 
                      ${isSender
                        ? "bg-cyan-600 text-white rounded-br-none hover:bg-cyan-500"
                        : "bg-slate-800 text-slate-100 rounded-bl-none hover:bg-slate-700"
                      }`}
                  >
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Shared"
                        className="rounded-lg mb-2 w-full max-h-56 object-cover border border-slate-700"
                      />
                    )}
                    {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                    <p className="text-[11px] text-gray-300 mt-1 text-right opacity-70">
                      {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        )}
      </div>

      <div className="border-t border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <MessageInput />
      </div>
    </div>
  );
}

export default ChatContainer;
