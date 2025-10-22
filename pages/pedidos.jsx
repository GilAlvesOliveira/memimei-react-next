import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import HeaderBar from "../components/HeaderBar";
import FooterLinks from "../components/FooterLinks";
import { getUsuario, getCartCount, getPedidos, getProdutos } from "../services/api";
import {
  getStoredUser,
  getToken,
  clearAuth,
  setPostLoginAction,
} from "../services/storage";

export default function PedidosClientePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const [lista, setLista] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // Carrega usuário e badge do carrinho
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setPostLoginAction({ type: "redirect", redirect: "/pedidos" });
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const [freshUser, count] = await Promise.all([
          getUsuario().catch(() => getStoredUser() || null),
          getCartCount().catch(() => 0),
        ]);
        setUser(freshUser);
        setCartCount(count);
      } catch {
        setUser(getStoredUser() || null);
        setCartCount(0);
      }
    })();
  }, [router]);

  // Carrega pedidos do próprio usuário + catálogo para mapear nomes
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErro("");
        const [pedidos, cat] = await Promise.all([
          getPedidos(),      // backend retorna apenas os pedidos do usuário se role != admin
          getProdutos(),     // para mapear id -> nome/modelo/cor
        ]);
        setLista(Array.isArray(pedidos) ? pedidos : []);
        setProdutos(Array.isArray(cat) ? cat : []);
      } catch (e) {
        setErro(e.message || "Erro ao carregar seus pedidos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const byId = useMemo(() => {
    const m = new Map();
    for (const p of produtos) {
      if (p && p._id) m.set(String(p._id), p);
    }
    return m;
  }, [produtos]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setCartCount(0);
    router.push("/login"); // sair sempre leva ao login
  };

  const badge = (status) => {
    const s = String(status || "").toLowerCase();
    const base = "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold";
    if (s === "aprovado") return <span className={`${base} bg-green-100 text-green-700`}>Aprovado</span>;
    if (s === "pendente") return <span className={`${base} bg-yellow-100 text-yellow-800`}>Pendente</span>;
    return <span className={`${base} bg-slate-200 text-slate-700`}>{status || "-"}</span>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderBar user={user} onLogout={handleLogout} cartCount={cartCount} />

      <main className="flex-1">
        <div className="w-full max-w-screen-lg mx-auto px-3 py-6">
          <h1 className="text-2xl font-bold text-black mb-4">Meus Pedidos</h1>

          {loading && <div className="text-black">Carregando…</div>}
          {erro && <div className="text-red-700">{erro}</div>}

          {!loading && !erro && lista.length === 0 && (
            <div className="text-black">Você ainda não possui pedidos.</div>
          )}

          {!loading && !erro && lista.length > 0 && (
            <div className="overflow-auto rounded-xl border">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="p-3 text-sm font-semibold text-black">Total</th>
                    <th className="p-3 text-sm font-semibold text-black">Status</th>
                    <th className="p-3 text-sm font-semibold text-black">Criado em</th>
                    <th className="p-3 text-sm font-semibold text-black">Itens</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((p) => {
                    const total = Number(p.total || 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    });
                    const criado = p.criadoEm
                      ? new Date(p.criadoEm).toLocaleString("pt-BR")
                      : "-";

                    return (
                      <tr key={p._id} className="border-t align-top">
                        <td className="p-3 text-black">{total}</td>
                        <td className="p-3">{badge(p.status)}</td>
                        <td className="p-3 text-black">{criado}</td>
                        <td className="p-3 text-black">
                          {(p.produtos || []).map((it, idx) => {
                            const pid = String(it.produtoId || "");
                            const ref = byId.get(pid);
                            const nome = ref?.nome || `Produto`;
                            const modelo = ref?.modelo ? ` • ${ref.modelo}` : "";
                            const cor = ref?.cor ? ` • ${ref.cor}` : "";
                            const qtd = it.quantidade || 1;
                            const unit = Number(it.precoUnitario ?? 0).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            });
                            return (
                              <div key={idx} className="text-sm mb-1">
                                {nome}{modelo}{cor} — {qtd} × {unit}
                              </div>
                            );
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <FooterLinks />
    </div>
  );
}
