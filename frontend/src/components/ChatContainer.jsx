import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import NoConversationPlaceholder from "./NoConversationPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

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
    if (selectedUser?._id) {
      getMessagesByUserId(selectedUser._id);
      subscribeToMessages();
      return () => unsubscribeFromMessages();
    }
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 🧠 Condition: show background image only if there are messages
  const chatHasMessages = messages && messages.length > 0 && !isMessagesLoading;

  return (
    <div className="flex flex-col h-full bg-[#0b141a]">
      <ChatHeader />

      {/* Chat Area */}
      <div
        className={`flex-1 px-3 sm:px-5 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-[#374045] scrollbar-track-[#0b141a] ${
          chatHasMessages ? "bg-cover bg-center bg-no-repeat" : ""
        }`}
        style={
          chatHasMessages
            ? { backgroundImage: "url('/chatimage.png')" }
            : { backgroundColor: "#0b141a" }
        }
      >
        {/* CASE 1: Messages exist */}
        {chatHasMessages ? (
          <div className="max-w-3xl mx-auto space-y-2">
            {messages.map((msg) => {
              const isSender = msg.senderId === authUser._id;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`relative px-3 py-2 rounded-lg shadow-sm max-w-xs sm:max-w-sm md:max-w-md break-words text-sm leading-relaxed transition-all duration-150 ${
                      isSender
                        ? "bg-[#005c4b] text-white rounded-br-none hover:bg-[#01694d]"
                        : "bg-[#202c33] text-slate-100 rounded-bl-none hover:bg-[#2a3942]"
                    }`}
                  >
                    {/* Image Message */}
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Shared"
                        className="rounded-md mb-1 w-full max-h-52 object-cover border border-[#2f3b43]"
                      />
                    )}

                    {/* Text Message */}
                    {msg.text && <p>{msg.text}</p>}

                    {/* Time */}
                    <p className="text-[10px] text-gray-300 mt-1 text-right opacity-70">
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
          // CASE 2: Messages loading
          <MessagesLoadingSkeleton />
        ) : selectedUser ? (
          // CASE 3: No chat history yet
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        ) : (
          // CASE 4: No conversation selected
          <NoConversationPlaceholder />
        )}
      </div>

      {/* Message Input */}
      {selectedUser && (
        <div className="border-t border-[#2f3b43] bg-[#202c33]">
          <MessageInput />
        </div>
      )}
    </div>
  );
}

export default ChatContainer;
