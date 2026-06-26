import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

type Message = {
    content: string;
    sender: "user" | "bot";
};

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const handleAuthError = (err: unknown) => {
        if (axios.isAxiosError(err) && err.response?.status === 403) {
            localStorage.removeItem("token");
            navigate("/login");
        }
    };

    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                const response = await axios.get<Message[]>(`${API_BASE}/api/chat/history`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                setMessages(response.data);
            } catch (err) {
                console.error("Failed to fetch chat history", err);
                handleAuthError(err);
            }
        };
        fetchChatHistory();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, sending]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        const userMessage: Message = { content: input, sender: "user" };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setError("");
        setSending(true);

        // Add an empty bot message that we'll stream tokens into
        setMessages((prev) => [...prev, { content: "", sender: "bot" }]);

        try {
            const response = await fetch(`${API_BASE}/api/chat/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ message: userMessage.content }),
            });

            if (!response.ok || !response.body) {
                if (response.status === 403) {
                    localStorage.removeItem("token");
                    navigate("/login");
                    return;
                }
                throw new Error("Bad response");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const payload = JSON.parse(line.slice(6));
                    if (payload.token) {
                        setMessages((prev) => {
                            const updated = [...prev];
                            updated[updated.length - 1] = {
                                content: updated[updated.length - 1].content + payload.token,
                                sender: "bot",
                            };
                            return updated;
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Failed to send message", err);
            handleAuthError(err);
            setMessages((prev) => prev.slice(0, -1)); // remove empty bot placeholder
            setError("Failed to get a response. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <div className="bg-white shadow-md p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Chat</h1>
                <button onClick={handleLogout} className="btn btn-secondary">
                    Log out
                </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                            className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                                message.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
                            }`}
                        >
                            {message.content || <span className="animate-pulse">...</span>}
                        </div>
                    </div>
                ))}
                {error && (
                    <div className="flex justify-center">
                        <p className="text-red-500 text-sm">{error}</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="bg-white p-4 border-t">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input flex-grow"
                        placeholder="Type a message..."
                        disabled={sending}
                    />
                    <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()}>
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;
