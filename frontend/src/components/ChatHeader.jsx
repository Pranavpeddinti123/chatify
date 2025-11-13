import { useState, useEffect } from "react";
import { XIcon, PhoneIcon, VideoIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { startCall } = useCallStore();

  const [isImageOpen, setIsImageOpen] = useState(false);
  const isOnline = onlineUsers.includes(selectedUser._id);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (isImageOpen) setIsImageOpen(false);
        else setSelectedUser(null);
      }
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser, isImageOpen]);

  return (
    <>
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-[#0d1117] border-b border-gray-800 max-h-[84px] px-6 flex-1 relative">
        <div className="flex items-center space-x-3">
          <div
            className="relative cursor-pointer group"
            onClick={() => setIsImageOpen(true)}
          >
            <img
              src={selectedUser.profilePic || "/avatar.png"}
              alt={selectedUser.fullName}
              className="w-12 h-12 rounded-full object-cover border border-gray-700 group-hover:opacity-80 transition"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0d1117] ${
                isOnline ? "bg-green-500" : "bg-gray-500"
              }`}
            ></span>
          </div>
          <div>
            <h3 className="text-slate-200 font-medium">{selectedUser.fullName}</h3>
            <p className="text-slate-400 text-sm">{isOnline ? "Online" : "Offline"}</p>
          </div>
        </div>

        {/* Right side buttons */}
        <div className="flex gap-3 items-center">
          {isOnline && (
            <>
              <button
                title="Video Call"
                onClick={() => startCall({ userId: selectedUser._id, type: "video" })}
                className="text-cyan-400 hover:text-cyan-200"
              >
                <VideoIcon className="w-6 h-6" />
              </button>
              <button
                title="Audio Call"
                onClick={() => startCall({ userId: selectedUser._id, type: "audio" })}
                className="text-cyan-400 hover:text-cyan-200"
              >
                <PhoneIcon className="w-6 h-6" />
              </button>
            </>
          )}
          <button onClick={() => setSelectedUser(null)}>
            <XIcon className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer" />
          </button>
        </div>
      </div>

      {/* Image Modal */}
      {isImageOpen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setIsImageOpen(false)}
        >
          <div className="relative">
            <img
              src={selectedUser.profilePic || "/avatar.png"}
              alt="Profile Preview"
              className="max-w-[90vw] max-h-[90vh] rounded-lg object-contain shadow-2xl border border-gray-800"
            />
            <button
              className="absolute top-2 right-2 text-gray-300 hover:text-white bg-black/60 rounded-full p-1"
              onClick={() => setIsImageOpen(false)}
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatHeader;
