// models/Genre.js
import mongoose from "mongoose";

const GenreSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

export default mongoose.model("Genre", GenreSchema);
