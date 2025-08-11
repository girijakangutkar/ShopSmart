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
