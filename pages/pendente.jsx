import Link from "next/link";

export default function PendentePage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-black">Pagamento pendente ⏳</h1>
        <p className="mt-2 text-slate-700">
          Estamos aguardando a confirmação do pagamento. Você receberá uma atualização em breve.
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
