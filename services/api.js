import { getToken, setAuth } from "./storage";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// POST /api/auth/login
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

// GET /api/usuario (precisa do Bearer token)
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

  // data é o usuário (sem senha)
  return data;
}
