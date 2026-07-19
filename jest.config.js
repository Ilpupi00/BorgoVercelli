module.exports = {
  testEnvironment: "node",
  clearMocks: true,
  setupFilesAfterEnv: ["./jest.setup.js"],
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],
  collectCoverageFrom: [
    "src/features/**/services/**/*.js",
    "src/features/**/controllers/**/*.js",
    "src/core/**/*.js",
    "src/shared/**/*.js",
    "!src/public/**",
    "!**/node_modules/**"
  ],
  coverageThreshold: {
    global: {
      statements: 55,
      branches: 35,
      functions: 50,
      lines: 55
    }
  }
};
