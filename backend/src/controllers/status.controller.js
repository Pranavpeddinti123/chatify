import Status from "../models/Status.js";
import cloudinary from "../lib/cloudinary.js";
import fs from "fs";

// Upload Status
export const uploadStatus = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Check if user already uploaded
    const existingStatus = await Status.findOne({ userId: req.user._id });
    if (existingStatus) return res.status(400).json({ message: "You can only upload one status at a time." });

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
      folder: "statuses",
    });

    const status = new Status({
      userId: req.user._id,
      mediaUrl: result.secure_url,
      publicId: result.public_id,
      mediaType: result.resource_type === "video" ? "video" : "image",
    });

    await status.save();
    fs.unlinkSync(req.file.path);

    // Emit to sockets
    req.io.emit("status:new", {
      statusId: status._id,
      userId: req.user._id,
      fullName: req.user.fullName,
      profilePic: req.user.profilePic,
      mediaUrl: status.mediaUrl,
      mediaType: status.mediaType,
    });

    res.json({ success: true, status });
  } catch (err) {
    console.error("Status Upload Error:", err);
    res.status(500).json({ message: "Failed to upload status" });
  }
};

// Get all statuses
export const getStatuses = async (req, res) => {
  try {
    const statuses = await Status.find()
      .populate("userId", "fullName profilePic")
      .sort({ createdAt: -1 });

    res.json(statuses);
  } catch (err) {
    console.error("Fetch Status Error:", err);
    res.status(500).json({ message: "Failed to fetch statuses" });
  }
};

// Delete Status
export const deleteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = await Status.findById(id);
    if (!status) return res.status(404).json({ message: "Status not found" });

    if (status.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await cloudinary.uploader.destroy(status.publicId, {
      resource_type: status.mediaType === "video" ? "video" : "image",
    });

    await Status.findByIdAndDelete(id);

    req.io.emit("status:deleted", { statusId: id, userId: req.user._id });
    res.json({ success: true, message: "Status deleted successfully" });
  } catch (err) {
    console.error("Status Delete Error:", err);
    res.status(500).json({ message: "Failed to delete status" });
  }
};
