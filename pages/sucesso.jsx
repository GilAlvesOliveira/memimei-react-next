import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

/** Confetes leves, sem libs externas */
function ConfettiCanvas({ duration = 6000 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const colors = [
      "#86efac", // green-300
      "#22c55e", // green-500
      "#fb923c", // orange-400
      "#fde047", // yellow-300
      "#ffffff", // white
    ];

    const gravity = 0.15;
    const particles = Array.from({ length: 220 }).map(() => ({
      x: Math.random() * w,
      y: -h * Math.random() * 0.3 - 20,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 2 + 1,
      size: 4 + Math.random() * 6,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
      color: colors[(Math.random() * colors.length) | 0],
    }));

    let start = performance.now();
    let rafId;

    const draw = (t) => {
      const elapsed = t - start;
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        // retângulo fininho para parecer papel picado
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();

        // respawn enquanto durar a animação
        if (p.y > h + 20 || p.x < -20 || p.x > w + 20) {
          if (elapsed < duration) {
            p.x = Math.random() * w;
            p.y = -10;
            p.vx = (Math.random() - 0.5) * 4;
            p.vy = Math.random() * 2 + 1;
            p.size = 4 + Math.random() * 6;
            p.angle = Math.random() * Math.PI * 2;
            p.spin = (Math.random() - 0.5) * 0.2;
            p.color = colors[(Math.random() * colors.length) | 0];
          }
        }
      });

      if (elapsed < duration + 1200) {
        rafId = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, [duration]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-40" />;
}

export default function SucessoPage() {
  const router = useRouter();
  const pedidoId = router.query?.pedido;

  return (
    <main className="min-h-screen relative">
      {/* Confetes sobre tudo */}
      <ConfettiCanvas duration={6000} />

      {/* Fundo dividido: esquerda preta com logo, direita laranja */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
        <section className="bg-black flex items-center justify-center p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/imagens/LogoMeMimei.png"
            alt="Logo Memimei"
            className="h-24 w-auto md:h-40 lg:h-48"
          />
        </section>
        <section className="bg-orange-500" />
      </div>

      {/* Card central */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-2xl bg-white border-2 border-green-400 shadow-xl p-6 text-center z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-green-600">
            Pagamento aprovado! 🎉
          </h1>

          {pedidoId ? (
            <div className="mt-2 inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">
              Pedido <span className="font-bold">#{pedidoId}</span>
            </div>
          ) : null}

          <p className="mt-4 text-slate-700">
            Recebemos a confirmação do seu pagamento. Seu pedido será processado em breve.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/meus-pedidos"
              className="px-5 py-2.5 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition"
            >
              Ver meus pedidos
            </Link>
            <Link
              href="/home"
              className="px-5 py-2.5 rounded-lg border-2 border-green-400 text-green-700 font-semibold hover:bg-green-50 transition"
            >
              Voltar para a Home
            </Link>
          </div>
        </div>
      </div>

      {/* Faixa inferior verde clara */}
      <div className="fixed bottom-0 left-0 right-0 h-2 bg-green-400 z-10" />
    </main>
  );
}
