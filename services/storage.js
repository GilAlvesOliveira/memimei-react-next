// Gerência de auth e ações pós-login no localStorage
const TOKEN_KEY = "token";
const USER_KEY = "usuario";
const POST_LOGIN_ACTION_KEY = "postLoginAction";

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

// ===== Ações pós-login (ex.: adicionar ao carrinho, redirecionar) =====
export function setPostLoginAction(action) {
  // action: { type: 'addToCart', data: { produtoId, quantidade }, redirect: '/rota' }
  // action: { type: 'redirect', redirect: '/rota' }
  if (typeof window === "undefined") return;
  localStorage.setItem(POST_LOGIN_ACTION_KEY, JSON.stringify(action));
}

export function getPostLoginAction() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(POST_LOGIN_ACTION_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPostLoginAction() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(POST_LOGIN_ACTION_KEY);
}

/**
 * Logout global → sempre vai para /home (independente de onde estiver).
 * Usa replace para não deixar a página anterior no histórico.
 */
export function logoutToHome() {
  if (typeof window === "undefined") return;
  clearAuth();
  window.location.replace("/login");
}
