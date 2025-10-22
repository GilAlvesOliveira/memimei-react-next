import { useEffect, useState } from "react";
import HeaderBar from "../../components/HeaderBar";
import FooterLinks from "../../components/FooterLinks";
import AdminGuard from "../../components/AdminGuard";
import { getUsuario, getProdutos, getCartCount } from "../../services/api";
import { getStoredUser, clearAuth, getToken } from "../../services/storage";

export default function AdminProdutosPage() {
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
    const abort = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErro("");
        const data = await getProdutos({ signal: abort.signal });
        setLista(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") {
          setErro(e.message || "Erro ao carregar produtos");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => abort.abort();
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
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-black">Produtos</h1>

              {/* Botões futuros: Novo produto / Importar etc. */}
              <div className="flex gap-2">
                <button
                  disabled
                  className="px-3 py-2 rounded-lg border border-black text-black opacity-50 cursor-not-allowed"
                  title="Em breve"
                >
                  Novo produto
                </button>
              </div>
            </div>

            {loading && <div className="text-black">Carregando…</div>}
            {erro && <div className="text-red-700">{erro}</div>}

            {!loading && !erro && (
              <div className="overflow-auto rounded-xl border">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-slate-100 text-left">
                      <th className="p-3 text-sm font-semibold text-black">Imagem</th>
                      <th className="p-3 text-sm font-semibold text-black">Nome</th>
                      <th className="p-3 text-sm font-semibold text-black">Modelo</th>
                      <th className="p-3 text-sm font-semibold text-black">Categoria</th>
                      <th className="p-3 text-sm font-semibold text-black">Cor</th>
                      <th className="p-3 text-sm font-semibold text-black">Preço</th>
                      <th className="p-3 text-sm font-semibold text-black">Estoque</th>
                      <th className="p-3 text-sm font-semibold text-black">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((p) => {
                      const preco = Number(p?.preco || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      });
                      return (
                        <tr key={p._id} className="border-t">
                          <td className="p-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.imagem}
                              alt={p.nome}
                              className="h-14 w-14 object-contain bg-slate-50 rounded"
                            />
                          </td>
                          <td className="p-3 text-black">{p.nome}</td>
                          <td className="p-3 text-black">{p.modelo}</td>
                          <td className="p-3 text-black">{p.categoria}</td>
                          <td className="p-3 text-black">{p.cor}</td>
                          <td className="p-3 text-black">{preco}</td>
                          <td className="p-3 text-black">{p.estoque}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                disabled
                                className="px-2 py-1 rounded border border-black text-black text-sm opacity-50 cursor-not-allowed"
                                title="Editar (em breve)"
                              >
                                Editar
                              </button>
                              <button
                                disabled
                                className="px-2 py-1 rounded border border-red-700 text-red-700 text-sm opacity-50 cursor-not-allowed"
                                title="Excluir (em breve)"
                              >
                                Excluir
                              </button>
                            </div>
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
