import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import HeaderBar from "../../components/HeaderBar";
import FooterLinks from "../../components/FooterLinks";
import AdminGuard from "../../components/AdminGuard";
import { getUsuario, getCartCount, getPedidos } from "../../services/api";
import { getStoredUser, clearAuth, getToken } from "../../services/storage";

export default function AdminPedidosPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [lista, setLista] = useState([]);
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
    (async () => {
      try {
        setLoading(true);
        setErro("");
        const data = await getPedidos(); // backend agora pode devolver usuarioInfo e nomes dos produtos
        setLista(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          // ajuda a diagnosticar rapidamente a forma dos dados
          // eslint-disable-next-line no-console
          console.log("Pedidos(admin) exemplo:", data[0]);
        }
      } catch (e) {
        setErro(e.message || "Erro ao carregar pedidos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
                              // backend admin agora pode anexar nome/modelo/cor/preco na linha do item
                              const nomeProd = it.nome || `Produto ${it.produtoId}`;
                              const qtd = it.quantidade || 1;
                              const unit = Number(it.precoUnitario ?? it.preco ?? 0).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              });
                              return (
                                <div key={idx} className="text-sm mb-1">
                                  {nomeProd} — {qtd} × {unit}
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
