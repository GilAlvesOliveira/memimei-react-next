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

  // Frete (novos estados)
  const [freteOptions, setFreteOptions] = useState([]);
  const [freteSelecionado, setFreteSelecionado] = useState(null);
  const [valorFreteSelecionado, setValorFreteSelecionado] = useState(0); // apenas o valor do frete

  useEffect(() => {
    console.log("[Carrinho] useEffect inicial");
    const token = getToken();
    console.log("[Carrinho] token:", token);
    if (!token) {
      setPostLoginAction({ type: "redirect", redirect: "/carrinho" });
      router.push("/login");
      return;
    }

    (async () => {
      try {
        try {
          const freshUser = await getUsuario();
          console.log("[Carrinho] getUsuario() OK:", freshUser);
          setUser(freshUser);
        } catch (e) {
          console.warn("[Carrinho] getUsuario() falhou, fallback storage:", e);
          setUser(getStoredUser() || null);
        }
        await carregarCarrinho();

        // Verifica se havia um pedido pendente salvo e se ainda está pendente no backend
        const saved = readPendingOrder();
        console.log("[Carrinho] saved pending order:", saved);
        if (saved?.id) {
          const pedidos = await getPedidos().catch(() => []);
          console.log("[Carrinho] pedidos (para validar pendente):", pedidos);
          const achado = (pedidos || []).find((p) => {
            const idStr = (p?._id && (p._id.$oid || p._id)) || p?._id || "";
            return String(idStr) === String(saved.id);
          });
          if (achado) {
            const status = String(achado.status || "").toLowerCase();
            console.log("[Carrinho] achado pendente status:", status, achado);
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
        console.error("[Carrinho] erro no boot:", e);
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
      console.log("[Carrinho] carregarCarrinho()");
      const data = await getCart();
      console.log("[Carrinho] getCart() ->", data);
      setItens(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[Carrinho] carregarCarrinho() erro:", e);
      setErro(e.message || "Erro ao carregar carrinho");
    } finally {
      setLoading(false);
    }
  }

  const total = useMemo(() => {
    const t = (itens || []).reduce((acc, item) => {
      const preco = Number(item?.preco ?? item?.produto?.preco ?? 0) || 0;
      const qtd = Number(item?.quantidade ?? 1) || 1;
      return acc + preco * qtd;
    }, 0);
    console.log("[Carrinho] total produtos (sem frete):", t);
    return t;
  }, [itens]);

  const cartCount = useMemo(() => {
    const c = (itens || []).reduce(
      (acc, it) => acc + (Number(it?.quantidade ?? 1) || 1),
      0
    );
    console.log("[Carrinho] cartCount:", c);
    return c;
  }, [itens]);

  const handleLogout = () => {
    console.log("[Carrinho] handleLogout()");
    clearAuth();
    setUser(null);
    router.push("/login");
  };

  async function handleDecrement(item) {
    const produtoId = item?.produtoId || item?.produto?._id;
    console.log("[Carrinho] handleDecrement()", { item, produtoId });
    if (!produtoId) return;

    try {
      setBusyId(produtoId);
      await decrementCartItem(produtoId);
      await carregarCarrinho();
    } catch (e) {
      console.error("[Carrinho] handleDecrement() erro:", e);
      setErro(e.message || "Não foi possível diminuir a quantidade");
    } finally {
      setBusyId(null);
    }
  }

  // ==== POLLING ====
  function startPollingStatus(pedidoIdCriado) {
    console.log("[Carrinho] startPollingStatus()", pedidoIdCriado);
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
        console.log("[Carrinho] polling tentativa", attempts);
        const pedidos = await getPedidos();
        const achado = (pedidos || []).find((p) => {
          const idStr = (p?._id && (p._id.$oid || p._id)) || p?._id || "";
          return String(idStr) === String(pedidoIdCriado);
        });

        if (achado && String(achado.status).toLowerCase() === "aprovado") {
          console.log("[Carrinho] pagamento aprovado!", achado);
          clearInterval(pollTimer.current);
          pollTimer.current = null;
          setWaitingPay(false);
          setPollMsg("Pagamento aprovado! Redirecionando…");
          clearPendingOrder(); // limpamos o pendente salvo
          router.push(`/sucesso?pedido=${encodeURIComponent(pedidoIdCriado)}`);
          return;
        }
      } catch (err) {
        console.warn("[Carrinho] polling erro transitório:", err);
      }

      if (attempts >= MAX_ATTEMPTS) {
        console.warn("[Carrinho] polling timeout");
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
      console.log("[Carrinho] handleCheckout() - criando pedido");
      const { pedidoId: idGerado, total: totalPedido } = await createOrder();
      console.log("[Carrinho] createOrder() ->", { idGerado, totalPedido });
      setPedidoId(idGerado);
      savePendingOrder({ id: idGerado, total: totalPedido || total });
      setItens([]); // reflete esvaziamento

      // 2) Calcula total com frete
      const totalComFrete = Number(total || 0) + Number(valorFreteSelecionado || 0);
      console.log("[Carrinho] total produtos:", total, "frete:", valorFreteSelecionado, "totalComFrete:", totalComFrete);

      // 3) Gera preferência
      const pref = await createPreference({
        pedidoId: idGerado,
        total: totalComFrete, // soma de produtos + frete
      });
      console.log("[Carrinho] createPreference() ->", pref);

      // 4) Abre em NOVA ABA (pré-abre para evitar bloqueio)
      openInNewTabSafe(pref.initPoint);

      // 5) Começa polling
      startPollingStatus(idGerado);
    } catch (e) {
      console.error("[Carrinho] handleCheckout() erro:", e);
      setErro(e.message || "Não foi possível iniciar o pagamento");
    } finally {
      setFinalizando(false);
    }
  }

  async function handleRegenerate() {
    try {
      setErro("");
      setPollErr("");
      console.log("[Carrinho] handleRegenerate()");
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
        console.warn("[Carrinho] handleRegenerate() - nenhum pendente");
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
      console.log("[Carrinho] handleRegenerate() totalToUse:", totalToUse, { found, pend });

      // cria nova preferência para o MESMO pedido
      const pref = await createPreference({
        pedidoId: pend.id,
        total: Number(totalToUse || 0),
      });
      console.log("[Carrinho] handleRegenerate() createPreference ->", pref);

      // abre em nova aba
      openInNewTabSafe(pref.initPoint);

      // salva e inicia polling
      savePendingOrder({ id: pend.id, total: Number(totalToUse || 0) });
      setPedidoId(pend.id);
      startPollingStatus(pend.id);
      setResumePending({ id: pend.id, total: Number(totalToUse || 0) });
    } catch (e) {
      console.error("[Carrinho] handleRegenerate() erro:", e);
      setErro(e.message || "Não foi possível gerar o QR Code novamente");
    }
  }

  function handleDiscardPending() {
    console.log("[Carrinho] handleDiscardPending()");
    clearPendingOrder();
    setResumePending(null);
    setPedidoId(null);
    setPollErr("");
    setPollMsg("");
    setWaitingPay(false);
  }

  // Função para calcular as dimensões e peso do produto (maior comp/larg, soma altura/peso)
  function calcularDimensoesEPeso(carrinho) {
    let totalHeight = 0;
    let totalWidth = 0;
    let totalLength = 0;
    let totalWeight = 0;

    carrinho.forEach(item => {
      const produto = item?.produto || {};
      const quantidade = Number(item?.quantidade || 1);
      const altura = Number(produto?.altura || 0);
      const largura = Number(produto?.largura || 0);
      const comprimento = Number(produto?.comprimento || 0);
      const peso = Number(produto?.peso || 0);

      totalHeight += altura * quantidade;           // soma alturas
      totalWidth = Math.max(totalWidth, largura);   // maior largura
      totalLength = Math.max(totalLength, comprimento); // maior comprimento
      totalWeight += peso * quantidade;             // soma pesos
    });

    const res = {
      height: totalHeight,
      width: totalWidth,
      length: totalLength,
      weight: totalWeight
    };
    console.log("[Carrinho] calcularDimensoesEPeso ->", res);
    return res;
  }

  async function calcularFrete() {
    try {
      console.log("[Carrinho] calcularFrete()");
      const carrinho = itens;
      const { height, width, length, weight } = calcularDimensoesEPeso(carrinho);
      const cepDestino = (user?.cep || "").replace(/\s/g, "");
      if (!cepDestino) {
        setErro("CEP do usuário não encontrado.");
        return;
      }

      // IMPORTANTE: a rota pública do MelhorEnvio calculator é GET (sem header Auth) e está sujeita a CORS/políticas deles.
      // Se der CORS no navegador, use seu proxy backend. Aqui usamos direto pois você sinalizou que funciona aí.
      const url = `https://www.melhorenvio.com.br/api/v2/calculator?from=18072-060&to=${cepDestino}&width=${width}&height=${height}&length=${length}&weight=${weight}&insurance_value=0`;
      console.log("[Carrinho] URL calcular frete:", url);

      const response = await fetch(url);
      console.log("[Carrinho] resposta calcular frete status:", response.status);
      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch {}
        console.error("[Carrinho] erro calcular frete:", errorData);
        setErro("Erro ao calcular o frete.");
        return;
      }

      const data = await response.json();
      console.log("[Carrinho] opções de frete recebidas:", data);
      // filtra somente opções sem erro
      const ok = Array.isArray(data) ? data.filter(o => !o.error) : [];
      setFreteOptions(ok);
      if (ok.length === 0) {
        console.warn("[Carrinho] nenhuma opção de frete válida para o trecho/dimensões.");
      }
    } catch (error) {
      console.error("[Carrinho] calcularFrete() exception:", error);
      setErro("Erro ao calcular o frete.");
    }
  }

  function selecionarFrete(option) {
    console.log("[Carrinho] selecionarFrete()", option);
    setFreteSelecionado(option);
    const valorFrete = Number(option?.price || 0);
    setValorFreteSelecionado(valorFrete);
    console.log("[Carrinho] valorFreteSelecionado:", valorFrete);
  }

  const totalComFreteExibicao = useMemo(() => {
    const v = Number(total || 0) + Number(valorFreteSelecionado || 0);
    console.log("[Carrinho] totalComFreteExibicao:", v);
    return v;
  }, [total, valorFreteSelecionado]);

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

          {/* Botão para calcular frete */}
          <div className="mt-4">
            <button
              onClick={calcularFrete}
              className="px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Calcular Frete
            </button>
          </div>

          {/* Opções de frete retornadas */}
          {freteOptions.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-black">Escolha uma opção de frete</h2>
              <div className="grid grid-cols-1 gap-3">
                {freteOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => selecionarFrete(option)}
                    className={`flex gap-3 p-3 border rounded-lg bg-white ${freteSelecionado?.id === option.id ? "ring-2 ring-orange-600" : ""}`}
                  >
                    <div>
                      <img
                        src={option.company?.picture}
                        alt={option.name}
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-black">
                        {option.name} {option.company?.name ? `· ${option.company.name}` : ""}
                      </div>
                      <div className="text-sm text-black">
                        {option.price && (
                          <>
                            Preço:{" "}
                            <span className="font-semibold">
                              {Number(option.price).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-black">
                        Prazo de entrega: {option.delivery_time} {option.delivery_time === 1 ? "dia útil" : "dias úteis"}
                      </div>
                      {option.error && (
                        <div className="text-sm text-red-600">Erro: {option.error}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Total + CTAs */}
          {!loading && !erro && (itens.length > 0 || waitingPay || resumePending?.id) && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-lg font-bold text-black">
                Total:{" "}
                {totalComFreteExibicao.toLocaleString("pt-BR", {
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
                  disabled={finalizando || waitingPay || itens.length === 0 || !freteSelecionado}
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
