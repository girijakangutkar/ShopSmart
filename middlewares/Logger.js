const fs = require("fs");

const Logger = (req, res, next) => {
  try {
    let data = `Method ${req.method} - URL ${req.url} \n`;
    fs.appendFileSync("./logs.txt", data);
    next();
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

module.exports = Logger;
