import { useChatStore } from "../store/useChatStore";
import { useStatusStore } from "../store/useStatusStore";
import { useEffect } from "react";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();
  const { fetchStatuses } = useStatusStore();

  // Fetch statuses whenever the status tab is active
  useEffect(() => {
    if (activeTab === "status") {
      fetchStatuses();
    }
  }, [activeTab, fetchStatuses]);

  return (
    <div className="tabs tabs-boxed bg-transparent p-2 m-2">
      <button
        onClick={() => setActiveTab("chats")}
        className={`tab ${
          activeTab === "chats"
            ? "bg-cyan-500/20 text-cyan-400"
            : "text-slate-400"
        }`}
      >
        Chats
      </button>

      <button
        onClick={() => setActiveTab("contacts")}
        className={`tab ${
          activeTab === "contacts"
            ? "bg-cyan-500/20 text-cyan-400"
            : "text-slate-400"
        }`}
      >
        Contacts
      </button>

      <button
        onClick={() => setActiveTab("status")}
        className={`tab ${
          activeTab === "status"
            ? "bg-cyan-500/20 text-cyan-400"
            : "text-slate-400"
        }`}
      >
        Status
      </button>
    </div>
  );
}

export default ActiveTabSwitch;
