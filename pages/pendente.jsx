import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";

export default function PendentePage() {
  const router = useRouter();
  const { pedido } = router.query;

  const numeroPedido = useMemo(() => {
    if (!pedido) return null;
    try {
      return decodeURIComponent(String(pedido));
    } catch {
      return String(pedido);
    }
  }, [pedido]);

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Fundo dividido: esquerda preta com logo, direita CLARA (evita conflito com o laranja do card) */}
      <div className="absolute inset-0 -z-10 grid grid-cols-1 md:grid-cols-2">
        <div className="relative bg-black flex items-center justify-center p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/imagens/LogoMeMimei.png"
            alt="Logo Memimei"
            className="h-28 w-auto md:h-40 lg:h-48"
          />
        </div>
        <div className="bg-white" />
      </div>

      {/* Conteúdo */}
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div className="rounded-2xl overflow-hidden shadow-xl">
            {/* Header LARANJA (texto preto como no visual da marca) */}
            <div className="bg-[#FB923C] text-black px-6 py-4">
              <h1 className="text-2xl md:text-3xl font-extrabold text-center">
                Pagamento pendente ⏳
              </h1>
            </div>

            {/* Corpo escuro */}
            <div className="bg-black text-white px-6 py-8">
              <div className="text-center">
                <p className="text-lg leading-relaxed">
                  {numeroPedido ? (
                    <>
                      Estamos aguardando a confirmação do pagamento do{" "}
                      <span className="font-extrabold text-[#FB923C]">
                        Pedido #{numeroPedido}
                      </span>
                      . Assim que for aprovado, você verá o status atualizado em{" "}
                      <span className="underline decoration-[#FB923C]">Meus pedidos</span>.
                    </>
                  ) : (
                    <>
                      Estamos aguardando a confirmação do pagamento. Você receberá uma atualização
                      em breve.
                    </>
                  )}
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    href="/pedidos"
                    className="text-center w-full py-3 rounded-lg font-semibold bg-[#FB923C] text-black hover:brightness-95 transition"
                  >
                    Ver meus pedidos
                  </Link>
                  <Link
                    href="/home"
                    className="text-center w-full py-3 rounded-lg font-semibold border border-[#FB923C] text-[#FB923C] hover:bg-[#0f0f0f] transition"
                  >
                    Voltar para a Home
                  </Link>
                </div>
              </div>
            </div>

            {/* Listra inferior LARANJA */}
            <div className="bg-[#FB923C] h-2" />
          </div>
        </div>
      </div>
    </main>
  );
}
