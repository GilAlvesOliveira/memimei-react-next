import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import HeaderBar from "../../components/HeaderBar";
import FooterLinks from "../../components/FooterLinks";
import ProductCard from "../../components/ProductCard";
import { categoryFromSlug, labelFromSlug } from "../../lib/brandMap";

import {
  getProdutos,
  addToCart,
  getUsuario,
  getCartCount,
} from "../../services/api";
import {
  getStoredUser,
  getToken,
  clearAuth,
  setPostLoginAction,
} from "../../services/storage";

export default function ProdutosPorMarcaPage() {
  const router = useRouter();
  const { marca } = router.query;

  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Nome bonitinho da marca p/ título
  const pageTitle = useMemo(() => labelFromSlug(marca), [marca]);

  // Categoria que o backend grava no campo "categoria"
  const categoriaEsperada = useMemo(() => categoryFromSlug(marca), [marca]);

  // Carrega usuário/carrinho (se logado)
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

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setCartCount(0);
  };

  // Carrega produtos da API (sem filtro por estoque)
  useEffect(() => {
    if (!router.isReady) return;
    const ctrl = new AbortController();
    setLoading(true);
    setErr("");
    getProdutos({ signal: ctrl.signal })
      .then((lista) => {
        const arr = Array.isArray(lista) ? lista : [];

        // ⚠️ Filtra APENAS pela categoria/“marca” (sem checar estoque)
        // Ex.: Apple -> categoria "Iphone"
        const cat = String(categoriaEsperada || "").trim().toLowerCase();

        const resultado = cat
          ? arr.filter((p) => {
              const c = String(p?.categoria || "").trim().toLowerCase();
              return c === cat || c.includes(cat);
            })
          : arr;

        setProdutos(resultado);
      })
      .catch((e) => setErr(e?.message || "Erro ao carregar produtos"))
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [router.isReady, categoriaEsperada]);

  // Adicionar ao carrinho (respeita bloqueio no backend também)
  async function handleAdd(produto) {
    // Se não logado, guarda intenção e manda para login
    if (!user) {
      setPostLoginAction({
        type: "addToCart",
        data: { produtoId: String(produto?._id), quantidade: 1 },
        redirect: "/carrinho",
      });
      router.push("/login");
      return;
    }
    try {
      await addToCart({ produtoId: String(produto?._id), quantidade: 1 });
      setCartCount((n) => Number(n || 0) + 1);
      alert("Adicionado ao carrinho!");
    } catch (e) {
      alert(e?.message || "Erro ao adicionar");
    }
  }

  async function handleBuy(produto) {
    await handleAdd(produto);
    router.push("/carrinho");
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderBar user={user} onLogout={handleLogout} cartCount={cartCount} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">
          {pageTitle ? `Produtos — ${pageTitle}` : "Produtos"}
        </h1>

        {loading ? (
          <div>Carregando...</div>
        ) : err ? (
          <div className="text-red-600">{err}</div>
        ) : produtos.length === 0 ? (
          <div>Nenhum produto encontrado.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {produtos.map((p) => (
              <ProductCard
                key={String(p?._id || Math.random())}
                produto={p}
                onAdd={handleAdd}
                onBuy={handleBuy}
              />
            ))}
          </div>
        )}
      </main>

      <FooterLinks />
    </div>
  );
}
