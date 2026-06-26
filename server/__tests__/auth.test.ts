import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await mongoose.connection.dropDatabase();
});

describe("POST /api/auth/register", () => {
    it("registers a new user and returns 201", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({ email: "test@example.com", password: "password123" });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe("User registered successfully");
    });

});

describe("POST /api/auth/login", () => {
    beforeEach(async () => {
        await request(app)
            .post("/api/auth/register")
            .send({ email: "test@example.com", password: "password123" });
    });

    it("returns a JWT token on valid credentials", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "test@example.com", password: "password123" });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    it("returns 401 on wrong password", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "test@example.com", password: "wrong" });

        expect(res.status).toBe(401);
    });

    it("returns 401 on unknown email", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "nobody@example.com", password: "password123" });

        expect(res.status).toBe(401);
    });
});
