const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Fonction de calcul du prochain métro
function calculateNextArrival(now = new Date(), headwayMin = 3) {
  const tz = "Europe/Paris";

  const toHM = (d) =>
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0");

  const start = new Date(now);
  start.setHours(5, 30, 0, 0); // 05:30

  const end = new Date(now);
  end.setHours(1, 15, 0, 0); // 01:15

  const nowTime = now.getTime();
  const startTime = start.getTime();
  const endTime = end.getTime();

  // Hors plage => service fermé
  if (nowTime < startTime || nowTime > endTime) {
    return { service: "closed", tz };
  }

  // Passage du Dernier métro
  const lastWindow = new Date(now);
  lastWindow.setHours(0, 45, 0, 0); // 00:45

  const next = new Date(now.getTime() + headwayMin * 60 * 1000);

  return { nextArrival: toHM(next), isLast: now >= lastWindow, headwayMin, tz };
}

// Middleware pour le log de chaque requête
app.use((req, res, next) => {
  const t0 = Date.now();
  res.on("finish", () => {
    const t1 = Date.now();
    const duration = t1 - t0;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });
  next();
});

// Route /health
app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
  });
});

// Route /next-metro
app.get("/next-metro", (req, res) => {
  const station = req.query.station;

  if (!station) {
    return res.status(400).json({
      error: "missing station",
    });
  }

  const currentTime = new Date();
  const { nextArrival, isLast, headwayMin, tz, service } =
    calculateNextArrival(currentTime);

  if (service === "closed") {
    return res.status(200).json({ service, tz });
  }

  const result = {
    station: station,
    line: "M1",
    headwayMin: headwayMin,
    nextArrival: nextArrival,
    isLast: isLast,
    tz: tz,
  };

  res.status(200).json(result);
});

// Middleware 404 pour toutes les autres URL non trouvées
app.use((req, res, next) => {
  console.log("URL Not Found :" + req.url);
  return res.status(404).json({
    error: "URL Not Found",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
