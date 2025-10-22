// services/api.js
import { getToken, setAuth } from "./storage";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/** Monta a URL da API. Se BASE_URL não existir, usa a própria origem (rotas /api do Next) */
const buildUrl = (path) => (BASE_URL ? `${BASE_URL}${path}` : path);

async function readJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { erro: text || "Erro inesperado do servidor" };
  }
}

async function handle(res) {
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.erro || "Erro na requisição");
  return data;
}

/* ========== AUTH ========== */
export async function login(email, senha) {
  const res = await fetch(buildUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  const data = await handle(res); // { msg, token, usuario }
  setAuth({ token: data.token, usuario: data.usuario });
  return data;
}

export async function getUsuario() {
  const token = getToken();
  if (!token) throw new Error("Sem token");
  const res = await fetch(buildUrl("/api/usuario/usuario"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle(res);
}

/* ========== PRODUTOS ========== */
export async function getProdutos({ signal } = {}) {
  const res = await fetch(buildUrl("/api/products/produtos"), { signal });
  return handle(res);
}

export async function searchProdutos(term, { signal } = {}) {
  const url = `${buildUrl("/api/products/busca")}?q=${encodeURIComponent(
    term || ""
  )}`;
  const res = await fetch(url, { signal });
  return handle(res);
}

/* ========== CARRINHO ========== */
function toId(val) {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    if (val._id) return toId(val._id);
    if (val.$oid) return String(val.$oid);
  }
  return String(val);
}

export async function addToCart({ produtoId, quantidade = 1 }) {
  const token = getToken();
  if (!token) throw new Error("Sem token");
  const res = await fetch(buildUrl("/api/carrinho/carrinho"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ produtoId, quantidade }),
  });
  return handle(res);
}

export async function getCart() {
  const token = getToken();
  if (!token) throw new Error("Sem token");
  const res = await fetch(buildUrl("/api/carrinho/carrinho"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await handle(res);

  const arr = Array.isArray(payload?.produtos) ? payload.produtos : [];
  return arr.map((p) => {
    const pid = toId(p?._id) || toId(p?.produtoId);
    const preco = Number(p?.preco ?? 0) || 0;
    return {
      produtoId: pid,
      quantidade: Number(p?.quantidade ?? 1) || 1,
      produto: p ? { ...p, _id: pid } : undefined,
      preco,
    };
  });
}

export async function getCartCount() {
  try {
    const itens = await getCart();
    return (itens || []).reduce(
      (acc, it) => acc + (Number(it?.quantidade ?? 1) || 1),
      0
    );
  } catch {
    return 0;
  }
}

export async function decrementCartItem(produtoId) {
  if (!produtoId) throw new Error("produtoId obrigatório");
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(buildUrl("/api/carrinho/item"), {
    method: "DELETE",
    headers,
    body: JSON.stringify({ produtoId }),
  });
  return handle(res);
}

/* ========== PEDIDOS + MERCADO PAGO ========== */
export async function createOrder() {
  const token = getToken();
  if (!token) throw new Error("Sem token");
  const res = await fetch(buildUrl("/api/pedidos/pedidos"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle(res); // { msg, pedidoId, total }
}

export async function createPreference({ pedidoId, total }) {
  const token = getToken();
  if (!token) throw new Error("Sem token");
  const res = await fetch(buildUrl("/api/mercado_pago/preference"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ pedidoId, total }),
  });
  return handle(res); // { initPoint, preferenceId }
}

export async function getPedidos() {
  const token = getToken();
  if (!token) throw new Error("Sem token");
  const res = await fetch(buildUrl("/api/pedidos/pedidos"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle(res); // array
}

/* ========== ADMIN PRODUTOS ========== */
export async function adminCreateProduto({
  nome,
  descricao,
  preco,
  estoque,
  categoria,
  cor,
  modelo,
  file,
}) {
  const token = getToken();
  if (!token) throw new Error("Sem token");

  const fd = new FormData();
  fd.set("nome", nome);
  fd.set("descricao", descricao);
  fd.set("preco", String(preco));
  fd.set("estoque", String(estoque));
  fd.set("categoria", categoria);
  fd.set("cor", cor);
  fd.set("modelo", modelo);
  if (file) fd.set("file", file);

  const res = await fetch(buildUrl("/api/products/produtos"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }, // não setar Content-Type manualmente
    body: fd,
  });
  return handle(res);
}

export async function adminDeleteProduto(id) {
  const token = getToken();
  if (!token) throw new Error("Sem token");
  const url = `${buildUrl("/api/products/produtos")}?_id=${encodeURIComponent(
    id
  )}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle(res);
}
