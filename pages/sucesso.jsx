import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

/** Confete simples (sem libs) */
function Confetti({ show = true, pieces = 120, duration = 5000 }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!show) return;
    const arr = Array.from({ length: pieces }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,         // %
      delay: Math.random() * 1.1,        // s
      time: 2.6 + Math.random() * 2.2,   // s
      size: 6 + Math.round(Math.random() * 8), // px
      rot: Math.round(Math.random() * 360),
      color: ["#5cec5cff", "#FFFFFF", "#16A34A", "#FB923C"][
        Math.floor(Math.random() * 4)
      ],
    }));
    setItems(arr);
  }, [show, pieces]);

  const [visible, setVisible] = useState(show);
  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [show, duration]);

  if (!visible) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-30">
        {items.map((p) => (
          <span
            key={p.id}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.time}s`,
              width: `${p.size}px`,
              height: `${Math.round(p.size * 1.8)}px`,
              backgroundColor: p.color,
              transform: `rotate(${p.rot}deg)`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        .confetti-piece {
          position: absolute;
          top: -10%;
          opacity: 0.95;
          border-radius: 2px;
          animation-name: confettiFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes confettiFall {
          0% {
            transform: translate3d(0, -110%, 0) rotate(0deg);
          }
          100% {
            transform: translate3d(0, 110vh, 0) rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

export default function SucessoPage() {
  const router = useRouter();
  const { pedido } = router.query;
  const [showFx, setShowFx] = useState(true);

  const numeroPedido = useMemo(() => {
    if (!pedido) return null;
    try {
      return decodeURIComponent(String(pedido));
    } catch {
      return String(pedido);
    }
  }, [pedido]);

  useEffect(() => {
    const t = setTimeout(() => setShowFx(false), 6000);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Fundo dividido: esquerda preta com logo, direita laranja */}
      <div className="absolute inset-0 -z-10 grid grid-cols-1 md:grid-cols-2">
        {/* Esquerda: preto + logo */}
        <div className="relative bg-black flex items-center justify-center p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/imagens/LogoMeMimei.png"
            alt="Logo Memimei"
            className="h-28 w-auto md:h-40 lg:h-48 opacity-100"
          />
        </div>
        {/* Direita: laranja */}
        <div className="bg-[#FB923C]" />
      </div>

      {/* Confete */}
      <Confetti show={showFx} />

      {/* Conteúdo */}
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div className="rounded-2xl overflow-hidden shadow-xl">
            {/* Cabeçalho VERDE */}
            <div className="bg-[#22C55E] text-white px-6 py-4">
              <h1 className="text-2xl md:text-3xl font-extrabold text-center">
                Pagamento aprovado! 🎉
              </h1>
            </div>

            {/* Corpo escuro */}
            <div className="bg-black text-white px-6 py-8">
              <div className="text-center">
                {/* Espaço para respiro abaixo do logo de fundo */}
                <p className="text-lg leading-relaxed">
                  {numeroPedido ? (
                    <>
                      Recebemos a confirmação do pagamento do{" "}
                      <span className="font-extrabold text-[#22C55E]">
                        Pedido #{numeroPedido}
                      </span>
                      . Em instantes você verá a atualização em{" "}
                      <span className="underline decoration-[#22C55E]">
                        Meus pedidos
                      </span>
                      .
                    </>
                  ) : (
                    <>
                      Recebemos a confirmação do seu pagamento. Seu pedido será
                      processado em breve.
                    </>
                  )}
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    href="/home"
                    className="text-center w-full py-3 rounded-lg font-semibold bg-[#22C55E] text-black hover:brightness-95 transition"
                  >
                    Voltar à Home
                  </Link>
                  <Link
                    href="/meus-pedidos"
                    className="text-center w-full py-3 rounded-lg font-semibold border border-[#22C55E] text-[#22C55E] hover:bg-[#0f0f0f] transition"
                  >
                    Ver meus pedidos
                  </Link>
                </div>
              </div>
            </div>

            {/* Listra inferior VERDE */}
            <div className="bg-[#22C55E] h-2" />
          </div>
        </div>
      </div>
    </main>
  );
}
