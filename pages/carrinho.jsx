// pages/carrinho.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import HeaderBar from "../components/HeaderBar";
import FooterLinks from "../components/FooterLinks";
import {
  getUsuario,
  getCart,
  decrementCartItem,
  createOrder,
  createPreference,
  getPedidos,
} from "../services/api";
import {
  getStoredUser,
  getToken,
  clearAuth,
  setPostLoginAction,
} from "../services/storage";

/** Helpers para lembrar pedido pendente */
const PENDING_KEY = "lastPendingOrder";
function savePendingOrder({ id, total }) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ id, total }));
  } catch {}
}
function readPendingOrder() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function clearPendingOrder() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {}
}

/** Abre link em nova aba de forma “à prova” de bloqueador (pré-abre a janela) */
function openInNewTabSafe(url) {
  const win = window.open("", "_blank");
  if (win) {
    try {
      win.opener = null;
      win.location.href = url;
      return true;
    } catch {
      // fallback
      win.close();
      window.location.href = url;
      return false;
    }
  } else {
    // se o navegador bloqueou, como último recurso vai na mesma aba
    window.location.href = url;
    return false;
  }
}

export default function CarrinhoPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [finalizando, setFinalizando] = useState(false);

  // Espera/polling
  const [waitingPay, setWaitingPay] = useState(false);
  const [pedidoId, setPedidoId] = useState(null);
  const [pollMsg, setPollMsg] = useState("");
  const [pollErr, setPollErr] = useState("");
  const pollTimer = useRef(null);

  // “Retomar pagamento” (quando existe pedido pendente salvo)
  const [resumePending, setResumePending] = useState(null); // { id, total }

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setPostLoginAction({ type: "redirect", redirect: "/carrinho" });
      router.push("/login");
      return;
    }

    (async () => {
      try {
        try {
          const freshUser = await getUsuario();
          setUser(freshUser);
        } catch {
          setUser(getStoredUser() || null);
        }
        await carregarCarrinho();

        // Verifica se havia um pedido pendente salvo e se ainda está pendente no backend
        const saved = readPendingOrder();
        if (saved?.id) {
          const pedidos = await getPedidos().catch(() => []);
          const achado = (pedidos || []).find((p) => {
            const idStr = (p?._id && (p._id.$oid || p._id)) || p?._id || "";
            return String(idStr) === String(saved.id);
          });
          if (achado) {
            const status = String(achado.status || "").toLowerCase();
            if (status === "aprovado") {
              // aprovado enquanto estávamos fora
              clearPendingOrder();
              router.push(`/sucesso?pedido=${encodeURIComponent(saved.id)}`);
            } else if (status === "pendente") {
              // continua pendente -> oferece “Gerar QR Code novamente”
              setResumePending({ id: saved.id, total: achado.total || saved.total || 0 });
            } else {
              // outro status -> limpa pendente
              clearPendingOrder();
            }
          } else {
            // pedido não encontrado -> limpa pendente
            clearPendingOrder();
          }
        }
      } catch (e) {
        setErro(e.message || "Erro ao carregar carrinho");
      }
    })();

    return () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function carregarCarrinho() {
    try {
      setLoading(true);
      setErro("");
      const data = await getCart();
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

  const cartCount = useMemo(() => {
    return (itens || []).reduce(
      (acc, it) => acc + (Number(it?.quantidade ?? 1) || 1),
      0
    );
  }, [itens]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    router.push("/login");
  };

  async function handleDecrement(item) {
    const produtoId = item?.produtoId || item?.produto?._id;
    if (!produtoId) return;

    try {
      setBusyId(produtoId);
      await decrementCartItem(produtoId);
      await carregarCarrinho();
    } catch (e) {
      setErro(e.message || "Não foi possível diminuir a quantidade");
    } finally {
      setBusyId(null);
    }
  }

  // ==== POLLING ====
  function startPollingStatus(pedidoIdCriado) {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    setPollErr("");
    setPollMsg(
      "Abrimos o Mercado Pago em uma nova aba. Conclua o pagamento e volte aqui — estamos monitorando automaticamente."
    );
    setWaitingPay(true);

    const MAX_ATTEMPTS = 36; // ~3 minutos (36 × 5s)
    let attempts = 0;

    pollTimer.current = setInterval(async () => {
      try {
        attempts += 1;
        const pedidos = await getPedidos();
        const achado = (pedidos || []).find((p) => {
          const idStr = (p?._id && (p._id.$oid || p._id)) || p?._id || "";
          return String(idStr) === String(pedidoIdCriado);
        });

        if (achado && String(achado.status).toLowerCase() === "aprovado") {
          clearInterval(pollTimer.current);
          pollTimer.current = null;
          setWaitingPay(false);
          setPollMsg("Pagamento aprovado! Redirecionando…");
          clearPendingOrder(); // limpamos o pendente salvo
          router.push(`/sucesso?pedido=${encodeURIComponent(pedidoIdCriado)}`);
          return;
        }
      } catch {
        // ignora erros intermitentes
      }

      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
        setWaitingPay(false);
        setPollErr(
          "Ainda não confirmamos seu pagamento. Se você já pagou, aguarde alguns instantes ou verifique em 'Meus pedidos'."
        );
      }
    }, 5000);
  }

  async function handleCheckout() {
    try {
      setErro("");
      setPollErr("");
      setPollMsg("");
      setFinalizando(true);

      // 1) Cria o pedido (backend limpa carrinho)
      const { pedidoId: idGerado, total: totalPedido } = await createOrder();
      setPedidoId(idGerado);
      savePendingOrder({ id: idGerado, total: totalPedido || total });
      setItens([]); // reflete esvaziamento

      // 2) Gera preferência
      const pref = await createPreference({
        pedidoId: idGerado,
        total: totalPedido || total,
      });

      // 3) Abre em NOVA ABA (pré-abre para evitar bloqueio)
      openInNewTabSafe(pref.initPoint);

      // 4) Começa polling
      startPollingStatus(idGerado);
    } catch (e) {
      setErro(e.message || "Não foi possível iniciar o pagamento");
    } finally {
      setFinalizando(false);
    }
  }

  async function handleRegenerate() {
    try {
      setErro("");
      setPollErr("");
      // tenta pegar o pendente mais confiável
      let pend = resumePending || readPendingOrder() || null;

      // se não temos cache, tenta achar o último pendente do usuário
      if (!pend?.id) {
        const pedidos = await getPedidos().catch(() => []);
        const onlyPendentes = (pedidos || []).filter(
          (p) => String(p.status || "").toLowerCase() === "pendente"
        );
        // pega o mais recente
        const last = onlyPendentes.sort(
          (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
        )[0];
        if (last) {
          const idStr = (last?._id && (last._id.$oid || last._id)) || last?._id || "";
          pend = { id: String(idStr), total: Number(last.total || 0) || 0 };
        }
      }

      if (!pend?.id) {
        setErro("Nenhum pedido pendente para gerar.");
        return;
      }

      // garante que o total está correto via backend (se possível)
      const pedidosNow = await getPedidos().catch(() => []);
      const found = (pedidosNow || []).find((p) => {
        const idStr = (p?._id && (p._id.$oid || p._id)) || p?._id || "";
        return String(idStr) === String(pend.id);
      });
      const totalToUse = found?.total ?? pend.total ?? total;

      // cria nova preferência para o MESMO pedido
      const pref = await createPreference({
        pedidoId: pend.id,
        total: Number(totalToUse || 0),
      });

      // abre em nova aba
      openInNewTabSafe(pref.initPoint);

      // salva e inicia polling
      savePendingOrder({ id: pend.id, total: Number(totalToUse || 0) });
      setPedidoId(pend.id);
      startPollingStatus(pend.id);
      setResumePending({ id: pend.id, total: Number(totalToUse || 0) });
    } catch (e) {
      setErro(e.message || "Não foi possível gerar o QR Code novamente");
    }
  }

  function handleDiscardPending() {
    clearPendingOrder();
    setResumePending(null);
    setPedidoId(null);
    setPollErr("");
    setPollMsg("");
    setWaitingPay(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderBar user={user} onLogout={handleLogout} cartCount={cartCount} />

      <main className="flex-1">
        <div className="w-full max-w-screen-md mx-auto px-3 py-6">
          <h1 className="text-xl font-bold mb-4 text-black">Seu Carrinho</h1>

          {loading && <div className="text-center text-black">Carregando…</div>}
          {erro && !loading && <div className="text-center text-red-700">{erro}</div>}

          {/* Banner para retomar pagamento pendente */}
          {!loading && !waitingPay && resumePending?.id && (
            <div className="mb-4 p-3 rounded-lg border bg-yellow-50 border-yellow-400 text-black">
              Você tem um pedido pendente{" "}
              <span className="font-semibold">#{resumePending.id}</span>. Deseja gerar o
              QR Code novamente?
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="px-3 py-1 rounded-lg bg-black text-white hover:opacity-90 transition"
                >
                  Gerar QR Code novamente
                </button>
                <button
                  type="button"
                  onClick={handleDiscardPending}
                  className="px-3 py-1 rounded-lg border border-black text-black hover:bg-black hover:text-white transition"
                >
                  Dispensar
                </button>
              </div>
            </div>
          )}

          {/* Avisos do fluxo de pagamento */}
          {pollMsg && (
            <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-400 text-black">
              {pollMsg}
            </div>
          )}
          {pollErr && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-400 text-red-700">
              {pollErr}
            </div>
          )}

          {!loading && !erro && itens.length === 0 && !waitingPay && !resumePending?.id && (
            <div className="text-center text-black">Seu carrinho está vazio.</div>
          )}

          {/* Lista de itens */}
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
                <div key={pid || idx} className="border rounded-xl bg-white overflow-hidden">
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
                        {cor ? (
                          <>
                            · <span className="ml-2">{cor}</span>
                          </>
                        ) : null}
                      </div>

                      <div className="mt-1 text-sm text-black">
                        Preço: <span className="font-semibold">{precoBRL}</span>
                      </div>

                      <div className="mt-1 text-sm text-black flex items-center gap-2">
                        Quantidade: <span className="font-semibold">{quantidade}</span>
                        <button
                          type="button"
                          onClick={() => handleDecrement(item)}
                          disabled={busyId === pid || waitingPay}
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

          {/* Total + CTAs */}
          {!loading && !erro && (itens.length > 0 || waitingPay || resumePending?.id) && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-lg font-bold text-black">
                Total:{" "}
                {total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>

              <div className="flex gap-2">
                {/* Regenerar se há pendente e não estamos esperando agora */}
                {resumePending?.id && !waitingPay && (
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="px-4 py-2 rounded-lg border border-black text-black hover:bg-black hover:text-white transition"
                  >
                    Gerar QR Code novamente
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={finalizando || waitingPay || itens.length === 0}
                  className="px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {finalizando
                    ? "Gerando pagamento…"
                    : waitingPay
                    ? "Aguardando confirmação…"
                    : "Finalizar compra"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <FooterLinks />
    </div>
  );
}
