import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const uri = String(process.env.MONGODB_URI);
mongoose
    .connect(uri)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
