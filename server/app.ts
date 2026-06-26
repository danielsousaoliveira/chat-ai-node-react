import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import chatRoutes from "./routes/chat";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

export default app;
