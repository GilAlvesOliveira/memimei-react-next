import Link from "next/link";

export default function CadastroPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Cadastro</h1>
        <p className="mt-2 text-slate-600">Página em construção…</p>
        <div className="mt-6 space-x-4">
          <Link href="/login" className="underline">Voltar ao Login</Link>
          <Link href="/home" className="underline">Ir para a Home</Link>
        </div>
      </div>
    </main>
  );
}
