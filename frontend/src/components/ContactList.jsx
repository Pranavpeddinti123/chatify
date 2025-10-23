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
    <div className="bg-[#111b21] h-full overflow-y-auto p-2">
      {allContacts.map((contact) => (
        <div
          key={contact._id}
          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-[#202c33] transition-colors"
          onClick={() => setSelectedUser(contact)}
        >
          <div className="relative">
            <img
              src={contact.profilePic || "/avatar.png"}
              alt={contact.fullName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111b21] ${
                onlineUsers.includes(contact._id) ? "bg-green-500" : "bg-gray-500"
              }`}
            ></span>
          </div>

          <div className="flex flex-col flex-1 border-b border-[#2f3b43] pb-2">
            <h4 className="text-slate-100 font-medium">{contact.fullName}</h4>
            <p className="text-slate-400 text-sm truncate">Tap to chat</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ContactList;
