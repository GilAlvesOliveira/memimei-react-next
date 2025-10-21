import { useEffect, useMemo, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import FooterLinks from "../components/FooterLinks";
import ProductCard from "../components/ProductCard";
import brands from "../lib/brands";
import { getUsuario, getProdutos, addToCart } from "../services/api";
import {
  getStoredUser,
  getToken,
  clearAuth,
  setPostLoginAction,
} from "../services/storage";

export default function ProdutosPage() {
  const [user, setUser] = useState(null);
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [okMsg, setOkMsg] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
    } else {
      (async () => {
        try {
          const freshUser = await getUsuario();
          setUser(freshUser);
        } catch {
          const local = getStoredUser();
          setUser(local || null);
        }
      })();
    }
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErro("");
        setOkMsg("");
        const data = await getProdutos({ signal: abort.signal });
        setLista(data || []);
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
  };

  const handleAdd = async (produto) => {
    const token = getToken();
    if (!token) {
      setPostLoginAction({
        type: "addToCart",
        data: { produtoId: produto._id, quantidade: 1 },
        redirect: "/produtos",
      });
      window.location.href = "/login";
      return;
    }
    try {
      setErro("");
      setOkMsg("");
      await addToCart({ produtoId: produto._id, quantidade: 1 });
      setOkMsg("Produto adicionado ao carrinho!");
    } catch (e) {
      setErro(e.message || "Falha ao adicionar ao carrinho");
    }
  };

  const handleBuy = async (produto) => {
    const token = getToken();
    if (!token) {
      setPostLoginAction({
        type: "addToCart",
        data: { produtoId: produto._id, quantidade: 1 },
        redirect: "/carrinho",
      });
      window.location.href = "/login";
      return;
    }
    try {
      setErro("");
      await addToCart({ produtoId: produto._id, quantidade: 1 });
      window.location.href = "/carrinho";
    } catch (e) {
      setErro(e.message || "Não foi possível comprar agora");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderBar user={user} onLogout={handleLogout} />

      <main className="flex-1">
        <div className="w-full max-w-screen-md mx-auto px-3 py-6">
          <h1 className="text-xl font-bold mb-1 text-black">Todos os produtos</h1>

          {loading && <div className="text-center text-black">Carregando…</div>}
          {erro && !loading && <div className="text-center text-red-700">{erro}</div>}
          {okMsg && !loading && <div className="text-center text-green-700">{okMsg}</div>}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {lista.map((p) => (
              <ProductCard
                key={p._id}
                produto={p}
                onAdd={handleAdd}
                onBuy={handleBuy}
              />
            ))}
          </div>
        </div>
      </main>

      <FooterLinks />
    </div>
  );
}
