import { useEffect, useRef, useState } from "react";
import HeaderBar from "../../components/HeaderBar";
import FooterLinks from "../../components/FooterLinks";
import AdminGuard from "../../components/AdminGuard";
import {
  getUsuario,
  getProdutos,
  getCartCount,
  adminCreateProduto,
  adminUpdateProduto,
  adminDeleteProduto,
} from "../../services/api";
import { getStoredUser, clearAuth, getToken } from "../../services/storage";

export default function AdminProdutosPage() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  // form NOVO
  const [novo, setNovo] = useState({
    nome: "",
    descricao: "",
    preco: "",
    estoque: "",
    categoria: "",
    cor: "",
    modelo: "",
    file: null,
  });
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const fileInputNovoRef = useRef(null);

  // form EDIT
  const [edit, setEdit] = useState(null); // { _id, ... }
  const [salvandoEdit, setSalvandoEdit] = useState(false);
  const fileInputEditRef = useRef(null);

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

  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErro("");
        setOk("");
        const data = await getProdutos({ signal: abort.signal });
        setLista(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") {
          setErro(e.message || "Erro ao carregar produtos");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => abort.abort();
  }, [ok]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setCartCount(0);
    // após sair, ir para login
    window.location.href = "/login";
  };

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setSalvandoNovo(true);
      setErro("");
      setOk("");
      await adminCreateProduto({
        nome: novo.nome,
        descricao: novo.descricao,
        preco: Number(novo.preco || 0),
        estoque: Number(novo.estoque || 0),
        categoria: novo.categoria,
        cor: novo.cor,
        modelo: novo.modelo,
        file: novo.file,
      });
      setOk("Produto criado com sucesso");
      setNovo({
        nome: "",
        descricao: "",
        preco: "",
        estoque: "",
        categoria: "",
        cor: "",
        modelo: "",
        file: null,
      });
      if (fileInputNovoRef.current) fileInputNovoRef.current.value = "";
    } catch (e) {
      setErro(e.message || "Erro ao criar produto");
    } finally {
      setSalvandoNovo(false);
    }
  }

  function startEdit(p) {
    setEdit({
      _id: p._id,
      nome: p.nome || "",
      descricao: p.descricao || "",
      preco: String(p.preco ?? ""),
      estoque: String(p.estoque ?? ""),
      categoria: p.categoria || "",
      cor: p.cor || "",
      modelo: p.modelo || "",
      file: null,
      imagemAtual: p.imagem || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEdit(null);
    if (fileInputEditRef.current) fileInputEditRef.current.value = "";
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!edit?._id) return;
    try {
      setSalvandoEdit(true);
      setErro("");
      setOk("");
      await adminUpdateProduto({
        id: edit._id,
        nome: edit.nome,
        descricao: edit.descricao,
        preco: Number(edit.preco || 0),
        estoque: Number(edit.estoque || 0),
        categoria: edit.categoria,
        cor: edit.cor,
        modelo: edit.modelo,
        file: edit.file || undefined,
      });
      setOk("Produto atualizado com sucesso");
      setEdit(null);
      if (fileInputEditRef.current) fileInputEditRef.current.value = "";
    } catch (e) {
      setErro(e.message || "Erro ao atualizar produto");
    } finally {
      setSalvandoEdit(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir este produto?")) return;
    try {
      setErro("");
      setOk("");
      await adminDeleteProduto(id);
      setOk("Produto excluído");
    } catch (e) {
      setErro(e.message || "Erro ao excluir");
    }
  }

  // classes dos inputs laranja
  const orangeInput =
    "border border-orange-500 rounded px-3 py-2 text-orange-600 placeholder-orange-400 " +
    "focus:outline-none focus:ring-2 focus:ring-orange-600";

  // botão de arquivo laranja
  function FileButton({ onClick, label }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="px-4 py-2 rounded-lg border border-orange-500 text-orange-600 font-semibold hover:bg-orange-50 transition"
      >
        {label}
      </button>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col bg-white">
        <HeaderBar user={user} onLogout={handleLogout} cartCount={cartCount} />

        <main className="flex-1">
          <div className="w-full max-w-screen-lg mx-auto px-3 py-6">
            <h1 className="text-2xl font-bold text-black mb-4">Produtos</h1>

            {/* AVISOS */}
            {erro && <div className="mb-3 text-red-700">{erro}</div>}
            {ok && <div className="mb-3 text-green-700">{ok}</div>}

            {/* FORM DE EDIÇÃO (quando edit != null) */}
            {edit && (
              <form
                onSubmit={handleUpdate}
                className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-xl mb-6 bg-white"
              >
                <div className="md:col-span-2 font-semibold text-black">
                  Editando: <span className="font-mono">{edit.nome}</span>
                </div>

                <input
                  className={orangeInput}
                  placeholder="Nome"
                  value={edit.nome}
                  onChange={(e) => setEdit({ ...edit, nome: e.target.value })}
                  required
                />
                <input
                  className={orangeInput}
                  placeholder="Modelo"
                  value={edit.modelo}
                  onChange={(e) => setEdit({ ...edit, modelo: e.target.value })}
                  required
                />
                <input
                  className={orangeInput}
                  placeholder="Categoria (ex.: Iphone, Samsung...)"
                  value={edit.categoria}
                  onChange={(e) =>
                    setEdit({ ...edit, categoria: e.target.value })
                  }
                  required
                />
                <input
                  className={orangeInput}
                  placeholder="Cor"
                  value={edit.cor}
                  onChange={(e) => setEdit({ ...edit, cor: e.target.value })}
                  required
                />
                <input
                  className={orangeInput}
                  placeholder="Preço (ex.: 39.9)"
                  value={edit.preco}
                  onChange={(e) => setEdit({ ...edit, preco: e.target.value })}
                  required
                />
                <input
                  className={orangeInput}
                  placeholder="Estoque (ex.: 10)"
                  value={edit.estoque}
                  onChange={(e) =>
                    setEdit({ ...edit, estoque: e.target.value })
                  }
                  required
                />
                <textarea
                  className={`${orangeInput} md:col-span-2`}
                  placeholder="Descrição"
                  value={edit.descricao}
                  onChange={(e) =>
                    setEdit({ ...edit, descricao: e.target.value })
                  }
                  required
                />

                {/* Imagem como botão */}
                <div className="md:col-span-2">
                  {edit.imagemAtual ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={edit.imagemAtual}
                      alt="Imagem atual"
                      className="h-20 object-contain mb-2"
                    />
                  ) : null}

                  <input
                    ref={fileInputEditRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        file: e.target.files?.[0] || null,
                      })
                    }
                  />
                  <FileButton
                    onClick={() => fileInputEditRef.current?.click()}
                    label={
                      edit?.file
                        ? `Imagem: ${edit.file.name}`
                        : "Selecionar imagem"
                    }
                  />
                </div>

                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={salvandoEdit}
                    className="px-4 py-2 rounded-lg border border-black text-black hover:bg-black hover:text-white transition disabled:opacity-50"
                  >
                    {salvandoEdit ? "Salvando..." : "Salvar alterações"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 rounded-lg border border-slate-400 text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* FORM DE CRIAÇÃO */}
            <form
              onSubmit={handleCreate}
              className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-xl mb-6 bg-white"
            >
              <input
                className={orangeInput}
                placeholder="Nome"
                value={novo.nome}
                onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
                required
              />
              <input
                className={orangeInput}
                placeholder="Modelo"
                value={novo.modelo}
                onChange={(e) => setNovo({ ...novo, modelo: e.target.value })}
                required
              />
              <input
                className={orangeInput}
                placeholder="Categoria (ex.: Iphone, Samsung...)"
                value={novo.categoria}
                onChange={(e) =>
                  setNovo({ ...novo, categoria: e.target.value })
                }
                required
              />
              <input
                className={orangeInput}
                placeholder="Cor"
                value={novo.cor}
                onChange={(e) => setNovo({ ...novo, cor: e.target.value })}
                required
              />
              <input
                className={orangeInput}
                placeholder="Preço (ex.: 39.9)"
                value={novo.preco}
                onChange={(e) => setNovo({ ...novo, preco: e.target.value })}
                required
              />
              <input
                className={orangeInput}
                placeholder="Estoque (ex.: 10)"
                value={novo.estoque}
                onChange={(e) => setNovo({ ...novo, estoque: e.target.value })}
                required
              />
              <textarea
                className={`${orangeInput} md:col-span-2`}
                placeholder="Descrição"
                value={novo.descricao}
                onChange={(e) =>
                  setNovo({ ...novo, descricao: e.target.value })
                }
                required
              />

              {/* Botão de arquivo */}
              <input
                ref={fileInputNovoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  setNovo({ ...novo, file: e.target.files?.[0] || null })
                }
              />
              <div className="md:col-span-2">
                <FileButton
                  onClick={() => fileInputNovoRef.current?.click()}
                  label={
                    novo.file ? `Imagem: ${novo.file.name}` : "Selecionar imagem"
                  }
                />
              </div>

              <div className="md:col-span-2 text-xs text-slate-600">
                <strong>Dica:</strong> a categoria deve bater com o backend
                (ex.: <em>Iphone</em> para Apple, <em>Samsung</em>, etc.).
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button
                  type="submit"
                  disabled={salvandoNovo}
                  className="px-4 py-2 rounded-lg border border-black text-black hover:bg-black hover:text-white transition disabled:opacity-50"
                >
                  {salvandoNovo ? "Salvando..." : "Novo produto"}
                </button>
              </div>
            </form>

            {/* LISTA */}
            {loading && <div className="text-black">Carregando…</div>}
            {erro && <div className="text-red-700">{erro}</div>}

            {!loading && !erro && (
              <div className="overflow-auto rounded-xl border">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-slate-100 text-left">
                      <th className="p-3 text-sm font-semibold text-black">Imagem</th>
                      <th className="p-3 text-sm font-semibold text-black">Nome</th>
                      <th className="p-3 text-sm font-semibold text-black">Modelo</th>
                      <th className="p-3 text-sm font-semibold text-black">Categoria</th>
                      <th className="p-3 text-sm font-semibold text-black">Cor</th>
                      <th className="p-3 text-sm font-semibold text-black">Preço</th>
                      <th className="p-3 text-sm font-semibold text-black">Estoque</th>
                      <th className="p-3 text-sm font-semibold text-black">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((p) => {
                      const preco = Number(p?.preco || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      });
                      return (
                        <tr key={p._id} className="border-t">
                          <td className="p-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.imagem}
                              alt={p.nome}
                              className="h-14 w-14 object-contain bg-slate-50 rounded"
                            />
                          </td>
                          <td className="p-3 text-black">{p.nome}</td>
                          <td className="p-3 text-black">{p.modelo}</td>
                          <td className="p-3 text-black">{p.categoria}</td>
                          <td className="p-3 text-black">{p.cor}</td>
                          <td className="p-3 text-black">{preco}</td>
                          <td className="p-3 text-black">{p.estoque}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEdit(p)}
                                className="px-2 py-1 rounded border border-black text-black text-sm hover:bg-black hover:text-white transition"
                                title="Editar"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDelete(p._id)}
                                className="px-2 py-1 rounded border border-red-700 text-red-700 text-sm hover:bg-red-50"
                                title="Excluir"
                              >
                                Excluir
                              </button>
                            </div>
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
