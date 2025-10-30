import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.MODE === "development"
    ? "http://localhost:8000"
    : "https://skillswap-h4b.onrender.com");

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

// Debug logs
socket.on("connect", () => {
  console.log("✅ Connected to server. Socket ID:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
});

export default socket;
