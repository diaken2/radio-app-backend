// models/MediaFile.js
import mongoose from "mongoose";

const mediaFileSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "gif", "video"], required: true },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaGroup",
      default: null,
    },
    width: Number,
    height: Number,
    orderIndex: Number, // для сортировки при последовательной прокрутке
  },
  { timestamps: true }
);

export default mongoose.model("MediaFile", mediaFileSchema);
