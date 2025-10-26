process.env.NODE_ENV = "test";
process.env.POSTGRES_HOST = "localhost";
const path = require("path");
const fs = require("fs");
const request = require("supertest");
const { Pool } = require("pg");
require("dotenv").config({
  path: path.join(__dirname, "..", "..", "..", ".env"),
});
const app = require("../../server");

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  port: process.env.POSTGRES_PORT,
});

async function reseed() {
  const seedPath = path.join(__dirname, "..", "..", "..", "db", "seed.sql");
  const sql = fs.readFileSync(seedPath, "utf8");
  await pool.query(sql);
}

beforeEach(async () => {
  await reseed();
});

afterAll(async () => {
  await pool.end();
});

describe("GET /last-metro", () => {
  test("200 station connue (case insensitive)", async () => {
    const res = await request(app).get("/last-metro?station=Chatelet");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("station", "Chatelet");
    expect(res.body).toHaveProperty("lastMetro");
    expect(res.body).toHaveProperty("line");
    expect(res.body).toHaveProperty("tz");

    const resLower = await request(app).get("/last-metro?station=chatelet");
    expect(resLower.status).toBe(200);
    expect(resLower.body.station.toLowerCase()).toBe("chatelet");
  });

  test("404 station inconnue", async () => {
    const res = await request(app).get("/last-metro?station=Inconnue");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  test("400 station manquante", async () => {
    const res = await request(app).get("/last-metro");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("500 config manquante metro.defaults", async () => {
    await pool.query("DELETE FROM config WHERE key='metro.defaults'");
    const res = await request(app).get("/last-metro?station=Chatelet");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });

  test("500 config manquante metro.last", async () => {
    await pool.query("DELETE FROM config WHERE key='metro.last'");
    const res = await request(app).get("/last-metro?station=Chatelet");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});
