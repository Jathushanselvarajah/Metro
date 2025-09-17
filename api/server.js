const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const stationsKnown = [
  "Chatelet",
  "Concorde",
  "Bastille",
  "République",
  "Nation",
];

const HEADWAY_MIN = parseInt(process.env.HEADWAY_MIN) || 3;
const LAST_WINDOW_START = process.env.LAST_WINDOW_START || "00:45";
const SERVICE_END = process.env.SERVICE_END || "01:15";

function parseTimeHM(hm) {
  const [h, m] = hm.split(":").map(Number);
  return { h, m };
}

// Fonction de calcul du prochain passage
function calculateNextArrival(now = new Date(), headwayMin = 3) {
  const tz = "Europe/Paris";

  const toHM = (d) =>
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0");

  const start = new Date(now);
  start.setHours(5, 30, 0, 0); // Début service 05:30
  const end = new Date(now);
  end.setHours(1, 15, 0, 0); // Fin service 01:15

  let nowTime = now.getTime();
  const startTime = start.getTime();
  let endTime = end.getTime();

  // Gestion plage traversant minuit
  if (endTime <= startTime) {
    endTime += 24 * 60 * 60 * 1000;
    if (nowTime < startTime) {
      nowTime += 24 * 60 * 60 * 1000;
    }
  }

  if (nowTime < startTime || nowTime > endTime) {
    return { service: "closed", tz };
  }

  // Gestion isLast entre 00:45 et 01:15
  const lastWindow = new Date(now);
  lastWindow.setHours(0, 45, 0, 0);
  const serviceEnd = new Date(now);
  serviceEnd.setHours(1, 15, 0, 0);

  let nowAdjusted = now.getTime();
  let lastWindowTime = lastWindow.getTime();
  let serviceEndTime = serviceEnd.getTime();

  if (serviceEndTime <= lastWindowTime) {
    serviceEndTime += 24 * 60 * 60 * 1000;
    if (nowAdjusted < lastWindowTime) {
      nowAdjusted += 24 * 60 * 60 * 1000;
    }
  }

  const isLast = nowAdjusted >= lastWindowTime && nowAdjusted <= serviceEndTime;

  const next = new Date(now.getTime() + headwayMin * 60 * 1000);

  return {
    nextArrival: toHM(next),
    isLast,
    headwayMin,
    tz,
  };
}

// Middleware pour logs
app.use((req, res, next) => {
  const t0 = Date.now();
  res.on("finish", () => {
    const t1 = Date.now();
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${t1 - t0}ms`
    );
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
  let n = parseInt(req.query.n);
  if (isNaN(n) || n < 1) n = 1;
  if (n > 5) n = 5;

  // Vérification station
  if (!station) {
    return res.status(400).json({ error: "missing station" });
  }
  const stationLower = station.toLowerCase();
  const stationMatch = stationsKnown.find(
    (s) => s.toLowerCase() === stationLower
  );
  if (!stationMatch) {
    // Rechercher suggestions basé sur préfixe ou substring
    const suggestions = stationsKnown.filter((s) =>
      s.toLowerCase().includes(stationLower)
    );
    return res.status(404).json({ error: "unknown station", suggestions });
  }

  // Calcul multiple passages
  const passages = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const arrivalTime = new Date(now.getTime() + i * HEADWAY_MIN * 60 * 1000);
    passages.push(
      String(arrivalTime.getHours()).padStart(2, "0") +
        ":" +
        String(arrivalTime.getMinutes()).padStart(2, "0")
    );
  }

  // Vérification plage horaire
  const { nextArrival, isLast, headwayMin, tz, service } = calculateNextArrival(
    now,
    HEADWAY_MIN,
    LAST_WINDOW_START,
    SERVICE_END
  );

  if (service === "closed") {
    return res.status(200).json({ service, tz });
  }

  // Réponse
  res.status(200).json({
    station,
    line: "M1",
    headwayMin: HEADWAY_MIN,
    nextArrivals: passages,
    isLast,
    tz,
  });
});

app.get("/test-time", (req, res) => {
  const timeStr = req.query.time; // format "HH:MM"
  if (!timeStr) {
    return res.status(400).json({ error: "missing time parameter" });
  }

  const now = new Date();
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return res.status(400).json({ error: "invalid time format" });
  }

  now.setHours(h, m, 0, 0); // fixe l'heure personnalisée dans now

  const { service, tz } = calculateNextArrival(now);

  if (service === "closed") {
    return res.json({ service, tz });
  } else {
    return res.json({ service: "open", tz });
  }
});

// Middleware 404
app.use((req, res) => {
  console.log("URL Not Found :" + req.url);
  res.status(404).json({ error: "URL Not Found" });
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
