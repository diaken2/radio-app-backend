import express from "express";

import cors from "cors";
import mongoose from "mongoose";
import router from "./router.js";
const app = express();
const PORT = process.env.PORT || 8888;
app.use(cors());
app.use(express.json());
app.use("/api", router);

const start = async () => {
  try {
    await mongoose.connect(
      "mongodb://radioapp88:OhBJtQQS4vap2Kw3@ac-njefpke-shard-00-00.oxpuaye.mongodb.net:27017,ac-njefpke-shard-00-01.oxpuaye.mongodb.net:27017,ac-njefpke-shard-00-02.oxpuaye.mongodb.net:27017/?ssl=true&replicaSet=atlas-gjdd1s-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0",
      {}
    );
    app.listen(PORT, () => {
      console.log("Server has been launched on PORT:", PORT);
    });
  } catch (e) {
    console.log(e.message);
    return;
  }
};

start();
