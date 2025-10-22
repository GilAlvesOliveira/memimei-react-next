import { getToken, setAuth } from "./storage";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/* ========== AUTH ========== */
export async function login(email, senha) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.erro || "Falha no login");
  setAuth({ token: data.token, usuario: data.usuario });
  return data;
}

export async function getUsuario() {
  const token = getToken();
  if (!token) throw new Error("Sem token");
  const res = await fetch(`${BASE_URL}/api/usuario/usuario`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.erro || "Erro ao obter usuário");
  return data;
}

/* ========== PRODUTOS ========== */
export async function getProdutos({ signal } = {}) {
  const res = await fetch(`${BASE_URL}/api/products/produtos`, { signal });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.erro || "Erro ao obter produtos");
  return data;
}

export async function searchProdutos(term, { signal } = {}) {
  const url = new URL(`${BASE_URL}/api/products/busca`);
  url.searchParams.set("q", term);
  const res = await fetch(url.toString(), { signal });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.erro || "Erro na busca");
  return data;
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
  const res = await fetch(`${BASE_URL}/api/carrinho/carrinho`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ produtoId, quantidade }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.erro || "Erro ao adicionar ao carrinho");
  return data;
}

/** GET carrinho do backend: { produtos: [ ...produto, quantidade ] } */
export async function getCart() {
  const token = getToken();
  if (!token) throw new Error("Sem token");
  const res = await fetch(`${BASE_URL}/api/carrinho/carrinho`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.erro || "Erro ao obter carrinho");

  const arr = Array.isArray(payload?.produtos) ? payload.produtos : [];
  // Normaliza para: { produtoId, quantidade, produto, preco }
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
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api/carrinho/item`, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ produtoId }),
  });
  let data = {};
  try {
    data = await res.json();
  } catch (_) {}
  if (!res.ok) throw new Error(data?.erro || "Erro ao diminuir a quantidade");
  return data;
}

/* ========== PEDIDOS + MERCADO PAGO ========== */
export async function createOrder() {
  const token = getToken();
  if (!token) throw new Error("Sem token");
  const res = await fetch(`${BASE_URL}/api/pedidos/pedidos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.erro || "Erro ao criar pedido");
  // data = { msg, pedidoId, total }
  return data;
}

export async function createPreference({ pedidoId, total }) {
  const token = getToken();
  if (!token) throw new Error("Sem token");
  const res = await fetch(`${BASE_URL}/api/mercado_pago/preference`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ pedidoId, total }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.erro || "Erro ao criar preferência");
  // { initPoint, preferenceId }
  return data;
}

export async function getPedidos() {
  const token = getToken();
  if (!token) throw new Error("Sem token");
  const res = await fetch(`${BASE_URL}/api/pedidos/pedidos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.erro || "Erro ao listar pedidos");
  return data; // array
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
  file, // File | Blob opcional
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

  const res = await fetch(`${BASE_URL}/api/products/produtos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }, // NÃO definir Content-Type; o browser seta boundary
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.erro || "Erro ao criar produto");
  return data;
}

export async function adminUpdateProduto({
  id,           // _id do produto
  nome,
  descricao,
  preco,
  estoque,
  categoria,
  cor,
  modelo,
  file,        // File | Blob opcional
}) {
  const token = getToken();
  if (!token) throw new Error("Sem token");

  const fd = new FormData();
  if (nome != null) fd.set("nome", nome);
  if (descricao != null) fd.set("descricao", descricao);
  if (preco != null) fd.set("preco", String(preco));
  if (estoque != null) fd.set("estoque", String(estoque));
  if (categoria != null) fd.set("categoria", categoria);
  if (cor != null) fd.set("cor", cor);
  if (modelo != null) fd.set("modelo", modelo);
  if (file) fd.set("file", file);

  const url = `${BASE_URL}/api/products/produtos?_id=${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }, // sem Content-Type
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.erro || "Erro ao atualizar produto");
  return data;
}

export async function adminDeleteProduto(id) {
  const token = getToken();
  if (!token) throw new Error("Sem token");
  const url = `${BASE_URL}/api/products/produtos?_id=${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.erro || "Erro ao excluir produto");
  return data;
}
