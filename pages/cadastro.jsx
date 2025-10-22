import { useState } from "react";
import { useRouter } from "next/router";
import HeaderBar from "../components/HeaderBar";
import FooterLinks from "../components/FooterLinks";

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [senhaErro, setSenhaErro] = useState("");

  function handleInputChange(e) {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  // Valida se a senha e a confirmação são iguais
  function validarSenha() {
    if (form.senha !== form.confirmarSenha) {
      setSenhaErro("As senhas não coincidem.");
    } else {
      setSenhaErro("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (form.senha !== form.confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    if (form.senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const formData = new FormData();
      formData.append("nome", form.nome);
      formData.append("email", form.email);
      formData.append("senha", form.senha);
      if (form.file) formData.append("file", form.file);

      // Fazendo a chamada à API para o endpoint correto
      const res = await fetch("https://me-mimei-teste-case-shop.vercel.app/api/auth/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("Resposta da API:", data); // Adicionando log da resposta para debugar

      if (!res.ok) throw new Error(data.erro || "Erro ao cadastrar usuário");

      setSucesso("Cadastro realizado com sucesso!");

      // Após o cadastro, redirecionar para a página de login.
      router.push("/login");

    } catch (err) {
      console.error("Erro:", err); // Log para entender o erro no frontend
      setErro(err.message || "Erro ao cadastrar usuário.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <HeaderBar />
      <main className="flex-1">
        <div className="w-full max-w-screen-sm mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-black mb-4">Cadastro</h1>

          {erro && <div className="text-red-600 mb-4">{erro}</div>}
          {sucesso && <div className="text-green-600 mb-4">{sucesso}</div>}
          {senhaErro && <div className="text-red-600 mb-4">{senhaErro}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-semibold text-black">Nome</label>
              <input
                type="text"
                name="nome"
                id="nome"
                value={form.nome}
                onChange={handleInputChange}
                className="w-full p-3 mt-1 border border-orange-500 rounded-md text-orange-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-black">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                value={form.email}
                onChange={handleInputChange}
                className="w-full p-3 mt-1 border border-orange-500 rounded-md text-orange-500"
                required
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-semibold text-black">Senha</label>
              <input
                type="password"
                name="senha"
                id="senha"
                value={form.senha}
                onChange={handleInputChange}
                onBlur={validarSenha}
                className="w-full p-3 mt-1 border border-orange-500 rounded-md text-orange-500"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmarSenha" className="block text-sm font-semibold text-black">Confirmar Senha</label>
              <input
                type="password"
                name="confirmarSenha"
                id="confirmarSenha"
                value={form.confirmarSenha}
                onChange={handleInputChange}
                onBlur={validarSenha}
                className="w-full p-3 mt-1 border border-orange-500 rounded-md text-orange-500"
                required
              />
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-semibold text-black">Foto (opcional)</label>
              <input
                type="file"
                name="file"
                accept="image/*"
                onChange={handleInputChange}
                className="w-full p-3 mt-1 border border-orange-500 rounded-md text-orange-500"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || senhaErro}
                className="w-full p-3 mt-4 bg-orange-600 text-white font-semibold rounded-md disabled:opacity-50"
              >
                {loading ? "Cadastrando..." : "Cadastrar"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <FooterLinks />
    </div>
  );
}
