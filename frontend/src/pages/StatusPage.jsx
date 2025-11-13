import React, { useEffect } from "react";
import StatusStories from "../components/StatusStories";
import { useStatusStore } from "../store/useStatusStore";

const StatusPage = () => {
  const fetchStatuses = useStatusStore((s) => s.fetchStatuses);

  // Fetch statuses on mount
  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-2xl font-bold text-center mb-6 text-cyan-400">
        Status Updates
      </h1>
      <StatusStories />
    </div>
  );
};

export default StatusPage;
