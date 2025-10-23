import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";

function ChatsList() {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  return (
    <div className="bg-[#111b21] h-full overflow-y-auto">
      {chats.map((chat) => (
        <div
          key={chat._id}
          onClick={() => setSelectedUser(chat)}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#202c33] transition-colors"
        >
          {/* Avatar + Online Dot */}
          <div className="relative min-w-[44px]">
            <img
              src={chat.profilePic || "/avatar.png"}
              alt={chat.fullName}
              className="w-11 h-11 rounded-full object-cover"
            />
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111b21] ${
                onlineUsers.includes(chat._id) ? "bg-green-500" : "bg-gray-500"
              }`}
            ></span>
          </div>

          {/* Chat Text */}
          <div className="flex-1 min-w-0 border-b border-[#2f3b43] pb-2">
            <div className="flex justify-between items-center">
              <h4 className="text-slate-100 text-[15px] font-medium truncate leading-tight">
                {chat.fullName}
              </h4>
              <span className="text-[11px] text-slate-400">12:45 PM</span>
            </div>
            <p className="text-[13px] text-slate-400 truncate leading-snug">
              Tap to chat
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatsList;
