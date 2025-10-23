import { useState } from "react";
import { Menu } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative w-full max-w-6xl h-[800px]">
      <BorderAnimatedContainer>
        {/* LEFT SIDE */}
        <div
          className={`
            fixed md:static top-0 left-0 h-full w-64 
            bg-slate-800/60 backdrop-blur-md 
            flex flex-col transform transition-transform duration-300 z-20
            ${isMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <ProfileHeader />
          <ActiveTabSwitch />
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>

        {/* OVERLAY for mobile */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* RIGHT SIDE */}
        <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm relative">
          {/* Menu button only on mobile */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="absolute top-4 left-4 md:hidden p-2 rounded-full bg-slate-700/70 hover:bg-slate-600 transition z-30"
          >
            <Menu size={22} />
          </button>

          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}

export default ChatPage;
