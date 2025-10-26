const { formatHHMM, computeNextHHMM } = require("../src/lib/time2");

describe("formatHHMM", () => {
  test("05:07 padding", () => {
    const d = new Date(2025, 0, 1, 5, 7, 0, 0);
    expect(formatHHMM(d)).toBe("05:07");
  });
  test("reject invalid Date instance", () => {
    expect(() => formatHHMM(new Date("invalid"))).toThrow(TypeError);
  });
  test("reject non-Date", () => {
    expect(() => formatHHMM(123)).toThrow(TypeError);
  });
  test("reject Date with NaN time after tampering", () => {
    const d = new Date(2025, 0, 1, 10, 0, 0, 0);
    // Force invalid internal time: setTime(NaN) yields NaN getTime() but still Date instance
    d.setTime(NaN);
    expect(() => formatHHMM(d)).toThrow(TypeError);
  });
});

describe("computeNextHHMM normal cases", () => {
  test("10:00 + 3 = 10:03", () => {
    const base = new Date(2025, 0, 1, 10, 0, 0, 0);
    expect(computeNextHHMM(base, 3)).toBe("10:03");
  });
  test("default headway param (omit) => same time", () => {
    const base = new Date(2025, 0, 1, 8, 15, 0, 0);
    expect(computeNextHHMM(base)).toBe("08:15");
  });
  test("14:20 + 7 = 14:27", () => {
    const base = new Date(2025, 0, 1, 14, 20, 0, 0);
    expect(computeNextHHMM(base, 7)).toBe("14:27");
  });
  test("10:00 + 0 = 10:00", () => {
    const base = new Date(2025, 0, 1, 10, 0, 0, 0);
    expect(computeNextHHMM(base, 0)).toBe("10:00");
  });
  test("09:59 + 1 = 10:00", () => {
    const base = new Date(2025, 0, 1, 9, 59, 0, 0);
    expect(computeNextHHMM(base, 1)).toBe("10:00");
  });
  test("10:58 + 2 = 11:00", () => {
    const base = new Date(2025, 0, 1, 10, 58, 0, 0);
    expect(computeNextHHMM(base, 2)).toBe("11:00");
  });
  test("23:00 + 60 = 00:00", () => {
    const base = new Date(2025, 0, 1, 23, 0, 0, 0);
    expect(computeNextHHMM(base, 60)).toBe("00:00");
  });
});

describe("computeNextHHMM edge wrap", () => {
  test("23:59 + 1 = 00:00", () => {
    const base = new Date(2025, 0, 1, 23, 59, 0, 0);
    expect(computeNextHHMM(base, 1)).toBe("00:00");
  });
  test("23:59 + 5 = 00:04", () => {
    const base = new Date(2025, 0, 1, 23, 59, 0, 0);
    expect(computeNextHHMM(base, 5)).toBe("00:04");
  });
  test("00:00 + 1440 = 00:00", () => {
    const base = new Date(2025, 0, 1, 0, 0, 0, 0);
    expect(computeNextHHMM(base, 1440)).toBe("00:00");
  });
  test("22:30 + 180 = 01:30", () => {
    const base = new Date(2025, 0, 1, 22, 30, 0, 0);
    expect(computeNextHHMM(base, 180)).toBe("01:30");
  });
});

describe("computeNextHHMM validation errors", () => {
  test("negative headway", () => {
    const base = new Date(2025, 0, 1, 10, 0, 0, 0);
    expect(() => computeNextHHMM(base, -1)).toThrow(RangeError);
  });
  test("non integer headway", () => {
    const base = new Date(2025, 0, 1, 10, 0, 0, 0);
    expect(() => computeNextHHMM(base, 2.5)).toThrow(RangeError);
  });
  test("invalid baseDate type", () => {
    expect(() => computeNextHHMM("2025-01-01T10:00:00Z", 5)).toThrow(TypeError);
  });
  test("invalid Date instance", () => {
    expect(() => computeNextHHMM(new Date("invalid"), 5)).toThrow(TypeError);
  });
  test("NaN headway", () => {
    const base = new Date(2025, 0, 1, 10, 0, 0, 0);
    expect(() => computeNextHHMM(base, Number.NaN)).toThrow(RangeError);
  });
});

describe("computeNextHHMM purity", () => {
  test("does not mutate original date", () => {
    const base = new Date(2025, 0, 1, 10, 0, 0, 0);
    const originalMs = base.getTime();
    computeNextHHMM(base, 5);
    expect(base.getTime()).toBe(originalMs);
  });
});
