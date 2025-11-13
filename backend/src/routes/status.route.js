import express from "express";
import multer from "multer";
import {
  uploadStatus,
  getStatuses,
  deleteStatus
} from "../controllers/status.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 }, // 20MB limit
});

router.post("/upload", protectRoute, upload.single("media"), uploadStatus);
router.get("/", protectRoute, getStatuses);
router.delete("/:id", protectRoute, deleteStatus); // ✅ manual delete

export default router;
