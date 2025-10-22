import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";

export default function FalhaPage() {
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
      {/* Fundo dividido: esquerda preta com logo, direita neutra escura */}
      <div className="absolute inset-0 -z-10 grid grid-cols-1 md:grid-cols-2">
        <div className="relative bg-black flex items-center justify-center p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/imagens/LogoMeMimei.png"
            alt="Logo Memimei"
            className="h-28 w-auto md:h-40 lg:h-48"
          />
        </div>
        <div className="bg-[#111827]" />
      </div>

      {/* Conteúdo */}
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div className="rounded-2xl overflow-hidden shadow-xl">
            {/* Header VERMELHO */}
            <div className="bg-[#EF4444] text-white px-6 py-4">
              <h1 className="text-2xl md:text-3xl font-extrabold text-center">
                Pagamento não concluído 😕
              </h1>
            </div>

            {/* Corpo escuro */}
            <div className="bg-black text-white px-6 py-8">
              <div className="text-center">
                <p className="text-lg leading-relaxed">
                  {numeroPedido ? (
                    <>
                      O pagamento do{" "}
                      <span className="font-extrabold text-[#EF4444]">
                        Pedido #{numeroPedido}
                      </span>{" "}
                      não foi aprovado ou foi cancelado. Você pode tentar novamente.
                    </>
                  ) : (
                    <>O pagamento foi cancelado ou falhou. Você pode tentar novamente.</>
                  )}
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    href="/carrinho"
                    className="text-center w-full py-3 rounded-lg font-semibold bg-[#EF4444] text-white hover:brightness-95 transition"
                  >
                    Tentar novamente
                  </Link>
                  <Link
                    href="/home"
                    className="text-center w-full py-3 rounded-lg font-semibold border border-[#EF4444] text-[#EF4444] hover:bg-[#0f0f0f] transition"
                  >
                    Voltar para a Home
                  </Link>
                </div>
              </div>
            </div>

            {/* Listra inferior VERMELHA */}
            <div className="bg-[#EF4444] h-2" />
          </div>
        </div>
      </div>
    </main>
  );
}
