require("dotenv").config({ path: ".env.test" });

const mongoose = require("mongoose");

beforeAll(async () => {
  const testMongoUri = process.env.MONGO_URI;

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testMongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  console.log(
    "Connected to test database:",
    mongoose.connection.db.databaseName
  );
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  }
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
