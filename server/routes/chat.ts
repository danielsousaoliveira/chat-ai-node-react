import express, { Request, Response } from "express";
import OpenAI from "openai";
import ChatHistory from "../models/ChatHistory";
import { authenticateToken } from "../authMiddleware";
import { encryptMessages, decryptMessages } from "../utils/encryption";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
    };
}

type StoredMessage = { content: string; sender: "user" | "bot" };

async function callChatGPT(history: StoredMessage[]): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: "You are a helpful assistant." },
        ...history.map((m) => ({
            role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
            content: m.content,
        })),
    ];

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No response from OpenAI");
    return content;
}

router.get("/history", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const chatHistory = await ChatHistory.findOne({ userId: req.user.userId });
        if (chatHistory) {
            const messages = decryptMessages(chatHistory.encryptedMessages);
            res.json(messages);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
});

router.post("/message", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        let chatHistory = await ChatHistory.findOne({ userId: req.user.userId });
        let messages = chatHistory ? decryptMessages(chatHistory.encryptedMessages) : [];

        const userMessage: StoredMessage = { content: message, sender: "user" };
        messages.push(userMessage);

        const botResponse = await callChatGPT(messages);

        const botMessage: StoredMessage = { content: botResponse, sender: "bot" };
        messages.push(botMessage);

        const encryptedMessages = encryptMessages(messages);

        if (chatHistory) {
            chatHistory.encryptedMessages = encryptedMessages;
            await chatHistory.save();
        } else {
            chatHistory = new ChatHistory({
                userId: req.user.userId,
                encryptedMessages,
            });
            await chatHistory.save();
        }

        res.json({ response: botResponse });
    } catch (error) {
        console.error("Error processing message:", error);
        res.status(500).json({ error: "Failed to process message" });
    }
});

export default router;
