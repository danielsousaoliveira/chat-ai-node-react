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

function buildMessages(history: StoredMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
    return [
        { role: "system", content: "You are a helpful assistant." },
        ...history.map((m) => ({
            role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
            content: m.content,
        })),
    ];
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
        let messages: StoredMessage[] = chatHistory ? decryptMessages(chatHistory.encryptedMessages) : [];

        const userMessage: StoredMessage = { content: message, sender: "user" };
        messages.push(userMessage);

        // SSE headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: buildMessages(messages),
            stream: true,
        });

        let botResponse = "";
        for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content ?? "";
            if (token) {
                botResponse += token;
                res.write(`data: ${JSON.stringify({ token })}\n\n`);
            }
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();

        // Persist the complete exchange
        const botMessage: StoredMessage = { content: botResponse, sender: "bot" };
        messages.push(botMessage);
        const encryptedMessages = encryptMessages(messages);

        if (chatHistory) {
            chatHistory.encryptedMessages = encryptedMessages;
            await chatHistory.save();
        } else {
            chatHistory = new ChatHistory({ userId: req.user.userId, encryptedMessages });
            await chatHistory.save();
        }
    } catch (error) {
        console.error("Error processing message:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to process message" });
        } else {
            res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
            res.end();
        }
    }
});

export default router;
