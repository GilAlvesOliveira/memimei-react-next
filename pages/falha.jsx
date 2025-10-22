import Link from "next/link";

export default function FalhaPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-black">Pagamento não concluído 😕</h1>
        <p className="mt-2 text-slate-700">
          O pagamento foi cancelado ou falhou. Você pode tentar novamente.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/home" className="underline text-black">
            Voltar para a Home
          </Link>
        </div>
      </div>
    </main>
  );
}
