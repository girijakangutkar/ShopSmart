const express = require("express");
const cors = require("cors");
const AuthRouter = require("./routes/AuthRouter");
const Logger = require("./middlewares/Logger");
const UserRouter = require("./routes/UserRouter");
const ProductRouter = require("./routes/ProductRouter");
const app = express();
//! Env file
require("dotenv").config();

//!Mongo connection
require("./config/MongoConfig");

//!Cron schedular
require("./routes/AdminRoutes");

//!cors
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api", Logger, AuthRouter);

app.use("/myInfo", Logger, UserRouter);

app.use("/wareHouse", Logger, ProductRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
