module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/integration/**/*.spec.js"],
  collectCoverage: false,
  verbose: true,
  globalTeardown: "<rootDir>/tests/globalTeardown.js",
};
