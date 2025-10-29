import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import HeaderBar from "../components/HeaderBar";
import FooterLinks from "../components/FooterLinks";
import {
  getUsuario,
  getCartCount,
  getPedidos,
  getProdutos,
} from "../services/api";
import { getStoredUser, getToken, clearAuth } from "../services/storage";

function toId(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    if (val._id) return toId(val._id);
    if (val.$oid) return String(val.$oid);
  }
  try {
    return String(val);
  } catch {
    return "";
  }
}

function StatusBadge({ status }) {
  const st = String(status || "").toLowerCase();
  let cls = "bg-slate-200 text-slate-800";
  let label = status || "-";

  if (st === "aprovado" || st === "approved") {
    cls = "bg-green-100 text-green-700 border border-green-300";
    label = "Aprovado";
  } else if (st === "pendente" || st === "pending") {
    cls = "bg-orange-100 text-orange-700 border border-orange-300";
    label = "Pendente";
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

export default function MeusPedidosPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const [lista, setLista] = useState([]); // pedidos
  const [produtos, setProdutos] = useState([]); // catálogo inteiro, para mapear imagens/nome
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

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
    const abort = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErro("");
        const [ped, prods] = await Promise.all([
          getPedidos(), // só traz IDs/quantidades/preço unitário
          getProdutos({ signal: abort.signal }), // usamos para buscar imagem, nome etc.
        ]);
        setLista(Array.isArray(ped) ? ped : []);
        setProdutos(Array.isArray(prods) ? prods : []);
      } catch (e) {
        if (e.name !== "AbortError") {
          setErro(e.message || "Erro ao carregar pedidos");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => abort.abort();
  }, []);

  const produtoMap = useMemo(() => {
    const map = new Map();
    (produtos || []).forEach((p) => map.set(toId(p._id), p));
    return map;
  }, [produtos]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setCartCount(0);
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderBar user={user} onLogout={handleLogout} cartCount={cartCount} />

      <main className="flex-1">
        <div className="w-full max-w-screen-lg mx-auto px-3 py-6">
          <h1 className="text-2xl font-bold text-black mb-4">Meus pedidos</h1>

          {loading && <div className="text-black">Carregando…</div>}
          {erro && !loading && <div className="text-red-700">{erro}</div>}
          {!loading && !erro && lista.length === 0 && (
            <div className="text-black">Você ainda não possui pedidos.</div>
          )}

          <div className="space-y-4">
            {lista.map((p) => {
              const totalBRL = Number(p.total || 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              });
              const freteBRL = Number(p.frete || 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              });
              const criado =
                p.criadoEm ? new Date(p.criadoEm).toLocaleString("pt-BR") : "-";

              return (
                <div key={p._id} className="rounded-xl border bg-white overflow-hidden">
                  {/* Cabeçalho do pedido */}
                  <div className="p-3 border-b flex items-center justify-between">
                    <div className="text-black">
                      <div className="font-semibold">Pedido #{p._id}</div>
                      <div className="text-sm text-slate-700">Criado em {criado}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-700">Total</div>
                      <div className="text-lg font-bold text-black">{totalBRL}</div>
                      <div className="mt-1">
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  </div>

                  {/* Exibindo o valor do frete */}
                  <div className="p-3 text-sm text-slate-700">
                    <strong>Frete:</strong> {freteBRL}
                  </div>

                  {/* Itens com imagem */}
                  <div className="p-3 grid grid-cols-1 gap-3">
                    {(p.produtos || []).map((it, idx) => {
                      const pid = toId(it.produtoId);
                      const prod = produtoMap.get(pid) || {};
                      const nome = prod.nome || "Produto";
                      const imagem = prod.imagem || null;
                      const modelo = prod.modelo || "";
                      const cor = prod.cor || "";
                      const qtd = Number(it.quantidade || 1) || 1;
                      const unit = Number(it.precoUnitario || 0) || 0;
                      const unitBRL = unit.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      });
                      const subtotal = (unit * qtd).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      });

                      return (
                        <div key={`${pid}-${idx}`} className="flex gap-3">
                          <div className="w-20 h-20 bg-slate-100 rounded-lg grid place-items-center flex-shrink-0 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {imagem ? (
                              <img
                                src={imagem}
                                alt={nome}
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <span className="text-[10px] text-slate-600 px-2 text-center">
                                sem imagem
                              </span>
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
                              Preço unit.: <span className="font-semibold">{unitBRL}</span>
                            </div>
                            <div className="text-sm text-black">
                              Quantidade: <span className="font-semibold">{qtd}</span>
                            </div>
                            <div className="text-sm text-black">
                              Subtotal: <span className="font-semibold">{subtotal}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
