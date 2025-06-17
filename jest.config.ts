export default {
  clearMocks: true,
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    "/node_modules",
    "src/routes/index.tsx",
    "/e2e",
    "src/core/cardano",
  ],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coverageReporters: ["clover", "json", "lcov"],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 50,
      functions: 50,
      lines: 80,
    },
  },
  moduleFileExtensions: [
    "js",
    "mjs",
    "cjs",
    "jsx",
    "ts",
    "tsx",
    "json",
    "node",
    "yaml",
  ],
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/src/ui/__mocks__/fileMock.ts",
    "\\.(css|scss)$": "<rootDir>/src/ui/__mocks__/styleMock.ts",
    // Jest cannot import the browser version so we can map in the NodeJS version instead.
  },
  testEnvironment: "jsdom",
  testMatch: ["**/src/**/?(*.)+(test).[tj]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/credential-server-ui/"],
  transformIgnorePatterns: [
    "node_modules/(?!(@ionic/react|@ionic/react-router|@ionic/core|@stencil/core|ionicons|swiper|ssr-window|@aparajita/capacitor-biometric-auth)/)",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
    "\\.yaml$": "jest-transform-yaml",
  },
  setupFilesAfterEnv: ["jest-canvas-mock", "<rootDir>/src/setupTests.ts"],
  setupFiles: ["<rootDir>/src/ui/__mocks__/swiper.tsx"],
};
