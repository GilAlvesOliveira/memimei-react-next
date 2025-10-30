import { useEffect, useMemo, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import FooterLinks from "../components/FooterLinks";
import ProductCard from "../components/ProductCard";
import { getUsuario, getProdutos, addToCart, getCart } from "../services/api";
import {
  getStoredUser,
  getToken,
  clearAuth,
  setPostLoginAction,
} from "../services/storage";

function toId(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    if (val.$oid) return String(val.$oid);
    if (val._id) return toId(val._id);
    if (val.produtoId) return toId(val.produtoId);
  }
  return String(val);
}
function sameId(a, b) {
  return toId(a) === toId(b);
}

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
    window.location.href = "/home";
  };

  // filtra produtos com estoque > 0
  const exibidos = useMemo(() => {
    return (lista || []).filter((p) => Number(p?.estoque ?? 0) > 0);
  }, [lista]);

  async function jaAtingiuLimite(produto) {
    const estoque = Number(produto?.estoque ?? 0) || 0;
    if (estoque <= 0) return true;

    // confere o carrinho atual no backend
    try {
      const cart = await getCart();
      const totalDesteProduto = (cart || []).reduce((acc, it) => {
        const pid = it?.produtoId || it?.produto?._id || it?._id || it?.produtoId;
        return sameId(pid, produto._id)
          ? acc + (Number(it?.quantidade ?? 0) || 0)
          : acc;
      }, 0);
      return totalDesteProduto >= estoque;
    } catch {
      // se não deu pra ler o carrinho, deixamos o backend ser a trava final
      return false;
    }
  }

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

      if (await jaAtingiuLimite(produto)) {
        setErro("Você já atingiu o limite do estoque disponível para este produto.");
        return;
      }

      await addToCart({ produtoId: produto._id, quantidade: 1 });

      // revalida depois de adicionar
      if (await jaAtingiuLimite(produto)) {
        setOkMsg("Produto adicionado. Você atingiu o limite disponível deste item.");
      } else {
        setOkMsg("Produto adicionado ao carrinho!");
      }
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

      if (await jaAtingiuLimite(produto)) {
        setErro("Você já atingiu o limite do estoque disponível para este produto.");
        return;
      }

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
            {exibidos.map((p) => (
              <ProductCard key={p._id} produto={p} onAdd={handleAdd} onBuy={handleBuy} />
            ))}
          </div>
        </div>
      </main>

      <FooterLinks />
    </div>
  );
}
