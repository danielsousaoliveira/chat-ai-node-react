import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type Message = {
    content: string;
    sender: "user" | "bot";
};

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchChatHistory();
    });

    const fetchChatHistory = async () => {
        try {
            const response = await axios.get<Message[]>("http://localhost:5000/api/chat/history", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setMessages(response.data);
        } catch (error) {
            console.error("Failed to fetch chat history", error);
            if (axios.isAxiosError(error) && error.response?.status === 403) {
                localStorage.removeItem("token");
                navigate("/login");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { content: input, sender: "user" };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInput("");

        try {
            const response = await axios.post<{ response: string }>(
                "http://localhost:5000/api/chat/message",
                { message: input },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            const botMessage: Message = { content: response.data.response, sender: "bot" };
            setMessages((prevMessages) => [...prevMessages, botMessage]);
        } catch (error) {
            console.error("Failed to send message", error);
            if (axios.isAxiosError(error) && error.response?.status === 403) {
                localStorage.removeItem("token");
                navigate("/login");
            }
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
                            {message.content}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSubmit} className="bg-white p-4 border-t">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input flex-grow"
                        placeholder="Type a message..."
                    />
                    <button type="submit" className="btn btn-primary">
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;
