const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    family: 4,
  })
  .then(() => {
    console.log("DB connection established");
  })
  .catch((err) => {
    console.log("Cannot connect to the DB");
  });

// const mongoose = require("mongoose");

// const connectWithRetry = () => {
//   mongoose
//     .connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       family: 4,
//       serverSelectionTimeoutMS: 15000, // Increase timeout to 15 seconds
//       socketTimeoutMS: 45000, // Increase socket timeout
//       bufferMaxEntries: 0, // Disable mongoose buffering
//       maxPoolSize: 10, // Maintain up to 10 socket connections
//       connectTimeoutMS: 30000, // Give up initial connection after 30 seconds
//     })
//     .then(() => {
//       console.log("MongoDB connected successfully");
//     })
//     .catch((err) => {
//       console.error("MongoDB connection failed, retrying in 5 seconds...", err);
//       setTimeout(connectWithRetry, 5000);
//     });
// };

// // Handle connection events
// mongoose.connection.on("disconnected", () => {
//   console.log("MongoDB disconnected. Attempting to reconnect...");
//   setTimeout(connectWithRetry, 5000);
// });

// mongoose.connection.on("error", (err) => {
//   console.error("MongoDB connection error:", err);
// });

// connectWithRetry();
