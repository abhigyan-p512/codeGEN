// server/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization || "";
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing Authorization header" });
    }
    const token = auth.split(" ")[1];

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
    } catch (err) {
      console.error("[AUTH DBG] jwt.verify error:", err && err.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = payload.id || payload.userId || payload._id;
    if (!userId) {
      return res.status(401).json({ message: "Token missing user id" });
    }

    const user = await User.findById(userId).select(
      "_id name username email avatarUrl rating"
    );
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // 🔧 expose both id and userId for compatibility
    req.user = {
      id: user._id.toString(),
      userId: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      rating: user.rating,
    };

    next();
  } catch (err) {
    console.error("authMiddleware err:", err);
    return res.status(500).json({ message: "Auth middleware error" });
  }
};
