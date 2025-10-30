const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { DateTime } = require("luxon");
const { Pool } = require("pg");
const { calculateNextArrival } = require("./utils/time");

const app = express();
const PORT = process.env.PORT || 5001;

const dbPool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  host: process.env.POSTGRES_HOST || "db",
  port: process.env.POSTGRES_PORT || 5432,
});

app.use(cors());

// Stations connues
const stationsKnown = ["Chatelet", "Concorde", "Bastille", "République", "Nation"];

// Paramètres horaires
const HEADWAY_MIN = parseInt(process.env.HEADWAY_MIN) || 3;
const LAST_WINDOW_START = process.env.LAST_WINDOW_START || "00:45";
const SERVICE_END = process.env.SERVICE_END || "01:15";

// Middleware pour logs
app.use((req, res, next) => {
  const t0 = Date.now();
  res.on("finish", () => {
    const t1 = Date.now();
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${t1 - t0}ms`);
  });
  next();
});

// Route /health
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Route /next-metro
app.get("/next-metro", (req, res) => {
  const station = req.query.station;
  let n = parseInt(req.query.n) || 1;
  n = Math.min(Math.max(n, 1), 5);

  if (!station) return res.status(400).json({ error: "missing station" });

  const stationLower = station.toLowerCase();
  const stationMatch = stationsKnown.find((s) => s.toLowerCase() === stationLower);
  if (!stationMatch) {
    const suggestions = stationsKnown.filter((s) =>
      s.toLowerCase().includes(stationLower)
    );
    return res.status(404).json({ error: "unknown station", suggestions });
  }

  // Calcul des prochains passages
  const passages = [];
  const now = DateTime.now().setZone("Europe/Paris");
  for (let i = 0; i < n; i++) {
    const arrivalTime = now.plus({ minutes: i * HEADWAY_MIN });
    passages.push(arrivalTime.toFormat("HH:mm"));
  }

  const { isLast, tz, service } = calculateNextArrival(
    now,
    HEADWAY_MIN,
    LAST_WINDOW_START,
    SERVICE_END
  );

  if (service === "closed") return res.status(200).json({ service, tz });

  res.status(200).json({
    station,
    line: "M1",
    headwayMin: HEADWAY_MIN,
    nextArrivals: passages,
    isLast,
    tz,
  });
});

// Route /last-metro
app.get("/last-metro", async (req, res) => {
  const station = req.query.station?.trim();
  if (!station) return res.status(400).json({ error: "missing station" });

  try {
    const defaultsRes = await dbPool.query(
      "SELECT value FROM config WHERE key = $1",
      ["metro.defaults"]
    );
    const defaults = defaultsRes.rows[0]?.value;
    if (!defaults) return res.status(500).json({ error: "metro.defaults not found" });

    const lastRes = await dbPool.query(
      "SELECT value FROM config WHERE key = $1",
      ["metro.last"]
    );
    const lastMap = lastRes.rows[0]?.value;
    if (!lastMap) return res.status(500).json({ error: "metro.last not found" });

    const stationLower = station.toLowerCase();
    const foundStation = Object.keys(lastMap).find(
      (key) => key.toLowerCase() === stationLower
    );
    if (!foundStation) return res.status(404).json({ error: "unknown station" });

    res.status(200).json({
      station: foundStation,
      lastMetro: lastMap[foundStation],
      line: defaults.line || "M1",
      tz: defaults.tz || "Europe/Paris",
    });
  } catch (error) {
    console.error("Error /last-metro:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

// Route /test-time
app.get("/test-time", (req, res) => {
  const timeStr = req.query.time;
  if (!timeStr) return res.status(400).json({ error: "missing time parameter" });

  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return res.status(400).json({ error: "invalid time format" });
  }

  const now = DateTime.now()
    .setZone("Europe/Paris")
    .set({ hour: h, minute: m, second: 0, millisecond: 0 });

  const { service, tz } = calculateNextArrival(now);

  res.json({ service: service === "closed" ? "closed" : "open", tz });
});

// Route /db-health
app.get("/db-health", async (req, res) => {
  try {
    const result = await dbPool.query("SELECT 1 as test");
    res.status(200).json({ db: "ok", result: result.rows[0] });
  } catch (error) {
    res.status(500).json({ db: "error", error: error.message });
  }
});

// Middleware 404
app.use((req, res) => {
  console.log("URL Not Found: " + req.url);
  res.status(404).json({ error: "URL Not Found" });
});

// Lancement du serveur (sauf pour les tests)
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

// Exporter l'instance Express directement pour supertest
// et attacher le pool à l'app pour le teardown global des tests
app.dbPool = dbPool;
module.exports = app;
