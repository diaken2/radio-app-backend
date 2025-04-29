import mongoose from "mongoose";

const RadioStreamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    descript: { type: String, required: true },
    genre: { type: String, required: true },
    logo: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("RadioStreams", RadioStreamSchema);
