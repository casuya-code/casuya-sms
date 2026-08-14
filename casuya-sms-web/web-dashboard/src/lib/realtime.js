import { API_URL } from "./api";

let socket = null;
const listeners = new Set();

function wsBase() {
  return API_URL.replace(/^http/, "ws").replace(/\/$/, "");
}

export function connectUserSocket(token) {
  if (!token) return;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }
  const url = `${wsBase()}/ws/user?token=${encodeURIComponent(token)}`;
  socket = new WebSocket(url);

  socket.onmessage = (event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }
    listeners.forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error("socket listener error:", err);
      }
    });
  };

  socket.onclose = () => {
    socket = null;
  };

  socket.onerror = () => {
    try {
      socket.close();
    } catch {
      /* noop */
    }
  };
}

export function disconnectUserSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

export function onSocketEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
