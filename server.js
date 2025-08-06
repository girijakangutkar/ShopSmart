const express = require("express");
const AuthRouter = require("./routes/AuthRouter");
const Logger = require("./middlewares/Logger");
const UserRouter = require("./routes/UserRouter");
const ProductRouter = require("./routes/ProductRouter");
const app = express();
require("dotenv").config();
require("./config/MongoConfig");

app.use(express.json());

app.use("/api", Logger, AuthRouter);

app.use("/myInfo", Logger, UserRouter);

app.use("/wareHouse", Logger, ProductRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
