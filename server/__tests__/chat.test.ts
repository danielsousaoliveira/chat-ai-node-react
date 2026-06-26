import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app";

let mongoServer: MongoMemoryServer;
let token: string;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    await request(app)
        .post("/api/auth/register")
        .send({ email: "chat@example.com", password: "password123" });

    const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "chat@example.com", password: "password123" });

    token = res.body.token;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("GET /api/chat/history", () => {
    it("returns 401 without a token", async () => {
        const res = await request(app).get("/api/chat/history");
        expect(res.status).toBe(401);
    });

    it("returns empty array for a new user", async () => {
        const res = await request(app)
            .get("/api/chat/history")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});

describe("POST /api/chat/message", () => {
    it("returns 401 without a token", async () => {
        const res = await request(app)
            .post("/api/chat/message")
            .send({ message: "hello" });
        expect(res.status).toBe(401);
    });

    it("returns 400 when message is missing", async () => {
        const res = await request(app)
            .post("/api/chat/message")
            .set("Authorization", `Bearer ${token}`)
            .send({});
        expect(res.status).toBe(400);
    });
});
