const path = require("path");

// Le .env est dans le dossier racine Metro/, pas dans api/
const envPath = path.join(__dirname, "..", "..", ".env");
require("dotenv").config({ path: envPath });

// Override POSTGRES_HOST pour les tests locaux
if (process.env.NODE_ENV !== "production") {
  process.env.POSTGRES_HOST = "localhost";
}

const request = require("supertest");
const app = require("../server");
const { Pool } = require("pg");
const fs = require("fs");

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  port: process.env.POSTGRES_PORT,
});

beforeEach(async () => {
  // Reseed la base avec le seed.sql
  const seedPath = path.join(__dirname, "..", "..", "db", "seed.sql");
  const seedSql = fs.readFileSync(seedPath, "utf8");
  await pool.query(seedSql);
});

afterAll(async () => {
  await pool.end();
});

describe("/last-metro", () => {
  it("200 avec station connue (insensible à la casse)", async () => {
    const res = await request(app).get("/last-metro?station=Chatelet");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("station", "Chatelet");
    expect(res.body).toHaveProperty("lastMetro");
    expect(res.body).toHaveProperty("line");
    expect(res.body).toHaveProperty("tz");

    const res2 = await request(app).get("/last-metro?station=chatelet");
    expect(res2.status).toBe(200);
    expect(res2.body.station.toLowerCase()).toBe("chatelet");
  });

  it("404 avec station inconnue", async () => {
    const res = await request(app).get("/last-metro?station=Inconnue");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("400 sans station", async () => {
    const res = await request(app).get("/last-metro");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("/next-metro", () => {
  it("200 avec station et nextArrivals au format HH:MM", async () => {
    const res = await request(app).get("/next-metro?station=Chatelet");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("station", "Chatelet");
    expect(res.body).toHaveProperty("nextArrivals");
    expect(Array.isArray(res.body.nextArrivals)).toBe(true);
    expect(res.body.nextArrivals[0]).toMatch(/^\d{2}:\d{2}$/);
  });

  it("404 avec station inconnue", async () => {
    const res = await request(app).get("/next-metro?station=Inconnue");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "unknown station");
  });

  it("400 sans station", async () => {
    const res = await request(app).get("/next-metro");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "missing station");
  });
});

describe("/health", () => {
  it("200 health check", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
