const { DateTime } = require("luxon");

function calculateNextArrival(
  now = DateTime.now().setZone("Europe/Paris"),
  headwayMin = 3
) {
  const tz = "Europe/Paris";

  const toHM = (d) => d.toFormat("HH:mm");

  const start = now.set({ hour: 5, minute: 30, second: 0, millisecond: 0 });
  let end = now.set({ hour: 1, minute: 15, second: 0, millisecond: 0 });

  let nowTime = now.toMillis();
  const startTime = start.toMillis();
  let endTime = end.toMillis();

  if (endTime <= startTime) {
    endTime += 24 * 60 * 60 * 1000;
    if (nowTime < startTime) {
      nowTime += 24 * 60 * 60 * 1000;
    }
  }

  if (nowTime < startTime || nowTime > endTime) {
    return { service: "closed", tz };
  }

  let lastWindow = now.set({ hour: 0, minute: 45, second: 0, millisecond: 0 });
  let serviceEnd = now.set({ hour: 1, minute: 15, second: 0, millisecond: 0 });

  let nowAdjusted = now.toMillis();
  let lastWindowTime = lastWindow.toMillis();
  let serviceEndTime = serviceEnd.toMillis();

  if (serviceEndTime <= lastWindowTime) {
    serviceEndTime += 24 * 60 * 60 * 1000;
    if (nowAdjusted < lastWindowTime) {
      nowAdjusted += 24 * 60 * 60 * 1000;
    }
  }

  const isLast = nowAdjusted >= lastWindowTime && nowAdjusted <= serviceEndTime;

  const next = now.plus({ minutes: headwayMin });

  return {
    nextArrival: toHM(next),
    isLast,
    headwayMin,
    tz,
  };
}

module.exports = { calculateNextArrival };
