/**
 * Module temps pur (time2.js) – fonctions déterministes sans dépendances externes.
 * Fournit formatHHMM(date) et computeNextHHMM(baseDate, headwayMin).
 */

function assertValidDate(d) {
  /* istanbul ignore next */
  if (!(d instanceof Date)) {
    throw new TypeError(`date must be a valid Date instance`);
  }
  // Séparation de la branche pour couverture fine
  if (isNaN(d.getTime())) {
    throw new TypeError(`date must be a valid Date instance`);
  }
}

/**
 * Formatte un objet Date en "HH:MM".
 * @param {Date} date
 * @returns {string}
 */
function formatHHMM(date) {
  assertValidDate(date);
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Calcule l'heure suivante (HH:MM) en ajoutant headwayMin minutes à baseDate.
 * Ne mute pas la date d'origine.
 * @param {Date} baseDate
 * @param {number} headwayMin entier >= 0
 */
function computeNextHHMM(baseDate, headwayMin = 0) {
  assertValidDate(baseDate);
  if (!Number.isInteger(headwayMin)) {
    throw new RangeError("headwayMin must be an integer >= 0");
  }
  if (headwayMin < 0) {
    throw new RangeError("headwayMin must be an integer >= 0");
  }
  const next = new Date(baseDate.getTime());
  next.setMinutes(next.getMinutes() + headwayMin);
  return formatHHMM(next);
}

module.exports = { formatHHMM, computeNextHHMM };
