module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests", "<rootDir>/utils", "<rootDir>/src/lib"],
  collectCoverage: true,
  collectCoverageFrom: ["src/lib/time2.js"],
  testPathIgnorePatterns: ["<rootDir>/tests/integration/"],
  globalTeardown: "<rootDir>/tests/globalTeardown.js",
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};
