import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import HeaderBar from "../components/HeaderBar";
import FooterLinks from "../components/FooterLinks";
import { getPedidos, getProdutos, getUsuario, getCartCount } from "../services/api";
import { getStoredUser, getToken, clearAuth } from "../services/storage";

export default function PedidosPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [pedidos, setPedidos] = useState([]);
  const [produtosMap, setProdutosMap] = useState({}); // _id -> produto

  const formatCurrency = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );

  useEffect(() => {
    const token = getToken();
    if (!token) {
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

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro("");

        // 1) lista de pedidos
        const listaPedidos = await getPedidos();

        // 2) mapa de produtos para enriquecer os itens (nome, imagem, modelo, preco)
        const todosProdutos = await getProdutos();
        const map = {};
        for (const p of todosProdutos) map[p._id] = p;

        setProdutosMap(map);
        setPedidos(listaPedidos);
      } catch (e) {
        setErro(e.message || "Erro ao carregar pedidos");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setCartCount(0);
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <HeaderBar user={user} onLogout={handleLogout} cartCount={cartCount} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-black mb-4">Meus Pedidos</h1>

        {erro && <div className="text-red-600 mb-4">{erro}</div>}

        {loading ? (
          <div className="text-black">Carregando pedidos...</div>
        ) : pedidos.length === 0 ? (
          <p className="text-gray-600">Você ainda não tem pedidos.</p>
        ) : (
          <div className="space-y-6">
            {pedidos.map((pedido) => (
              <div
                key={pedido._id}
                className="rounded-lg border border-gray-300 p-4 shadow-sm bg-white"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-lg text-black">
                      Pedido #{pedido._id}
                    </h3>
                    <p className="text-sm text-gray-700">
                      Data:{" "}
                      {pedido.criadoEm
                        ? new Date(pedido.criadoEm).toLocaleString("pt-BR")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        pedido.status === "aprovado"
                          ? "bg-green-100 text-green-700"
                          : pedido.status === "pendente"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {pedido.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-black font-semibold mb-2">Itens</h4>
                  <ul className="space-y-3">
                    {pedido.produtos?.map((item, idx) => {
                      const prod = produtosMap[item.produtoId];
                      const nome = prod?.nome || `Produto ${item.produtoId}`;
                      const imagem = prod?.imagem;
                      const modelo = prod?.modelo ? ` • ${prod.modelo}` : "";
                      const preco = item.precoUnitario ?? prod?.preco ?? 0;

                      return (
                        <li
                          key={`${item.produtoId}-${idx}`}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            {imagem ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={imagem}
                                alt={nome}
                                className="w-12 h-12 rounded object-cover border"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-gray-200 border" />
                            )}
                            <div className="text-black">
                              <div className="font-medium">{nome}{modelo}</div>
                              <div className="text-sm text-gray-700">
                                {item.quantidade}x {formatCurrency.format(preco)}
                              </div>
                            </div>
                          </div>
                          <div className="text-black font-semibold">
                            {formatCurrency.format(preco * (item.quantidade || 1))}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <div className="text-black text-lg font-bold">
                    Total: {formatCurrency.format(pedido.total || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <FooterLinks />
    </div>
  );
}
