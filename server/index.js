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
    console.warn(`Warning: could not load ${label} from ${path}: ${err.message}`);
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

// Mount only if route module exists
if (authRoutes) app.use("/auth", authRoutes);
if (problemRoutes) app.use("/problems", problemRoutes);
if (submissionRoutes) app.use("/submissions", submissionRoutes);
if (judgeRoutes) app.use("/judge", judgeRoutes);
if (contestRoutes) app.use("/contests", contestRoutes);
if (teamRoutes) app.use("/teams", teamRoutes);
if (duelRoutes) app.use("/duels", duelRoutes);
if (userRoutes) app.use("/users", userRoutes);

// Simple test route
app.get("/", (req, res) => {
  res.send("API is running");
});

// ---------- Mongo + server startup ----------
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/leetclone", {
    // current driver does not require these options; kept for compatibility logs
  })
  .then(() => {
    console.log("MongoDB connected");

    // create HTTP server and attach socket.io
    const http = require("http");
    const server = http.createServer(app);

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

      // initSockets is expected in server/socket.js
      try {
        const { initSockets } = require("./socket");
        if (typeof initSockets === "function") {
          initSockets(io);
          console.log("Socket handlers initialized");
        } else {
          console.warn("initSockets not found in ./socket");
        }
      } catch (err) {
        console.warn("Could not initialize socket handlers:", err.message);
        if (err.stack) console.warn(err.stack.split("\n").slice(0, 6).join("\n"));
      }
    } catch (err) {
      console.warn(
        "socket.io not installed. Real-time features (duel rooms) will be disabled.\n" +
          "Install it with: (in server folder) npm install socket.io\n" +
          "Error: " + err.message
      );
    }

    server.listen(PORT, () => {
      console.log(`Server ${io ? "+ socket.io " : ""}started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo connection error:", err);
  });


