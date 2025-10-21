import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import HeaderBar from "../components/HeaderBar";
import FooterLinks from "../components/FooterLinks";
import { getUsuario, getCart, decrementCartItem } from "../services/api";
import {
  getStoredUser,
  getToken,
  clearAuth,
  setPostLoginAction,
} from "../services/storage";

export default function CarrinhoPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [itens, setItens] = useState([]); // [{ produtoId, quantidade, produto, preco }]
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busyId, setBusyId] = useState(null); // produtoId em atualização

  // Exige login: se não tiver token → manda pro login e volta depois
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setPostLoginAction({ type: "redirect", redirect: "/carrinho" });
      router.push("/login");
      return;
    }

    (async () => {
      try {
        // Carregar usuário para Header
        try {
          const freshUser = await getUsuario();
          setUser(freshUser);
        } catch {
          const local = getStoredUser();
          setUser(local || null);
        }

        // Carregar carrinho
        await carregarCarrinho();
      } catch (e) {
        setErro(e.message || "Erro ao carregar carrinho");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function carregarCarrinho() {
    try {
      setLoading(true);
      setErro("");
      const data = await getCart({ enrich: true });
      setItens(Array.isArray(data) ? data : []);
    } catch (e) {
      setErro(e.message || "Erro ao carregar carrinho");
    } finally {
      setLoading(false);
    }
  }

  const total = useMemo(() => {
    return (itens || []).reduce((acc, item) => {
      const preco = Number(item?.preco ?? item?.produto?.preco ?? 0) || 0;
      const qtd = Number(item?.quantidade ?? 1) || 1;
      return acc + preco * qtd;
    }, 0);
  }, [itens]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
  };

  async function handleDecrement(item) {
    const produtoId = item?.produtoId || item?.produto?._id;
    if (!produtoId) return;

    try {
      setBusyId(produtoId);
      await decrementCartItem(produtoId);
      await carregarCarrinho(); // refaz o GET pra atualizar quantidades/itens
    } catch (e) {
      setErro(e.message || "Não foi possível diminuir a quantidade");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderBar user={user} onLogout={handleLogout} />

      <main className="flex-1">
        <div className="w-full max-w-screen-md mx-auto px-3 py-6">
          <h1 className="text-xl font-bold mb-4 text-black">Seu Carrinho</h1>

          {loading && <div className="text-center text-black">Carregando…</div>}
          {erro && !loading && <div className="text-center text-red-700">{erro}</div>}

          {!loading && !erro && itens.length === 0 && (
            <div className="text-center text-black">
              Seu carrinho está vazio.
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {itens.map((item, idx) => {
              const produto = item?.produto || {};
              const nome = produto?.nome || "Produto";
              const imagem = produto?.imagem || null;
              const cor = produto?.cor;
              const modelo = produto?.modelo;
              const preco = Number(item?.preco ?? produto?.preco ?? 0) || 0;
              const quantidade = Number(item?.quantidade ?? 1) || 1;
              const subtotal = preco * quantidade;

              const precoBRL = preco.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              });
              const subtotalBRL = subtotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              });

              const pid = item?.produtoId || produto?._id;

              return (
                <div
                  key={pid || idx}
                  className="border rounded-xl bg-white overflow-hidden"
                >
                  <div className="flex gap-3 p-3">
                    <div className="w-24 h-24 bg-slate-100 grid place-items-center flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {imagem ? (
                        <img
                          src={imagem}
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
                        {cor ? <>· <span className="ml-2">{cor}</span></> : null}
                      </div>

                      <div className="mt-1 text-sm text-black">
                        Preço: <span className="font-semibold">{precoBRL}</span>
                      </div>

                      {/* Quantidade com botão de diminuir */}
                      <div className="mt-1 text-sm text-black flex items-center gap-2">
                        Quantidade:{" "}
                        <span className="font-semibold">{quantidade}</span>
                        <button
                          type="button"
                          onClick={() => handleDecrement(item)}
                          disabled={busyId === pid}
                          className="ml-2 px-3 py-1 rounded-lg border border-black text-black hover:bg-black hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Diminuir quantidade em 1"
                          title="Diminuir quantidade em 1"
                        >
                          –
                        </button>
                      </div>

                      <div className="mt-1 text-sm text-black">
                        Subtotal: <span className="font-semibold">{subtotalBRL}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          {!loading && !erro && itens.length > 0 && (
            <div className="mt-6 text-right">
              <div className="text-lg font-bold text-black">
                Total:{" "}
                {total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <FooterLinks />
    </div>
  );
}
