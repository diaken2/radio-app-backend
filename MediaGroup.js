import mongoose from "mongoose";

const mediaGroupSchema = new mongoose.Schema({
  name: String,
  media: Array,
  rotationType: {
    type: String,
    enum: ["random", "sequential"],
    default: "sequential",
  },
  durationInHours: Number,
  startTime: Date, // если хотим задать точное время старта
});

export default mongoose.model("MediaGroup", mediaGroupSchema);
