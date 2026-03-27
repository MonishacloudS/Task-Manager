const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    res.status(401).json({ message: "Unauthorized: token missing" });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "super-secret-key",
    );
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized: invalid token" });
  }
};

module.exports = authMiddleware;
