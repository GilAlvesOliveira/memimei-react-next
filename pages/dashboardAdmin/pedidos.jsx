import { useEffect, useState } from "react";
import HeaderBar from "../../components/HeaderBar";
import FooterLinks from "../../components/FooterLinks";
import AdminGuard from "../../components/AdminGuard";
import { getUsuario, getCartCount, getPedidos } from "../../services/api";
import { getStoredUser, clearAuth, getToken } from "../../services/storage";

export default function AdminPedidosPage() {
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
        const data = await getPedidos();
        setLista(Array.isArray(data) ? data : []);
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
  };

  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col bg-white">
        <HeaderBar user={user} onLogout={handleLogout} cartCount={cartCount} />

        <main className="flex-1">
          <div className="w-full max-w-screen-lg mx-auto px-3 py-6">
            <h1 className="text-2xl font-bold text-black mb-4">Pedidos</h1>

            {loading && <div className="text-black">Carregando…</div>}
            {erro && <div className="text-red-700">{erro}</div>}

            {!loading && !erro && (
              <div className="overflow-auto rounded-xl border">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-slate-100 text-left">
                      <th className="p-3 text-sm font-semibold text-black">#</th>
                      <th className="p-3 text-sm font-semibold text-black">Usuário</th>
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
                        <tr key={p._id} className="border-t">
                          <td className="p-3 text-black">{p._id}</td>
                          <td className="p-3 text-black">{p.usuarioId}</td>
                          <td className="p-3 text-black">{total}</td>
                          <td className="p-3 text-black">{p.status}</td>
                          <td className="p-3 text-black">{criado}</td>
                          <td className="p-3 text-black">
                            {(p.produtos || []).map((it, idx) => (
                              <div key={idx} className="text-sm">
                                {it.produtoId} × {it.quantidade} @{" "}
                                {Number(it.precoUnitario || 0).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </div>
                            ))}
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
