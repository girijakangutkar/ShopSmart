// const Redis = require("ioredis");

// const redis = new Redis();

// module.exports = redis;

const Redis = require("ioredis");

let redis;

if (process.env.NODE_ENV !== "test") {
  redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  });

  redis.on("connect", () => {
    console.log("✅ Redis connected");
  });

  redis.on("error", (err) => {
    console.error("❌ Redis connection error:", err);
  });
} else {
  // Mock Redis for tests
  redis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    setex: jest.fn().mockResolvedValue("OK"),
    exists: jest.fn().mockResolvedValue(0),
    quit: jest.fn().mockResolvedValue("OK"),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };
}

module.exports = redis;
