import { useEffect, useState } from "react";
import HeaderBar from "../../components/HeaderBar";
import FooterLinks from "../../components/FooterLinks";
import AdminGuard from "../../components/AdminGuard";
import { getUsuario, getCartCount, getProdutos, adminCreateProduto, adminDeleteProduto } from "../../services/api";
import { getStoredUser, clearAuth, getToken } from "../../services/storage";

export default function AdminProdutosPage() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  // form
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    estoque: "",
    categoria: "",
    cor: "",
    modelo: "",
    file: null,
  });
  const [salvando, setSalvando] = useState(false);

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
        if (e.name !== "AbortError") setErro(e.message || "Erro ao carregar produtos");
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
  };

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setSalvando(true);
      setErro("");
      setOk("");
      await adminCreateProduto({
        nome: form.nome,
        descricao: form.descricao,
        preco: Number(form.preco || 0),
        estoque: Number(form.estoque || 0),
        categoria: form.categoria,
        cor: form.cor,
        modelo: form.modelo,
        file: form.file,
      });
      setOk("Produto criado com sucesso");
      setForm({
        nome: "",
        descricao: "",
        preco: "",
        estoque: "",
        categoria: "",
        cor: "",
        modelo: "",
        file: null,
      });
    } catch (e) {
      setErro(e.message || "Erro ao criar produto");
    } finally {
      setSalvando(false);
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

  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col bg-white">
        <HeaderBar user={user} onLogout={handleLogout} cartCount={cartCount} />

        <main className="flex-1">
          <div className="w-full max-w-screen-lg mx-auto px-3 py-6">
            <h1 className="text-2xl font-bold text-black mb-4">Produtos</h1>

            {/* Form de criação */}
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-xl mb-6 bg-white">
              <input className="border rounded px-3 py-2" placeholder="Nome" value={form.nome} onChange={(e)=>setForm({...form, nome:e.target.value})} required />
              <input className="border rounded px-3 py-2" placeholder="Modelo" value={form.modelo} onChange={(e)=>setForm({...form, modelo:e.target.value})} required />
              <input className="border rounded px-3 py-2" placeholder="Categoria" value={form.categoria} onChange={(e)=>setForm({...form, categoria:e.target.value})} required />
              <input className="border rounded px-3 py-2" placeholder="Cor" value={form.cor} onChange={(e)=>setForm({...form, cor:e.target.value})} required />
              <input className="border rounded px-3 py-2" placeholder="Preço (ex.: 39.9)" value={form.preco} onChange={(e)=>setForm({...form, preco:e.target.value})} required />
              <input className="border rounded px-3 py-2" placeholder="Estoque (ex.: 10)" value={form.estoque} onChange={(e)=>setForm({...form, estoque:e.target.value})} required />
              <textarea className="border rounded px-3 py-2 md:col-span-2" placeholder="Descrição" value={form.descricao} onChange={(e)=>setForm({...form, descricao:e.target.value})} required />
              <input type="file" accept="image/*" className="md:col-span-2" onChange={(e)=>setForm({...form, file:e.target.files?.[0] || null})} />
              <div className="md:col-span-2 flex gap-2">
                <button type="submit" disabled={salvando} className="px-4 py-2 rounded-lg border border-black text-black hover:bg-black hover:text-white transition disabled:opacity-50">
                  {salvando ? "Salvando..." : "Criar produto"}
                </button>
              </div>
            </form>

            {loading && <div className="text-black">Carregando…</div>}
            {erro && <div className="text-red-700">{erro}</div>}
            {ok && <div className="text-green-700">{ok}</div>}

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
                            <img src={p.imagem} alt={p.nome} className="h-14 w-14 object-contain bg-slate-50 rounded" />
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
                                onClick={() => handleDelete(p._id)}
                                className="px-2 py-1 rounded border border-red-700 text-red-700 text-sm hover:bg-red-50"
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
