const jwt = require("jsonwebtoken");

const AuthMiddleware = (role) => {
  return (req, res, next) => {
    let token = req.headers?.authorization?.split(" ")[1];
    console.log(token);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded) {
        if (role.includes(decoded.role)) {
          req.userId = decoded.userId;
          req.role = decoded.role;
          next();
        } else {
          res.status(401).json({ msg: "Access denied" });
        }
      }
    }
  };
};

module.exports = AuthMiddleware;
