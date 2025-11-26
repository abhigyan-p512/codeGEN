// server/index.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// make mongoose available globally to support legacy route/socket files
global.mongoose = mongoose;

// ---------- Middleware ----------
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// ---------- Helper to safely require routes ----------
function safeRequire(path, label) {
  try {
    const mod = require(path);
    console.log(`Loaded routes: ${label} (${path})`);
    return mod;
  } catch (err) {
    console.warn(
      `Warning: could not load ${label} from ${path}: ${err.message}`
    );
    if (err.stack) {
      console.warn(err.stack.split("\n").slice(0, 6).join("\n"));
    }
    return null;
  }
}

// ---------- Routes (safe require) ----------
const authRoutes = safeRequire("./routes/auth", "auth");
const problemRoutes = safeRequire("./routes/problems", "problems");
const submissionRoutes = safeRequire("./routes/submissions", "submissions");
const judgeRoutes = safeRequire("./routes/judge", "judge");
const contestRoutes = safeRequire("./routes/contests", "contests");
const teamRoutes = safeRequire("./routes/teams", "teams");
const duelRoutes = safeRequire("./routes/duels", "duels");
const userRoutes = safeRequire("./routes/users", "users");
// ✅ NEW: team battles
const teamBattleRoutes = safeRequire("./routes/teamBattles", "teamBattles");

// Mount only if route module exists
if (authRoutes) app.use("/auth", authRoutes);
if (problemRoutes) app.use("/problems", problemRoutes);
if (submissionRoutes) app.use("/submissions", submissionRoutes);
if (judgeRoutes) app.use("/judge", judgeRoutes);
if (contestRoutes) app.use("/contests", contestRoutes);
if (teamRoutes) app.use("/teams", teamRoutes);
if (duelRoutes) app.use("/duels", duelRoutes);
if (userRoutes) app.use("/users", userRoutes);
// ✅ mount team battles
if (teamBattleRoutes) app.use("/team-battles", teamBattleRoutes);

app.get("/", (req, res) => {
  res.send("API is running");
});

// ---------- Mongo + server startup ----------
const preferredMongoUri =
  process.env.MONGO_URI || "mongodb://localhost:27017/leetclone";

async function startServer() {
  const http = require("http");
  const server = http.createServer(app);

  async function connectWithRetry(uri, retries = 2, delayMs = 2000) {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        console.log(
          `Attempting MongoDB connect (attempt ${attempt}) -> ${
            uri.includes("mongodb.net") ? "(Atlas SRV)" : uri
          }`
        );
        await mongoose.connect(uri, {});
        console.log("MongoDB connected");
        return;
      } catch (err) {
        console.error(
          `Mongo connection attempt ${attempt} failed:`,
          err.message
        );
        if (attempt <= retries) {
          console.log(`Retrying in ${delayMs} ms...`);
          await new Promise((r) => setTimeout(r, delayMs));
        } else {
          throw err;
        }
      }
    }
  }

  try {
    try {
      await connectWithRetry(preferredMongoUri, 2, 2000);
    } catch (firstErr) {
      console.warn("Primary MongoDB URI failed.");
      const looksLikeAtlas = /mongodb\+srv|mongodb\.net/i.test(
        preferredMongoUri
      );
      if (looksLikeAtlas) {
        console.warn(
          "Detected Atlas SRV URI. Attempting fallback to local MongoDB (mongodb://localhost:27017/leetclone)."
        );
        try {
          await connectWithRetry("mongodb://localhost:27017/leetclone", 1, 1000);
        } catch (fallbackErr) {
          console.error(
            "Fallback to local MongoDB failed:",
            fallbackErr.message
          );
          throw firstErr;
        }
      } else {
        throw firstErr;
      }
    }

    // init socket.io if available
    let io = null;
    try {
      const { Server } = require("socket.io");
      io = new Server(server, {
        cors: {
          origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
          methods: ["GET", "POST"],
          credentials: true,
        },
      });

      const initSockets = require("./socket");
      if (typeof initSockets === "function") {
        initSockets(io);
        console.log("Socket handlers initialized");
      }

      // ✅ make io available everywhere (submissions → team battle scoring)
      global.io = io;
    } catch (err) {
      console.warn("socket.io not available; real-time disabled.");
    }

    server.listen(PORT, () => {
      console.log(`Server ${io ? "+ socket.io " : ""}started on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server due to MongoDB connection error:");
    console.error(err);
    process.exit(1);
  }
}

startServer();
