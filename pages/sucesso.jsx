import Link from "next/link";
import { useRouter } from "next/router";

export default function SucessoPage() {
  const router = useRouter();
  const { pedido } = router.query;

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-black">Pagamento aprovado! 🎉</h1>

        {pedido ? (
          <p className="mt-2 text-slate-700">
            Recebemos a confirmação do pagamento do <strong>Pedido #{pedido}</strong>.
            Em instantes você verá a atualização no seu histórico.
          </p>
        ) : (
          <p className="mt-2 text-slate-700">
            Recebemos a confirmação do seu pagamento. Seu pedido será processado em breve.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <Link href="/home" className="underline text-black">
            Voltar para a Home
          </Link>
        </div>
      </div>
    </main>
  );
}
