import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    encryptedMessages: { type: String, required: true },
});

export default mongoose.model("ChatHistory", chatHistorySchema);
