import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import HeaderBar from "../../components/HeaderBar";
import FooterLinks from "../../components/FooterLinks";
import AdminGuard from "../../components/AdminGuard";
import { getUsuario, getCartCount, getPedidos, getProdutos } from "../../services/api";
import { getStoredUser, clearAuth, getToken } from "../../services/storage";

// util p/ normalizar possíveis formatos de _id
function toId(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    if (val._id) return toId(val._id);
    if (val.$oid) return String(val.$oid);
  }
  try {
    return String(val);
  } catch {
    return "";
  }
}

export default function AdminPedidosPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [lista, setLista] = useState([]);
  const [produtos, setProdutos] = useState([]); // novo: catálogo para buscar imagens
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setCartCount(0);
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
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErro("");
        // carrega pedidos e catálogo de produtos (para mapear imagens)
        const [pedidos, prods] = await Promise.all([
          getPedidos(),
          getProdutos({ signal: abort.signal }),
        ]);
        setLista(Array.isArray(pedidos) ? pedidos : []);
        setProdutos(Array.isArray(prods) ? prods : []);
        if (Array.isArray(pedidos) && pedidos.length > 0) {
          // eslint-disable-next-line no-console
          console.log("Pedidos(admin) exemplo:", pedidos[0]);
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          setErro(e.message || "Erro ao carregar pedidos");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => abort.abort();
  }, []);

  // map id -> produto
  const produtoMap = useMemo(() => {
    const map = new Map();
    (produtos || []).forEach((p) => map.set(toId(p._id), p));
    return map;
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
    <AdminGuard>
      <div className="min-h-screen flex flex-col bg-white">
        <HeaderBar user={user} onLogout={handleLogout} cartCount={cartCount} />

        <main className="flex-1">
          <div className="w-full max-w-screen-xl mx-auto px-3 py-6">
            <h1 className="text-2xl font-bold text-black mb-4">Pedidos</h1>

            {loading && <div className="text-black">Carregando…</div>}
            {erro && <div className="text-red-700">{erro}</div>}

            {!loading && !erro && (
              <div className="overflow-auto rounded-xl border">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-slate-100 text-left">
                      <th className="p-3 text-sm font-semibold text-black">Cliente</th>
                      <th className="p-3 text-sm font-semibold text-black">Contato</th>
                      <th className="p-3 text-sm font-semibold text-black">Endereço</th>
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

                      // pode vir do backend (admin) como p.usuarioInfo; senão fazemos fallback
                      const u = p.usuarioInfo || {};
                      const nome = u.nome || "(sem nome)";
                      const email = u.email || "";
                      const telefone = u.telefone || "-";
                      const endereco = u.endereco || "-";

                      return (
                        <tr key={p._id} className="border-t align-top">
                          <td className="p-3 text-black">
                            <div className="font-semibold">{nome}</div>
                            {email && <div className="text-sm text-slate-700">{email}</div>}
                          </td>
                          <td className="p-3 text-black">{telefone}</td>
                          <td className="p-3 text-black">
                            <div className="whitespace-pre-wrap">{endereco}</div>
                          </td>
                          <td className="p-3 text-black">{total}</td>
                          <td className="p-3">{badge(p.status)}</td>
                          <td className="p-3 text-black">{criado}</td>
                          <td className="p-3 text-black">
                            {(p.produtos || []).map((it, idx) => {
                              const pid = toId(it.produtoId);
                              const prod = produtoMap.get(pid) || {};
                              const img = prod.imagem || null;

                              const nomeProd = it.nome || prod.nome || `Produto ${pid}`;
                              const qtd = it.quantidade || 1;
                              const unit = Number(it.precoUnitario ?? it.preco ?? 0).toLocaleString(
                                "pt-BR",
                                { style: "currency", currency: "BRL" }
                              );

                              return (
                                <div key={idx} className="text-sm mb-1 flex items-center gap-2">
                                  {/* thumb pequena */}
                                  <div className="w-7 h-7 bg-slate-100 rounded overflow-hidden flex-shrink-0 grid place-items-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    {img ? (
                                      <img
                                        src={img}
                                        alt={nomeProd}
                                        className="max-w-full max-h-full object-contain"
                                      />
                                    ) : (
                                      <span className="text-[8px] text-slate-600 px-1">—</span>
                                    )}
                                  </div>
                                  <div className="truncate">
                                    <span className="font-semibold">{nomeProd}</span>{" "}
                                    — {qtd} × {unit}
                                  </div>
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
    </AdminGuard>
  );
}
