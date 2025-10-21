// Gerência de auth no localStorage
const TOKEN_KEY = "token";
const USER_KEY = "usuario";

export function setAuth({ token, usuario }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (usuario) localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
