// Test isolé qui mock la DB pour provoquer une erreur 500 sur /db-health
const path = require("path");
process.env.NODE_ENV = "test";
process.env.POSTGRES_HOST = "invalid-host-test";

jest.resetModules();

jest.doMock("pg", () => ({
  Pool: function () {
    return { query: () => Promise.reject(new Error("boom")) };
  },
}));

require("dotenv").config({
  path: path.join(__dirname, "..", "..", "..", ".env"),
});
const request = require("supertest");
const app = require("../../server");

describe("GET /db-health (erreur)", () => {
  test("500 DB error simulée", async () => {
    const res = await request(app).get("/db-health");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});
