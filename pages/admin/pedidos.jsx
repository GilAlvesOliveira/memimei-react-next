import { useEffect, useMemo, useState } from "react";
import HeaderBar from "../../components/HeaderBar";
import FooterLinks from "../../components/FooterLinks";
import AdminGuard from "../../components/AdminGuard";
import { getUsuario, getCartCount, getPedidos, adminGetUsersByIds, getProdutos } from "../../services/api";
import { getStoredUser, clearAuth, getToken } from "../../services/storage";

/** Badge de status colorido */
function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  let classes =
    "inline-block px-2 py-1 rounded-full border text-xs font-semibold";

  if (s === "aprovado") {
    classes += " bg-green-100 text-green-800 border-green-300";
  } else if (s === "pendente") {
    classes += " bg-yellow-100 text-yellow-800 border-yellow-300";
  } else if (s === "cancelado" || s === "reprovado") {
    classes += " bg-red-100 text-red-800 border-red-300";
  } else if (s === "processando" || s === "em processamento") {
    classes += " bg-blue-100 text-blue-800 border-blue-300";
  } else {
    classes += " bg-slate-100 text-slate-800 border-slate-300";
  }

  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
  return <span className={classes}>{label}</span>;
}

export default function AdminPedidosPage() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const [lista, setLista] = useState([]);      // pedidos
  const [users, setUsers] = useState([]);      // [{ _id, nome, email, telefone?, endereco? }]
  const [prodMap, setProdMap] = useState(new Map()); // id -> produto
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // Carrega user/cartCount
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

  // Carrega pedidos + produtos + nomes/contatos dos clientes
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErro("");

        const [pedidos, produtos] = await Promise.all([
          getPedidos(),                   // admin vê todos
          getProdutos().catch(() => []),  // para mapear nomes/imagens dos itens
        ]);

        setLista(Array.isArray(pedidos) ? pedidos : []);

        // Mapa de produtos por id p/ exibir nome e imagem nos itens
        const pmap = new Map();
        (produtos || []).forEach((p) => pmap.set(String(p._id), p));
        setProdMap(pmap);

        // Resolver nomes/contatos de usuários (se o endpoint admin existir)
        const ids = Array.from(
          new Set((pedidos || []).map((p) => String(p.usuarioId || "")).filter(Boolean))
        );
        if (ids.length) {
          try {
            const resp = await adminGetUsersByIds(ids);
            setUsers(Array.isArray(resp) ? resp : []);
          } catch {
            setUsers([]);
          }
        } else {
          setUsers([]);
        }
      } catch (e) {
        setErro(e.message || "Erro ao carregar pedidos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const userById = useMemo(() => {
    const map = new Map();
    for (const u of users || []) {
      map.set(String(u._id), u);
    }
    return map;
  }, [users]);

  // Quantos pedidos têm cliente com dados incompletos (sem telefone ou sem endereço)
  const incompletosCount = useMemo(() => {
    let count = 0;
    for (const p of lista || []) {
      const u = userById.get(String(p.usuarioId));
      const telOK = !!(u && u.telefone && String(u.telefone).trim());
      const endOK = !!(u && u.endereco && String(u.endereco).trim());
      if (!telOK || !endOK) count++;
    }
    return count;
  }, [lista, userById]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setCartCount(0);
  };

  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col bg-white">
        <HeaderBar user={user} onLogout={handleLogout} cartCount={cartCount} />

        <main className="flex-1">
          <div className="w-full max-w-screen-lg mx-auto px-3 py-6">
            <h1 className="text-2xl font-bold text-black mb-4">Pedidos (Admin)</h1>

            {/* ALERTA: clientes com dados incompletos */}
            {!loading && !erro && incompletosCount > 0 && (
              <div className="mb-4 p-3 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-900">
                ⚠ Existem <strong>{incompletosCount}</strong> pedido(s) com
                dados de contato incompletos (WhatsApp e/ou endereço). Considere
                solicitar atualização ao cliente.
              </div>
            )}

            {loading && <div className="text-black">Carregando…</div>}
            {erro && <div className="text-red-700">{erro}</div>}

            {!loading && !erro && (
              <div className="overflow-auto rounded-xl border">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-slate-100 text-left">
                      {/* sem coluna de ID */}
                      <th className="p-3 text-sm font-semibold text-black">Cliente</th>
                      <th className="p-3 text-sm font-semibold text-black">Contato</th>
                      <th className="p-3 text-sm font-semibold text-black">Total</th>
                      <th className="p-3 text-sm font-semibold text-black">Status</th>
                      <th className="p-3 text-sm font-semibold text-black">Criado em</th>
                      <th className="p-3 text-sm font-semibold text-black">Itens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(lista || []).map((p) => {
                      const total = Number(p.total || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      });
                      const criado = p.criadoEm
                        ? new Date(p.criadoEm).toLocaleString("pt-BR")
                        : "-";

                      const u = userById.get(String(p.usuarioId));
                      const nomeCliente = u?.nome || "—";
                      const emailCliente = u?.email || "—";
                      const telefoneCliente = u?.telefone || "";
                      const enderecoCliente = u?.endereco || "";

                      const telOK = !!(telefoneCliente && String(telefoneCliente).trim());
                      const endOK = !!(enderecoCliente && String(enderecoCliente).trim());
                      const dadosIncompletos = !telOK || !endOK;

                      return (
                        <tr key={p._id} className="border-t align-top">
                          <td className="p-3 text-black">
                            <div className="font-semibold flex items-center gap-2">
                              <span>{nomeCliente}</span>
                              {dadosIncompletos && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 text-[11px]">
                                  ⚠ Dados incompletos
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-slate-700">{emailCliente}</div>
                          </td>

                          <td className="p-3 text-black">
                            <div className="text-sm">
                              <div>
                                <span className="font-semibold">WhatsApp:</span>{" "}
                                {telOK ? telefoneCliente : <span className="text-red-700">— informar</span>}
                              </div>
                              <div className="mt-1">
                                <span className="font-semibold">Endereço:</span>{" "}
                                {endOK ? enderecoCliente : <span className="text-red-700">— informar</span>}
                              </div>
                            </div>
                          </td>

                          <td className="p-3 text-black">{total}</td>
                          <td className="p-3 text-black">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="p-3 text-black">{criado}</td>

                          <td className="p-3 text-black">
                            {(p.produtos || []).map((it, idx) => {
                              const prod = prodMap.get(String(it.produtoId));
                              const nome = prod?.nome || "Produto";
                              const img = prod?.imagem || null;
                              const unit = Number(it.precoUnitario || prod?.preco || 0);
                              const unitBRL = unit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                              const subBRL = (unit * (it.quantidade || 1)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

                              return (
                                <div key={idx} className="flex items-center gap-2 py-1">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  {img ? (
                                    <img src={img} alt={nome} className="h-8 w-8 object-contain bg-slate-50 rounded" />
                                  ) : (
                                    <div className="h-8 w-8 grid place-items-center bg-slate-100 text-[10px] text-slate-600 rounded">
                                      sem img
                                    </div>
                                  )}
                                  <div className="text-sm">
                                    <div className="font-medium text-black leading-tight">{nome}</div>
                                    <div className="text-slate-700">
                                      {it.quantidade} × {unitBRL} ={" "}
                                      <span className="font-semibold text-black">{subBRL}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        <FooterLinks />
      </div>
    </AdminGuard>
  );
}
