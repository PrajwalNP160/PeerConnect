// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { connectDb } from "./db/db.js";
// import http from "http";
// import { Server } from "socket.io";
// import userRoutes from "./routes/user.routes.js";
// import requestRoutes from "./routes/request.routes.js";
// import exchangeRoutes from "./routes/exchange.routes.js";

// dotenv.config();

// const PORT = process.env.PORT || 8000;

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   origin: "http://localhost:5173",
// });

// app.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   })
// );
// app.use(express.json());
// app.use(express.urlencoded());

// app.use("/api/user", userRoutes);
// app.use("/api/request", requestRoutes);
// app.use("/api/exchange", exchangeRoutes);

// io.on("connection", (socket) => {
//   console.log(`user connected: ${socket.id}`);

//   socket.on("join_room", (roomId) => {
//     socket.join(roomId);
//     socket.to(roomId).emit("user_joined", socket.id);
//   });

//   socket.on("offer", ({ offer, roomId }) => {
//     socket.to(roomId).emit("receive_offer", offer);
//   });

//   socket.on("answer", ({ answer, roomId }) => {
//     socket.to(roomId).emit("receive-answer", answer);
//   });

//   socket.on("ice-candidate", ({ candidate, roomId }) => {
//     socket.to(roomId).emit("receive-candidate", candidate);
//   });
// });

// server.listen(PORT, () => {
//   connectDb()
//     .then(() => {
//       console.log(`Server running on port: ${PORT}`);
//     })
//     .catch((err) => console.log(`Error connecting to db ${err}`));
// });
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDb } from "./db/db.js";
import http from "http";
import { Server } from "socket.io";
import userRoutes from "./routes/user.routes.js";
import requestRoutes from "./routes/request.routes.js";
import exchangeRoutes from "./routes/exchange.routes.js";
import toolsRoutes from "./routes/tools.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import assessmentRoutes from "./routes/assessment.routes.js";
import studyGroupRoutes from "./routes/studyGroup.routes.js";
import mysqlUploadRoutes from "./routes/mysqlUpload.routes.js";
import { connectMySQL } from "./config/mysql.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

let allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
if (process.env.NODE_ENV !== "production" && allowedOrigins.length === 0) {
  allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
}

const app = express();
const server = http.createServer(app);

// ✅ Socket.io CORS (allow any localhost:* in dev)
const socketCorsOrigin =
  process.env.NODE_ENV !== "production"
    ? [/^http:\/\/(localhost|127\.0\.0\.1)(:\\d+)?$/]
    : allowedOrigins;

const io = new Server(server, {
  cors: {
    origin: socketCorsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ Express CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/(localhost|127\.0\.0\.1)(:\\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error("CORS not allowed for this origin"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/user", userRoutes);
app.use("/api/request", requestRoutes);
app.use("/api/exchange", exchangeRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/study-groups", studyGroupRoutes);
app.use("/api/mysql-upload", mysqlUploadRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development" });
});

// Socket.io events
io.on("connection", (socket) => {
  console.log(`user connected: ${socket.id}`);

  // In-memory chat history per room (dev only). For production, replace with DB.
  if (!global.__roomChatHistory) global.__roomChatHistory = new Map();
  // In-memory presence map: roomId -> Map(socketId -> username)
  if (!global.__roomPresence) global.__roomPresence = new Map();

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user_joined", socket.id);
    // Send existing chat history to the new socket
    const history = global.__roomChatHistory.get(roomId) || [];
    socket.emit("chat_history", history);
    // Ensure presence map exists for room
    if (!global.__roomPresence.has(roomId)) {
      global.__roomPresence.set(roomId, new Map());
    }
  });

  socket.on("offer", ({ offer, roomId }) => {
    socket.to(roomId).emit("receive_offer", offer);
  });

  socket.on("answer", ({ answer, roomId }) => {
    socket.to(roomId).emit("receive-answer", answer);
  });

  socket.on("ice-candidate", ({ candidate, roomId }) => {
    socket.to(roomId).emit("receive-candidate", candidate);
  });

  // Collaborative editor events
  socket.on("code_change", ({ room, code }) => {
    socket.to(room).emit("code_change", { code });
  });

  socket.on("stdin_change", ({ room, stdin }) => {
    socket.to(room).emit("stdin_change", { stdin });
  });

  socket.on("language_change", ({ room, language_id }) => {
    socket.to(room).emit("language_change", { language_id });
  });

  // Code execution: Use Judge0 if configured, else stub
  socket.on("execute_code_event", async ({ room, source_code, language_id, stdin }) => {
    try {
      const JUDGE0_URL = process.env.JUDGE0_URL; // e.g., https://judge0-ce.p.rapidapi.com or https://ce.judge0.com
      const JUDGE0_KEY = process.env.JUDGE0_KEY; // optional header key if using RapidAPI

      if (JUDGE0_URL) {
        const payload = {
          source_code,
          language_id,
          stdin,
        };

        // Prefer wait=true for simplicity
        const url = `${JUDGE0_URL.replace(/\/$/, "")}/submissions?base64_encoded=false&wait=true`;
        const headers = {
          "Content-Type": "application/json",
        };
        if (JUDGE0_KEY) headers["X-RapidAPI-Key"] = JUDGE0_KEY;
        if (/rapidapi\.com/i.test(JUDGE0_URL)) {
          headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com";
        }

        const resp = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
        if (!resp.ok) {
          const text = await resp.text();
          socket.emit("executionResult", { stderr: `Execution error ${resp.status}: ${text}` });
          return;
        }
        const data = await resp.json();
        const stdout = data.stdout || "";
        const stderr = data.stderr || data.compile_output || "";
        socket.emit("executionResult", { stdout, stderr });
      } else {
        const stdout = `Execution service not configured.\nLanguage: ${language_id}\nInput: ${stdin}\nCode length: ${source_code?.length || 0}`;
        socket.emit("executionResult", { stdout });
      }
    } catch (e) {
      socket.emit("executionResult", { stderr: `Execution failed: ${e.message}` });
    }
  });

  // Chat events
  socket.on("chat_send", ({ room, user, message }) => {
    if (!room || !message) return;
    const entry = {
      id: Date.now() + Math.random().toString(36).slice(2),
      user: user || "Anon",
      message,
      ts: Date.now(),
    };
    const history = global.__roomChatHistory.get(room) || [];
    history.push(entry);
    // keep last 50
    const trimmed = history.slice(-50);
    global.__roomChatHistory.set(room, trimmed);
    io.to(room).emit("chat_message", entry);
  });

  // Presence: client should call after join with username
  socket.on("presence_identify", ({ roomId, username }) => {
    if (!roomId || !username) return;
    if (!global.__roomPresence.has(roomId)) {
      global.__roomPresence.set(roomId, new Map());
    }
    const roomMap = global.__roomPresence.get(roomId);
    roomMap.set(socket.id, username);
    const users = Array.from(roomMap.values());
    io.to(roomId).emit("presence_update", users);
  });

  // Typing indicators
  socket.on("typing", ({ room, user, isTyping }) => {
    if (!room || !user) return;
    socket.to(room).emit("typing", { user, isTyping: !!isTyping });
  });

  // Cleanup on disconnect
  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      const roomMap = global.__roomPresence.get(roomId);
      if (roomMap) {
        roomMap.delete(socket.id);
        const users = Array.from(roomMap.values());
        io.to(roomId).emit("presence_update", users);
      }
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const startServer = async () => {
  try {
    await connectDb();
    await connectMySQL();
    server.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
      console.log(`Allowed Origins: ${allowedOrigins.join(",")}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
