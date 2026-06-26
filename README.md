# Aria — Self-Hosted AI Chat

A self-hosted chat client that connects to any AI model through [OpenRouter](https://openrouter.ai). Runs locally with Docker. Free models available — no monthly subscription required.

## Features

- Real-time streaming responses
- Encrypted chat history stored in MongoDB
- JWT authentication
- Configurable model — swap providers without touching code
- Fully containerised — one command to run

## Quick Start

```bash
# 1. Copy and fill in the environment file
cp .env.example .env

# 2. Run everything
docker compose up --build
```

Open `http://localhost:3000`.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `MONGODB_URI_DOCKER` | MongoDB connection string (inside Docker) | `mongodb://mongo:27017/chat-ai` |
| `JWT_SECRET` | Secret used to sign auth tokens | — |
| `ENCRYPTION_SECRET_KEY` | 32-character key for message encryption | — |
| `OPENROUTER_API_KEY` | Your [OpenRouter](https://openrouter.ai/keys) API key | — |
| `OPENROUTER_MODEL` | Model to use (e.g. `openai/gpt-4o-mini`) | `openai/gpt-4o-mini` |
| `SERVER_PORT` | Host port mapped to the server | `5000` |
| `VITE_API_URL` | API URL baked into the client build | `http://localhost:5000` |

Free models on OpenRouter: `meta-llama/llama-3.1-8b-instruct:free`, `google/gemma-3-27b-it:free`, `deepseek/deepseek-r1:free`.

## Manual Setup

**Server**
```bash
cd server
cp .env.example .env   # fill in values
npm install
npm run dev
```

**Client**
```bash
cd client
cp .env.example .env   # set VITE_API_URL
npm install
npm run dev
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB via Mongoose |
| Auth | JWT + bcrypt |
| AI | OpenRouter API (OpenAI-compatible) |

## License

MIT
