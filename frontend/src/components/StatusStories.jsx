import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useStatusStore } from "../store/useStatusStore";
import { useAuthStore } from "../store/useAuthStore";

const StatusStories = () => {
  const { statuses, fetchStatuses, uploadStatus, deleteStatus } = useStatusStore();
  const { authUser } = useAuthStore();
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  if (!authUser) return null;

  const currentUserStatus = statuses.find((s) => s.userId._id === authUser._id);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      await uploadStatus(file);
      await fetchStatuses();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleDeleteStatus = async () => {
    if (!currentUserStatus || deleting) return;
    try {
      setDeleting(true);
      setSelectedStatus(null);
      await deleteStatus(currentUserStatus._id);
      await fetchStatuses();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleAvatarClick = () => {
    if (!currentUserStatus) {
      fileInputRef.current?.click();
    } else {
      setSelectedStatus(currentUserStatus);
    }
  };

  // Close overlay only if the background is clicked
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedStatus(null);
    }
  };

  // Format timestamp
  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <>
      {/* Current User and Contacts */}
      <div className="p-4 space-y-6">
        {/* Current User */}
        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer" onClick={handleAvatarClick}>
            <div className="w-20 h-20 rounded-full border-4 border-green-500 overflow-hidden">
              <img
                src={currentUserStatus?.mediaUrl || authUser.profilePic || "/avatar.png"}
                alt={authUser.fullName}
                className="w-full h-full object-cover"
              />
            </div>

            {!currentUserStatus && (
              <input
                type="file"
                accept="image/*,video/*"
                ref={fileInputRef}
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
            )}

            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold">
                Uploading...
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <p className="font-semibold text-white">{authUser.fullName}</p>
            {currentUserStatus && (
              <button
                onClick={handleDeleteStatus}
                disabled={deleting}
                className={`text-sm underline mt-1 ${
                  deleting ? "text-gray-400 cursor-not-allowed" : "text-red-500"
                }`}
              >
                {deleting ? "Deleting..." : "Delete Status"}
              </button>
            )}
          </div>
        </div>

        {/* Contacts Status */}
        <div>
          <p className="text-gray-400 text-sm mb-2">Contacts Status</p>
          <div className="flex flex-col gap-4">
            {statuses
              .filter((s) => s.userId._id !== authUser._id)
              .map((s) => (
                <div
                  key={s._id}
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => setSelectedStatus(s)}
                >
                  {/* Profile Circle */}
                  <div className="w-16 h-16 rounded-full border-4 border-green-500 overflow-hidden flex-shrink-0">
                    <img
                      src={s.userId.profilePic || "/avatar.png"}
                      alt={s.userId.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Name + Timestamp */}
                  <div className="flex flex-col">
                    <p className="text-white font-medium capitalize">
                      {s.userId.fullName}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {formatTimestamp(s.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* --- Fullscreen Status Overlay (Using Portal) --- */}
      {selectedStatus &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-transparent backdrop-blur-md"
            onClick={handleOverlayClick}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedStatus(null)}
              className="absolute top-4 right-4 text-white text-5xl z-[10000] rounded-full p-2 leading-none"
            >
              &times;
            </button>

            {/* Media Container */}
            <div className="relative w-full h-full flex items-center justify-center">
              {selectedStatus.mediaType === "video" ? (
                <video
                  src={selectedStatus.mediaUrl}
                  controls
                  autoPlay
                  onClick={(e) => e.stopPropagation()}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <img
                  src={selectedStatus.mediaUrl}
                  alt="status"
                  onClick={(e) => e.stopPropagation()}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default StatusStories;
