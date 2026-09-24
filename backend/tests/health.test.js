const request = require("supertest");
const app = require("../server");

describe("GET /api/health", () => {
  it("responds with success and reports server/database/AI status", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("database.status");
    expect(res.body).toHaveProperty("ai.provider");
  });
});

describe("GET /unknown-route", () => {
  it("returns a 404 with a helpful message", async () => {
    const res = await request(app).get("/unknown-route");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/auth/login", () => {
  it("rejects a missing password with a 400, not a 500", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "test@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
