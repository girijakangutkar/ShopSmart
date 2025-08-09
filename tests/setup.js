const mongoose = require("mongoose");
require("dotenv").config({
  path: process.env.NODE_ENV === "test" ? "./.env.test" : "./.env",
});

beforeAll(async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("Mongo Url is not defined");
  }

  console.log(process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    family: 4,
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
