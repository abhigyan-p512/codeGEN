const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization || "";
    console.log("[AUTH DBG] Authorization header:", !!auth, auth && auth.slice(0,60));
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing Authorization header" });
    }
    const token = auth.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Invalid token format" });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
      console.log("[AUTH DBG] token payload:", payload);
    } catch (err) {
      console.error("[AUTH DBG] jwt.verify error:", err && err.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = payload.id || payload.userId || payload._id;
    if (!userId) return res.status(401).json({ message: "Token missing user id" });

    const user = await User.findById(userId).select("_id name username email avatarUrl rating");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = { id: user._id.toString(), name: user.name, username: user.username, email: user.email, avatarUrl: user.avatarUrl, rating: user.rating };
    next();
  } catch (err) {
    console.error("authMiddleware err:", err && err.stack ? err.stack : err);
    return res.status(500).json({ message: "Auth middleware error" });
  }
};
