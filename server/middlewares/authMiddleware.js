const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify JWT signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify token is still active in database
    const [rows] = await db.query(
      "SELECT active_token FROM users WHERE id = ?", 
      [decoded.id]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }
    
    if (rows[0].active_token !== token) {
      return res.status(401).json({ 
        message: "Session expired. Please login again.",
        code: "TOKEN_REVOKED"
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ 
        message: "Token expired. Please refresh your session.",
        code: "TOKEN_EXPIRED"
      });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        message: "Invalid token",
        code: "TOKEN_INVALID"
      });
    }
    console.error("Auth middleware error:", err);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = authMiddleware;