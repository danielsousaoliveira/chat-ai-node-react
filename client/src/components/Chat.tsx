import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

type Message = {
    content: string;
    sender: "user" | "bot";
};

const SendIcon: React.FC = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="currentColor" />
    </svg>
);

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
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
                if (axios.isAxiosError(err) && err.response?.status === 403) {
                    localStorage.removeItem("token");
                    navigate("/login");
                }
            }
        };
        fetchChatHistory();
    }, [navigate]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, sending]);

    useEffect(() => {
        if (!sending) inputRef.current?.focus();
    }, [sending]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        const userMessage: Message = { content: input, sender: "user" };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setError("");
        setSending(true);
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
            setMessages((prev) => prev.slice(0, -1));
            setError("Failed to get a response. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const isStreaming = sending && messages.length > 0 && messages[messages.length - 1].sender === "bot";

    return (
        <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
            {/* Header */}
            <header
                className="flex items-center justify-between px-5 py-3 shrink-0"
                style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
            >
                <span className="text-sm font-bold uppercase" style={{ color: "var(--text)", letterSpacing: "0.2em" }}>
                    ARI<span style={{ color: "var(--accent)" }}>A</span>
                </span>
                <button onClick={handleLogout} className="btn btn-ghost">
                    Sign out
                </button>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
                {messages.length === 0 && !sending && (
                    <div className="flex items-center justify-center h-full" style={{ minHeight: "200px" }}>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                            Send a message to get started
                        </p>
                    </div>
                )}

                {messages.map((message, index) => {
                    const isLastBot = message.sender === "bot" && index === messages.length - 1;
                    const showCursor = isLastBot && isStreaming;

                    return (
                        <div
                            key={index}
                            className={`flex ${message.sender === "user" ? "justify-end animate-fade-right" : "justify-start animate-fade-left"}`}
                        >
                            <div
                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-[75%] ${showCursor ? "cursor-blink" : ""} ${
                                    message.sender === "user"
                                        ? "rounded-br-sm text-white"
                                        : "rounded-bl-sm"
                                }`}
                                style={
                                    message.sender === "user"
                                        ? { background: "var(--accent)" }
                                        : { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }
                                }
                            >
                                {message.content || (isStreaming && isLastBot ? "" : <span style={{ color: "var(--text-muted)" }}>—</span>)}
                            </div>
                        </div>
                    );
                })}

                {error && (
                    <p className="text-center text-xs" style={{ color: "#f87171" }}>
                        {error}
                    </p>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div
                className="shrink-0 px-4 py-3"
                style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}
            >
                <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-3xl mx-auto">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input flex-1"
                        placeholder="Message Aria..."
                        disabled={sending}
                        autoComplete="off"
                    />
                    <button
                        type="submit"
                        className="btn btn-primary shrink-0"
                        disabled={sending || !input.trim()}
                        style={{ padding: "0.625rem 0.875rem" }}
                    >
                        <SendIcon />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
