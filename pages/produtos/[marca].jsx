import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import HeaderBar from "../../components/HeaderBar";
import FooterLinks from "../../components/FooterLinks";
import ProductCard from "../../components/ProductCard";
import { getUsuario, getProdutos, addToCart } from "../../services/api";
import {
  getStoredUser,
  getToken,
  clearAuth,
  setPostLoginAction,
} from "../../services/storage";
import { categoryFromSlug, labelFromSlug } from "../../lib/brandMap";

export default function ProdutosPorMarcaPage() {
  const router = useRouter();
  const { marca } = router.query; // slug na URL
  const categoriaAlvo = categoryFromSlug(marca);
  const label = labelFromSlug(marca);

  const [user, setUser] = useState(null);
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // carregar usuário para o Header
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    (async () => {
      try {
        const freshUser = await getUsuario();
        setUser(freshUser);
      } catch {
        const local = getStoredUser();
        setUser(local || null);
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

  const filtrados = useMemo(() => {
    if (!categoriaAlvo) return [];
    const alvo = categoriaAlvo.toLowerCase();
    return (lista || []).filter(
      (p) => String(p.categoria || "").toLowerCase() === alvo
    );
  }, [lista, categoriaAlvo]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
  };

  // clique no "Adicionar ao carrinho"
  const handleAdd = async (produto) => {
    const token = getToken();
    if (!token) {
      // não logado → guardamos ação e redirecionamos ao login
      setPostLoginAction({
        type: "addToCart",
        data: { produtoId: produto._id, quantidade: 1 },
        redirect: router.asPath, // volta para esta página após login
      });
      router.push("/login");
      return;
    }

    // logado → chama API
    try {
      setErro("");
      setOkMsg("");
      await addToCart({ produtoId: produto._id, quantidade: 1 });
      setOkMsg("Produto adicionado ao carrinho!");
      // opcional: setTimeout(() => setOkMsg(""), 2500);
    } catch (e) {
      setErro(e.message || "Falha ao adicionar ao carrinho");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderBar user={user} onLogout={handleLogout} />

      {/* SOMENTE PRODUTOS */}
      <main className="flex-1">
        <div className="w-full max-w-screen-md mx-auto px-3 py-6">
          <h1 className="text-xl font-bold mb-1">Produtos {label}</h1>
          {loading && (
            <div className="text-center text-slate-600">Carregando…</div>
          )}
          {erro && !loading && (
            <div className="text-center text-red-600">{erro}</div>
          )}
          {okMsg && !loading && (
            <div className="text-center text-green-600">{okMsg}</div>
          )}
          {!loading && !erro && filtrados.length === 0 && (
            <div className="text-center text-slate-600">
              Nenhum produto encontrado para {label}.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtrados.map((p) => (
              <ProductCard key={p._id} produto={p} onAdd={handleAdd} />
            ))}
          </div>
        </div>
      </main>

      <FooterLinks />
    </div>
  );
}
