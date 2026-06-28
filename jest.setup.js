jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: jest.fn(),
  },
}));

jest.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(
    jest.fn().mockImplementation(() => ({
      limit: jest.fn(),
    })),
    { slidingWindow: jest.fn() },
  ),
}));