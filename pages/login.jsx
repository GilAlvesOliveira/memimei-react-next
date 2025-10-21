import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const isValidEmail = email.includes("@") && email.includes(".");
  const isValidPass = senha.length > 4;
  const canSubmit = isValidEmail && isValidPass;

  const onSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    // sem funcionalidade por enquanto
  };

  return (
    // MOBILE: fundo preto total
    <main className="min-h-screen bg-black">
      {/* Container: mobile 1 coluna | desktop 2 colunas */}
      <div className="max-w-6xl mx-auto min-h-screen grid grid-cols-1 md:grid-cols-2 md:gap-8">
        {/* LOGO — MOBILE: em cima | DESKTOP: à direita com fundo preto */}
        <section className="order-1 md:order-2 flex items-center justify-center p-6 md:p-10 bg-black">
          <img
            src="/imagens/LogoMeMimei.png"
            alt="Logo Memimei"
            className="h-28 w-auto md:h-64 lg:h-72"
          />
        </section>

        {/* FORM — MOBILE: embaixo (fundo preto) | DESKTOP: à esquerda (fundo laranja) */}
        <section className="order-2 md:order-1 flex items-center justify-center p-6 md:p-10 bg-black md:bg-orange-500">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-bold mb-4 text-white">Login</h1>

            <form className="space-y-4" onSubmit={onSubmit}>
              {/* E-mail */}
              <div>
                <label htmlFor="email" className="block mb-1 font-semibold text-white">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    w-full rounded-lg px-4 py-3 border outline-none
                    bg-white border-orange-500
                    text-orange-600 placeholder-orange-400
                    focus:ring-2 focus:ring-orange-600
                    md:text-black md:placeholder-slate-400
                  "
                />
              </div>

              {/* Senha */}
              <div>
                <label htmlFor="senha" className="block mb-1 font-semibold text-white">
                  Senha
                </label>
                <input
                  id="senha"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="
                    w-full rounded-lg px-4 py-3 border outline-none
                    bg-white border-orange-500
                    text-orange-600 placeholder-orange-400
                    focus:ring-2 focus:ring-orange-600
                    md:text-black md:placeholder-slate-400
                  "
                />
              </div>

              {/* Botão: mobile laranja | desktop branco; desabilita até validar */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="
                  w-full py-3 rounded-lg font-semibold transition
                  bg-orange-600 text-white hover:bg-orange-700
                  md:bg-white md:text-black md:hover:bg-slate-100
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                aria-disabled={!canSubmit}
              >
                Entrar
              </button>
            </form>

            <div className="mt-4 text-sm text-white">
              Não tem cadastro?{" "}
              <Link href="/cadastro" className="underline cursor-pointer">
                Cadastre-se
              </Link>
            </div>

            <div className="mt-6">
              <Link href="/home" className="underline cursor-pointer text-white">
                Voltar para a Home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
