import mongoose from "mongoose";

const statusSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ["image", "video"], required: true },
  publicId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: "24h" },
});

const Status = mongoose.model("Status", statusSchema);
export default Status;
