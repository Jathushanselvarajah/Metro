process.env.NODE_ENV = "test";
process.env.POSTGRES_HOST = "localhost";
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", "..", "..", ".env"),
});
const request = require("supertest");
const app = require("../../server");

describe("GET /next-metro", () => {
  test("200 station connue", async () => {
    const res = await request(app).get("/next-metro?station=Chatelet");
    expect(res.status).toBe(200);
    if (res.body.service === "closed") {
      expect(res.body).toHaveProperty("service", "closed");
      expect(res.body).toHaveProperty("tz");
    } else {
      expect(res.body).toHaveProperty("station", "Chatelet");
      expect(Array.isArray(res.body.nextArrivals)).toBe(true);
      expect(res.body.nextArrivals[0]).toMatch(/^\d{2}:\d{2}$/);
    }
  });

  test("404 station inconnue", async () => {
    const res = await request(app).get("/next-metro?station=Inconnue");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "unknown station");
  });

  test("400 station manquante", async () => {
    const res = await request(app).get("/next-metro");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "missing station");
  });
});
