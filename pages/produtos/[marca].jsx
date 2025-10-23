import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import HeaderBar from "../../components/HeaderBar";
import FooterLinks from "../../components/FooterLinks";
import ProductCard from "../../components/ProductCard";
import { getUsuario, getProdutos, addToCart, getCart, getCartCount } from "../../services/api";
import {
  getStoredUser,
  getToken,
  clearAuth,
  setPostLoginAction,
} from "../../services/storage";
import { categoryFromSlug, labelFromSlug } from "../../lib/brandMap";

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

export default function ProdutosPorMarcaPage() {
  const router = useRouter();
  const { marca } = router.query; // slug na URL
  const categoriaAlvo = categoryFromSlug(marca);
  const label = labelFromSlug(marca);

  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // carregar usuário e quantidade do carrinho para o Header
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

  // carregar todos produtos e filtrar pela categoria da marca
  useEffect(() => {
    if (!marca) return;
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
  }, [marca]);

  // primeiro filtra por categoria; depois remove os com estoque 0
  const filtrados = useMemo(() => {
    const catOk = (lista || []).filter(
      (p) => String(p.categoria || "").toLowerCase() === String(categoriaAlvo || "").toLowerCase()
    );
    return catOk.filter((p) => Number(p?.estoque ?? 0) > 0);
  }, [lista, categoriaAlvo]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setCartCount(0);
    window.location.href = "/home";
  };

  async function jaAtingiuLimite(produto) {
    const estoque = Number(produto?.estoque ?? 0) || 0;
    if (estoque <= 0) return true;

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
      return false;
    }
  }

  // Adicionar ao carrinho (fica na tela)
  const handleAdd = async (produto) => {
    const token = getToken();
    if (!token) {
      setPostLoginAction({
        type: "addToCart",
        data: { produtoId: produto._id, quantidade: 1 },
        redirect: router.asPath, // volta para esta página após login
      });
      router.push("/login");
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
      setOkMsg("Produto adicionado ao carrinho!");

      // atualiza o badge
      const count = await getCartCount().catch(() => null);
      if (typeof count === "number") setCartCount(count);

      // revalida pós-add
      if (await jaAtingiuLimite(produto)) {
        setOkMsg("Produto adicionado. Você atingiu o limite disponível deste item.");
      }
    } catch (e) {
      setErro(e.message || "Falha ao adicionar ao carrinho");
    }
  };

  // Comprar (add + ir para /carrinho)
  const handleBuy = async (produto) => {
    const token = getToken();
    if (!token) {
      // sem login → após login, adiciona e vai pro carrinho
      setPostLoginAction({
        type: "addToCart",
        data: { produtoId: produto._id, quantidade: 1 },
        redirect: "/carrinho",
      });
      router.push("/login");
      return;
    }

    try {
      setErro("");

      if (await jaAtingiuLimite(produto)) {
        setErro("Você já atingiu o limite do estoque disponível para este produto.");
        return;
      }

      await addToCart({ produtoId: produto._id, quantidade: 1 });
      router.push("/carrinho");
    } catch (e) {
      setErro(e.message || "Não foi possível comprar agora");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderBar user={user} onLogout={handleLogout} cartCount={cartCount} />

      {/* SOMENTE PRODUTOS */}
      <main className="flex-1">
        <div className="w-full max-w-screen-md mx-auto px-3 py-6">
          <h1 className="text-xl font-bold mb-1 text-black">Produtos {label}</h1>

          {loading && <div className="text-center text-black">Carregando…</div>}
          {erro && !loading && <div className="text-center text-red-700">{erro}</div>}
          {okMsg && !loading && <div className="text-center text-green-700">{okMsg}</div>}
          {!loading && !erro && filtrados.length === 0 && (
            <div className="text-center text-black">
              Nenhum produto disponível para {label}.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtrados.map((p) => (
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
