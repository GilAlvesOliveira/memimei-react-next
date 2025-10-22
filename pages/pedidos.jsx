import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import HeaderBar from "../components/HeaderBar";
import FooterLinks from "../components/FooterLinks";
import { getUsuario, getCartCount, getPedidos, getProdutos } from "../services/api";
import { getStoredUser, getToken, clearAuth, setPostLoginAction } from "../services/storage";

export default function PedidosClientePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [lista, setLista] = useState([]);       // pedidos
  const [produtos, setProdutos] = useState([]); // catálogo para enriquecer itens
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setPostLoginAction({ type: "redirect", redirect: "/pedidos" });
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        // carrega user e badge do carrinho
        const [freshUser, count] = await Promise.all([
          getUsuario().catch(() => getStoredUser() || null),
          getCartCount().catch(() => 0),
        ]);
        setUser(freshUser);
        setCartCount(count);

        // carrega pedidos e catálogo
        setLoading(true);
        setErro("");
        const [pedidosData, produtosData] = await Promise.all([
          getPedidos(),
          getProdutos(),
        ]);
        setLista(Array.isArray(pedidosData) ? pedidosData : []);
        setProdutos(Array.isArray(produtosData) ? produtosData : []);
      } catch (e) {
        setErro(e.message || "Erro ao carregar pedidos");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const mapProduto = useMemo(() => {
    const m = new Map();
    for (const p of produtos) m.set(String(p._id), p);
    return m;
  }, [produtos]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setCartCount(0);
    router.push("/home");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderBar user={user} onLogout={handleLogout} cartCount={cartCount} />

      <main className="flex-1">
        <div className="w-full max-w-screen-lg mx-auto px-3 py-6">
          <h1 className="text-2xl font-bold text-black mb-4">Meus Pedidos</h1>

          {loading && <div className="text-black">Carregando…</div>}
          {erro && !loading && <div className="text-red-700">{erro}</div>}

          {!loading && !erro && lista.length === 0 && (
            <div className="text-black">Você ainda não tem pedidos.</div>
          )}

          <div className="space-y-4">
            {lista.map((pedido) => {
              const totalBRL = Number(pedido.total || 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              });
              const criado = pedido.criadoEm
                ? new Date(pedido.criadoEm).toLocaleString("pt-BR")
                : "-";
              const status = String(pedido.status || "").toLowerCase();
              const statusClass =
                status === "aprovado"
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-yellow-100 text-yellow-800 border-yellow-300";

              return (
                <div key={pedido._id} className="border rounded-xl bg-white overflow-hidden">
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b">
                    <div className="text-black">
                      <div className="font-semibold">Pedido #{pedido._id}</div>
                      <div className="text-sm">Criado em: {criado}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-sm border ${statusClass}`}>
                      Status: {pedido.status}
                    </div>
                  </div>

                  {/* Itens do pedido */}
                  <div className="p-3">
                    <div className="grid grid-cols-1 gap-3">
                      {(pedido.produtos || []).map((it, idx) => {
                        const p = mapProduto.get(String(it.produtoId));
                        const nome = p?.nome || it.produtoId;
                        const modelo = p?.modelo;
                        const cor = p?.cor;
                        const img = p?.imagem;
                        const q = Number(it.quantidade || 0);
                        const unit = Number(it.precoUnitario || 0);
                        const sub = q * unit;

                        const unitBRL = unit.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        });
                        const subBRL = sub.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        });

                        return (
                          <div key={idx} className="flex gap-3">
                            <div className="w-20 h-20 bg-slate-100 grid place-items-center flex-shrink-0 rounded">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              {img ? (
                                <img
                                  src={img}
                                  alt={nome}
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <span className="text-xs text-slate-700">sem imagem</span>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="font-semibold text-black">{nome}</div>
                              <div className="text-sm text-black">
                                {modelo ? <span className="mr-2">{modelo}</span> : null}
                                {cor ? (
                                  <>
                                    · <span className="ml-2">{cor}</span>
                                  </>
                                ) : null}
                              </div>

                              <div className="mt-1 text-sm text-black">
                                Quantidade: <span className="font-semibold">{q}</span>
                              </div>
                              <div className="mt-1 text-sm text-black">
                                Preço unit.: <span className="font-semibold">{unitBRL}</span>
                              </div>
                              <div className="mt-1 text-sm text-black">
                                Subtotal: <span className="font-semibold">{subBRL}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex items-center justify-end">
                      <div className="text-lg font-bold text-black">
                        Total do pedido: {totalBRL}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <FooterLinks />
    </div>
  );
}
