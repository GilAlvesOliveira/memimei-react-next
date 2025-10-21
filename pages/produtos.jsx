import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import HeaderBar from "../components/HeaderBar";
import FooterLinks from "../components/FooterLinks";
import ProductCard from "../components/ProductCard";
import BrandButton from "../components/BrandButton";
import brands from "../lib/brands";
import { getUsuario, getProdutos } from "../services/api";
import { getStoredUser, getToken, clearAuth } from "../services/storage";

const brandToCategory = { Apple: "Iphone" }; // mapeia Apple -> Iphone (como no backend)

export default function ProdutosPage() {
  const router = useRouter();
  const marca = typeof router.query.marca === "string" ? router.query.marca : "";
  const categoriaAlvo = (brandToCategory[marca] || marca || "").toLowerCase();

  const [user, setUser] = useState(null);
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

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

  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErro("");
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

  const filtrados = useMemo(() => {
    if (!categoriaAlvo) return lista;
    return lista.filter(
      (p) => String(p.categoria || "").toLowerCase() === categoriaAlvo
    );
  }, [lista, categoriaAlvo]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderBar user={user} onLogout={handleLogout} />

      <main className="flex-1">
        {/* Filtros (as mesmas marcas) */}
        <div className="w-full max-w-screen-md mx-auto px-3 pt-6 space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {brands.map((name) => (
              <BrandButton
                key={name}
                label={name}
                href={`/produtos?marca=${encodeURIComponent(name)}`}
              />
            ))}
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-bold">
              {marca ? `Resultados para "${marca}"` : "Todos os produtos"}
            </h2>
            <p className="text-slate-600 text-sm">
              {loading
                ? "Carregando..."
                : erro
                ? erro
                : `${filtrados.length} item(ns)`}
            </p>
          </div>
        </div>

        {/* Grid de produtos */}
        <div className="w-full max-w-screen-md mx-auto px-3 py-6">
          {!loading && !erro && filtrados.length === 0 && (
            <div className="text-center text-slate-600">
              Nenhum produto encontrado para {marca || "esta seleção"}.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtrados.map((p) => (
              <ProductCard key={p._id} produto={p} />
            ))}
          </div>
        </div>
      </main>

      <FooterLinks />
    </div>
  );
}
