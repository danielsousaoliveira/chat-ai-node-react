import express, { Request, Response } from "express";
import ChatHistory from "../models/ChatHistory";
import { authenticateToken } from "../authMiddleware";
import { encryptMessages, decryptMessages } from "../utils/encryption";
import axios from "axios";

const router = express.Router();

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
    };
}

async function callChatGPT(prompt: string) {
    const url = "https://api.openai.com/v1/chat/completions";

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    };

    const data = {
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt },
        ],
    };

    try {
        const response = await axios.post(url, data, { headers });
        const result = response.data.choices[0].message.content;
        return result;
    } catch (error: any) {
        console.error("Error calling ChatGPT API:", error.response ? error.response.data : error.message);
        throw error;
    }
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

        const userMessage = { content: message, sender: "user" };
        messages.push(userMessage);

        const botResponse = await callChatGPT(message);
        //const botResponse = "Hello I am ChatGPT";

        if (!botResponse) {
            throw new Error("No response from OpenAI");
        }

        const botMessage = { content: botResponse, sender: "bot" };
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
