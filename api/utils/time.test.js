const { DateTime } = require("luxon");
const { calculateNextArrival } = require("./time");

describe("calculateNextArrival", () => {
  test("calcul avec headway 3 min", () => {
    const now = DateTime.fromISO("2025-01-01T12:00:00", {
      zone: "Europe/Paris",
    });
    const result = calculateNextArrival(now, 3);
    expect(result.nextArrival).toMatch(/^\d{2}:\d{2}$/);
    expect(result.headwayMin).toBe(3);
  });

  test("valeur par défaut headway est 3", () => {
    const now = DateTime.fromISO("2025-01-01T12:00:00", {
      zone: "Europe/Paris",
    });
    const result = calculateNextArrival(now);
    expect(result.headwayMin).toBe(3);
  });

  test("service fermé en dehors des horaires", () => {
    const now = DateTime.fromISO("2025-01-01T03:00:00", {
      zone: "Europe/Paris",
    });
    const result = calculateNextArrival(now);
    expect(result.service).toBe("closed");
  });
});
