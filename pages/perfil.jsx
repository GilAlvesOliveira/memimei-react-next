import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import HeaderBar from "../components/HeaderBar";
import FooterLinks from "../components/FooterLinks";
import { getUsuario, updateUsuario } from "../services/api";
import { getToken, getStoredUser, clearAuth, setPostLoginAction, setAuth } from "../services/storage";

export default function PerfilPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [avatar, setAvatar] = useState("");        // URL atual
  const [file, setFile] = useState(null);          // novo arquivo
  const [preview, setPreview] = useState("");      // preview do novo arquivo

  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setPostLoginAction({ type: "redirect", redirect: "/perfil" });
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        setErro("");
        const u = await getUsuario().catch(() => getStoredUser() || null);
        if (!u) throw new Error("Não foi possível carregar o usuário");
        setUser(u);
        setNome(u.nome || "");
        setEmail(u.email || "");
        setRole((u.role || "").toLowerCase());
        setAvatar(u.avatar || "");
      } catch (e) {
        setErro(e.message || "Erro ao carregar usuário");
      }
    })();
  }, [router]);

  function onSelectFile(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview("");
    }
  }

  const canSave = !saving && (file || (nome && nome.length >= 2 && nome !== (user?.nome || "")));

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSave) return;

    try {
      setSaving(true);
      setErro("");
      setOk("");

      await updateUsuario({ nome, file });

      // Recarrega o usuário atualizado para refletir no header/localStorage
      const updated = await getUsuario();
      const token = getToken();
      setAuth({ token, usuario: updated }); // mantém o mesmo token, atualiza o user

      setUser(updated);
      setAvatar(updated.avatar || "");
      setPreview("");
      setFile(null);
      setOk("Perfil atualizado com sucesso!");
    } catch (e) {
      setErro(e.message || "Não foi possível atualizar o perfil");
    } finally {
      setSaving(false);
    }
  }

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    router.push("/home");
  };

  const avatarToShow = preview || avatar || "/imagens/usuarioLaranja.png";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderBar user={user} onLogout={handleLogout} />

      <main className="flex-1">
        <div className="w-full max-w-screen-sm mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-black mb-4">Meu Perfil</h1>

          {erro && <div className="mb-3 text-red-700">{erro}</div>}
          {ok && <div className="mb-3 text-green-700">{ok}</div>}

          {!user ? (
            <div className="text-black">Carregando…</div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarToShow}
                  alt={nome || "Usuário"}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border"
                />
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Foto de perfil
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onSelectFile}
                    className="block text-sm text-black"
                  />
                  <p className="text-xs text-slate-700 mt-1">
                    PNG/JPG/JPEG. Opcional.
                  </p>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label htmlFor="nome" className="block text-sm font-semibold text-black">
                  Nome
                </label>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full p-3 mt-1 border border-orange-500 rounded-md text-orange-600"
                  placeholder="Seu nome"
                  required
                />
                <p className="text-xs text-slate-700 mt-1">
                  Mínimo 2 caracteres.
                </p>
              </div>

              {/* Email (somente leitura) */}
              <div>
                <label className="block text-sm font-semibold text-black">
                  E-mail (não editável)
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full p-3 mt-1 border border-slate-300 rounded-md bg-slate-100 text-black"
                  readOnly
                />
              </div>

              {/* Tipo de usuário (somente leitura) */}
              <div>
                <label className="block text-sm font-semibold text-black">
                  Tipo de usuário
                </label>
                <input
                  type="text"
                  value={role === "admin" ? "Admin" : "Cliente"}
                  disabled
                  className="w-full p-3 mt-1 border border-slate-300 rounded-md bg-slate-100 text-black"
                  readOnly
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!canSave}
                  className="px-4 py-2 rounded-lg bg-black text-white font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Salvando..." : "Salvar alterações"}
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
