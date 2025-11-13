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
    <div className="h-full overflow-y-auto bg-gradient-to-b from-[#06080f] via-[#0a1018] to-[#0e1522] scrollbar-thin scrollbar-thumb-[#22303f]/70 scrollbar-track-transparent">
      {chats.map((chat) => (
        <div
          key={chat._id}
          onClick={() => setSelectedUser(chat)}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer 
                     bg-transparent hover:bg-[#0e1b26]/70 hover:shadow-[0_0_8px_rgba(0,255,255,0.2)] 
                     border-b border-[#1c2630] transition-all duration-300 group"
        >
          {/* Avatar + Online Pulse */}
          <div className="relative min-w-[46px]">
            <img
              src={chat.profilePic || '/avatar.png'}
              alt={chat.fullName}
              className="w-11 h-11 rounded-full object-cover border border-cyan-500/20 
                         shadow-[0_0_10px_rgba(0,255,255,0.15)] transition-transform duration-300 group-hover:scale-[1.05]"
            />
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-[2px] border-[#0e1522] 
                ${onlineUsers.includes(chat._id) ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(0,255,150,0.6)]" : "bg-slate-500/70"}`}
            ></span>
          </div>

          {/* Chat Info */}
          <div className="flex-1 min-w-0 border-b border-[#1b2838]/50 pb-2">
            <div className="flex justify-between items-center">
              <h4 className="text-slate-100 text-[15px] font-medium truncate leading-tight group-hover:text-cyan-400 transition-colors">
                {chat.fullName}
              </h4>
              <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">
                12:45 PM
              </span>
            </div>
            <p className="text-[13px] text-slate-500 truncate leading-snug group-hover:text-slate-300/90 transition-colors">
              Tap to chat
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatsList;
