import { getToken, setAuth } from "./storage";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * POST /api/auth/login
 */
export async function login(email, senha) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.erro || "Falha no login");
  }

  // data = { msg, token, usuario }
  setAuth({ token: data.token, usuario: data.usuario });
  return data;
}

/**
 * GET /api/usuario  (requer Bearer token)
 */
export async function getUsuario() {
  const token = getToken();
  if (!token) throw new Error("Sem token");

  const res = await fetch(`${BASE_URL}/api/usuario`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.erro || "Erro ao obter usuário");
  }

  return data; // usuário sem senha
}

/**
 * GET /api/products/produtos  (lista todos os produtos)
 */
export async function getProdutos({ signal } = {}) {
  const res = await fetch(`${BASE_URL}/api/products/produtos`, { signal });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.erro || "Erro ao obter produtos");
  }
  return data; // array de produtos
}

/**
 * POST /api/carrinho/carrinho  (adicionar item)
 * body: { produtoId, quantidade }
 */
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
  if (!res.ok) {
    throw new Error(data?.erro || "Erro ao adicionar ao carrinho");
  }

  return data; // ex.: { msg, carrinho } (depende do backend)
}

/** Util: extrai um ID string de diferentes formatos */
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

/**
 * GET /api/carrinho/carrinho  (listar itens do carrinho)
 * Normaliza para: [{ produtoId, quantidade, produto, preco }]
 * e enriquece buscando detalhes na lista global de produtos.
 */
export async function getCart({ enrich = true } = {}) {
  const token = getToken();
  if (!token) throw new Error("Sem token");

  const res = await fetch(`${BASE_URL}/api/carrinho/carrinho`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.erro || "Erro ao obter carrinho");
  }

  let itens = [];
  if (Array.isArray(payload)) {
    itens = payload;
  } else if (payload?.produtos) {
    itens = payload.produtos.map((p) => {
      const pid = toId(p.produtoId) || toId(p.produto?._id) || toId(p._id) || null;
      return {
        produtoId: pid,
        quantidade: Number(p.quantidade ?? 1) || 1,
        produto:
          typeof p.produto === "object" && p.produto
            ? { ...p.produto, _id: toId(p.produto?._id) || pid }
            : undefined,
        preco: Number(p.preco ?? 0) || undefined,
      };
    });
  } else if (payload?.itens || payload?.items) {
    const arr = payload.itens || payload.items || [];
    itens = arr.map((p) => ({
      produtoId: toId(p.produtoId) || toId(p.produto?._id) || null,
      quantidade: Number(p.quantidade ?? p.qtd ?? p.qty ?? 1) || 1,
      produto:
        typeof p.produto === "object" && p.produto
          ? { ...p.produto, _id: toId(p.produto?._id) }
          : undefined,
      preco: Number(p.preco ?? 0) || undefined,
    }));
  }

  if (!enrich) return itens;

  const todosProdutos = await getProdutos();
  const map = new Map((todosProdutos || []).map((prod) => [toId(prod._id), prod]));

  const enriquecidos = itens.map((it) => {
    const prodDetalhe =
      it.produto || (it.produtoId ? map.get(toId(it.produtoId)) : null) || null;

    const precoUnit = Number((prodDetalhe && prodDetalhe.preco) ?? it.preco ?? 0) || 0;

    return {
      ...it,
      produto: prodDetalhe,
      preco: precoUnit,
    };
  });

  return enriquecidos;
}

/**
 * Contagem total de itens do carrinho (soma das quantidades)
 */
export async function getCartCount() {
  const token = getToken();
  if (!token) return 0;
  try {
    const itens = await getCart({ enrich: false });
    return (itens || []).reduce(
      (acc, it) => acc + (Number(it?.quantidade ?? 1) || 1),
      0
    );
  } catch {
    return 0;
  }
}

/**
 * DELETE /api/carrinho/item  (diminui 1 unidade do item no carrinho)
 * Tenta primeiro enviar no body { produtoId, quantidade: 1 }.
 * Se o backend não aceitar body em DELETE, tenta com querystring (?produtoId=...&quantidade=1).
 */
export async function decrementCartItem(produtoId) {
  if (!produtoId) throw new Error("produtoId obrigatório");
  const token = getToken();
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  headers["Content-Type"] = "application/json";

  // Tentativa 1: DELETE com body JSON
  try {
    const res = await fetch(`${BASE_URL}/api/carrinho/item`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ produtoId, quantidade: 1 }),
    });
    let data = {};
    try {
      data = await res.json();
    } catch (_) {}
    if (res.ok) return data;
  } catch (_) {}

  // Tentativa 2: DELETE com query string
  const urlQS = `${BASE_URL}/api/carrinho/item?produtoId=${encodeURIComponent(
    produtoId
  )}&quantidade=1`;
  const res2 = await fetch(urlQS, {
    method: "DELETE",
    headers,
  });
  let data2 = {};
  try {
    data2 = await res2.json();
  } catch (_) {}
  if (!res2.ok) {
    throw new Error(data2?.erro || "Erro ao diminuir a quantidade");
  }
  return data2;
}
