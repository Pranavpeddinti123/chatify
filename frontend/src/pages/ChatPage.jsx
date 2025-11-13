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

// ✅ NEW: Single merged Status component
import StatusStories from "../components/StatusStories";

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
            bg-black
            border-r border-gray-800
            flex flex-col transform transition-transform duration-300 z-20
            ${isMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <ProfileHeader />
          <ActiveTabSwitch />

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeTab === "chats" && <ChatsList />}
            {activeTab === "contacts" && <ContactList />}
            {activeTab === "status" && <StatusStories />}
          </div>
        </div>

        {/* OVERLAY for mobile */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-10 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* RIGHT SIDE */}
        <div className="flex-1 flex flex-col bg-black text-slate-200 relative overflow-hidden">
          {/* Menu button only on mobile */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="absolute top-4 left-4 md:hidden p-2 rounded-full 
              bg-gray-800 hover:bg-gray-700 text-gray-300
              shadow-md transition z-30"
          >
            <Menu size={22} />
          </button>

          {activeTab === "status" ? (
            <NoConversationPlaceholder />
          ) : selectedUser ? (
            <ChatContainer />
          ) : (
            <NoConversationPlaceholder />
          )}
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}

export default ChatPage;
