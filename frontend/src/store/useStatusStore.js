import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useStatusStore = create((set, get) => ({
  statuses: [],
  loading: false,

  fetchStatuses: async () => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get("/status");
      set({ statuses: res.data });
    } catch (err) {
      console.error("Fetch statuses error:", err);
    } finally {
      set({ loading: false });
    }
  },

  uploadStatus: async (file) => {
    const currentUserId = JSON.parse(localStorage.getItem("authUser"))?._id;

    const { statuses } = get();

    if (statuses.find(s => s.userId._id === currentUserId)) {
      alert("You can only upload one status at a time.");
      return;
    }

    const formData = new FormData();
    formData.append("media", file);

    try {
      const res = await axiosInstance.post("/status/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Add uploaded status at the top
      set((state) => ({
        statuses: [res.data.status, ...state.statuses],
      }));
    } catch (err) {
      console.error("Upload status error:", err);
    }
  },

  deleteStatus: async (id) => {
    try {
      await axiosInstance.delete(`/status/${id}`);
      set((state) => ({
        statuses: state.statuses.filter(s => s._id !== id),
      }));
    } catch (err) {
      console.error("Delete status error:", err);
    }
  },
}));
