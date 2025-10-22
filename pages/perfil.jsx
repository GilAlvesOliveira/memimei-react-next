import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import HeaderBar from "../components/HeaderBar";
import FooterLinks from "../components/FooterLinks";
import { getUsuario, getCartCount } from "../services/api";
import { getStoredUser, getToken, clearAuth } from "../services/storage";

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const [nome, setNome] = useState("");
  const [file, setFile] = useState(null);
  const [telefone, setTelefone] = useState(""); // novo (opcional)
  const [endereco, setEndereco] = useState(""); // novo (opcional)

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const [freshUser, count] = await Promise.all([
          getUsuario().catch(() => getStoredUser() || null),
          getCartCount().catch(() => 0),
        ]);
        setUser(freshUser);
        setCartCount(count);
        setNome(freshUser?.nome || "");
        // se backend já devolver:
        setTelefone(freshUser?.telefone || "");
        setEndereco(freshUser?.endereco || "");
      } catch (e) {
        setErro(e.message || "Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setCartCount(0);
    router.push("/home");
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSalvando(true);
      setErro("");
      setOk("");

      const token = getToken();
      if (!token) throw new Error("Sem token");

      const fd = new FormData();
      if (nome) fd.set("nome", nome);
      if (file) fd.set("file", file);
      // estes só serão salvos se o backend aceitar (Opção B):
      if (telefone) fd.set("telefone", telefone);
      if (endereco) fd.set("endereco", endereco);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usuario/usuario`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.erro || "Erro ao atualizar perfil");

      setOk("Perfil atualizado!");
    } catch (e) {
      setErro(e.message || "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderBar user={user} onLogout={handleLogout} cartCount={cartCount} />

      <main className="flex-1">
        <div className="w-full max-w-screen-sm mx-auto px-3 py-6">
          <h1 className="text-2xl font-bold text-black mb-4">Meu Perfil</h1>

          {loading && <div className="text-black">Carregando…</div>}
          {erro && <div className="text-red-700">{erro}</div>}
          {ok && <div className="text-green-700">{ok}</div>}

          {!loading && (
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 border rounded-xl">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Nome</label>
                <input
                  className="w-full p-3 border border-orange-500 rounded-md text-orange-600"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">Foto (opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full p-3 border border-orange-500 rounded-md text-orange-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">WhatsApp (opcional)</label>
                <input
                  placeholder="(11) 91234-5678"
                  className="w-full p-3 border border-orange-500 rounded-md text-orange-600"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">Endereço (opcional)</label>
                <textarea
                  placeholder="Rua, número, bairro, cidade/UF, CEP"
                  className="w-full p-3 border border-orange-500 rounded-md text-orange-600"
                  rows={3}
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full p-3 mt-2 bg-black text-white font-semibold rounded-md disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <FooterLinks />
    </div>
  );
}
