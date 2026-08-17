import { API_URL } from "./api";

let socket = null;
let currentToken = null;
let reconnectTimer = null;
let reconnectDelay = 1000;
const listeners = new Set();

function wsBase() {
  return API_URL.replace(/^http/, "ws").replace(/\/$/, "");
}

function clearReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function openSocket(token) {
  const url = `${wsBase()}/ws/user?token=${encodeURIComponent(token)}`;
  const ws = new WebSocket(url);
  socket = ws;

  ws.onmessage = (event) => {
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

  ws.onopen = () => {
    reconnectDelay = 1000;
  };

  ws.onclose = () => {
    // Only clear the module reference if this socket is still the active one.
    if (socket === ws) socket = null;
    // Intentional closes (logout, unmount, token swap) must not reconnect.
    if (ws._intentional) return;
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (currentToken) openSocket(currentToken);
    }, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 15000);
  };

  ws.onerror = () => {
    try {
      ws.close();
    } catch {
      /* noop */
    }
  };
}

export function connectUserSocket(token) {
  if (!token) return;
  // Token changed while a socket is open: replace it.
  if (socket && currentToken && currentToken !== token && socket.readyState !== WebSocket.CLOSED) {
    socket._intentional = true;
    try {
      socket.close();
    } catch {
      /* noop */
    }
    socket = null;
  }
  currentToken = token;
  clearReconnect();
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }
  openSocket(token);
}

export function disconnectUserSocket() {
  clearReconnect();
  currentToken = null;
  if (socket) {
    socket._intentional = true;
    try {
      socket.close();
    } catch {
      /* noop */
    }
    socket = null;
  }
}

export function onSocketEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
