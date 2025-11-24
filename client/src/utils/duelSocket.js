// client/src/utils/duelSocket.js
import { io } from "socket.io-client";

function getSocketUrl() {
  // If explicitly set, use it
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }
  // If you already have REACT_APP_API_BASE_URL like "http://localhost:5000/api"
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL.replace(/\/api\/?$/, "");
  }
  // Fallback for local dev
  return "http://localhost:5000";
}

const SOCKET_URL = getSocketUrl();

// Named export – if you ever want to call it manually
export function createDuelSocket() {
  // Read JWT from localStorage (same one you use for API calls)
  const token = localStorage.getItem("token");

  return io(SOCKET_URL, {
    transports: ["websocket"],
    auth: { token },
  });
}

// Default export – what DuelRoomPage and Duel.js import as `duelSocket`
export default createDuelSocket;
