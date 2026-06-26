import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

const Register: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await axios.post(`${API_BASE}/api/auth/register`, { email, password });
            navigate("/login");
        } catch (_error) {
            setError("Registration failed. Please try again.");
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(124,111,247,0.12) 0%, var(--bg) 70%)" }}
        >
            <div className="w-full max-w-sm px-4">
                <div className="animate-slide-up">
                    <div className="mb-8 text-center">
                        <span className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                            aria
                        </span>
                    </div>

                    <div
                        className="rounded-2xl p-8"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                        <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--text)" }}>
                            Create an account
                        </h1>
                        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                            Self-hosted. Your data stays local.
                        </p>

                        {error && (
                            <div
                                className="text-sm rounded-lg px-3 py-2 mb-4"
                                style={{ background: "rgba(248,113,113,0.08)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}
                            >
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                                    Password
                                </label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-full mt-2">
                                Create account
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-sm mt-4" style={{ color: "var(--text-muted)" }}>
                        Already have an account?{" "}
                        <Link to="/login" className="transition-colors" style={{ color: "var(--accent)" }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
