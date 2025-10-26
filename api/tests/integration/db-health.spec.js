process.env.NODE_ENV = "test";
process.env.POSTGRES_HOST = "localhost";
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", "..", "..", ".env"),
});
const request = require("supertest");
const app = require("../../server");

describe("GET /db-health", () => {
  test("200 DB OK", async () => {
    const res = await request(app).get("/db-health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("db", "ok");
  });
});
