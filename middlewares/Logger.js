const fs = require("fs");

const Logger = (req, res, next) => {
  try {
    let data = `Method ${req.method} - URL ${req.url} - ${res.statusCode} \n`;
    fs.appendFileSync("./logs.txt", data);
    next();
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Something went wrong while creating logs", error: error });
  }
};

module.exports = Logger;
