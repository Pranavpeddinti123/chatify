import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <div className="h-full overflow-y-auto p-3 bg-gradient-to-b from-[#06080f] via-[#0a1018] to-[#0e1522] scrollbar-thin scrollbar-thumb-[#22303f]/70 scrollbar-track-transparent">
      {allContacts.map((contact) => (
        <div
          key={contact._id}
          className="flex items-center gap-3 px-4 py-3 mb-1 rounded-xl cursor-pointer
                     bg-transparent hover:bg-[#0e1b26]/70 hover:shadow-[0_0_10px_rgba(0,255,255,0.25)]
                     border border-transparent hover:border-cyan-500/20 transition-all duration-300 group"
          onClick={() => setSelectedUser(contact)}
        >
          {/* Avatar + Status Dot */}
          <div className="relative">
            <img
              src={contact.profilePic || "/avatar.png"}
              alt={contact.fullName}
              className="w-12 h-12 rounded-full object-cover border border-cyan-500/20
                         shadow-[0_0_10px_rgba(0,255,255,0.15)] transition-transform duration-300 group-hover:scale-[1.05]"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-[2px] border-[#0e1522] 
                ${onlineUsers.includes(contact._id)
                  ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(0,255,150,0.6)]"
                  : "bg-slate-600/70"}`}
            ></span>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col flex-1 min-w-0 border-b border-[#1b2838]/40 pb-2">
            <h4 className="text-slate-100 font-medium truncate group-hover:text-cyan-400 transition-colors">
              {contact.fullName}
            </h4>
            <p className="text-slate-500 text-sm truncate group-hover:text-slate-300/90 transition-colors">
              Tap to chat
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ContactList;
