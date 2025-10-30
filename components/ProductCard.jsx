export default function ProductCard({ produto, onAdd, onBuy }) {
  const precoBRL = Number(produto?.preco || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const estoque = Number(produto?.estoque ?? 0) || 0;
  const esgotado = estoque <= 0;

  function handleAdd() {
    if (esgotado) return;
    onAdd?.(produto);
  }
  function handleBuy() {
    if (esgotado) return;
    onBuy?.(produto);
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="w-full aspect-[4/3] bg-slate-100 relative grid place-items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={produto.imagem}
          alt={produto.nome}
          className="max-h-full max-w-full object-contain"
        />

        {esgotado && (
          <div className="absolute inset-0 bg-white/70 grid place-items-center">
            <span className="px-3 py-1.5 rounded bg-red-600 text-white font-bold">
              ESGOTADO
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-semibold leading-tight text-black">{produto.nome}</h3>
        <div className="mt-1 text-sm text-black">
          <span className="mr-2">{produto.modelo}</span>
          {produto.cor ? (
            <>
              · <span className="ml-2">{produto.cor}</span>
            </>
          ) : null}
        </div>

        <div className="mt-1 text-xs">
          {esgotado ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
              Esgotado
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800">
              Estoque: {estoque}
            </span>
          )}
        </div>

        <div className="mt-2 font-bold text-black">{precoBRL}</div>

        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={esgotado}
            className="w-full py-2.5 rounded-lg border border-orange-500 text-orange-600 font-semibold hover:bg-orange-50 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Adicionar ao carrinho"
            title={esgotado ? "Produto esgotado" : "Adicionar ao carrinho"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/imagens/carrinhoLaranja.png"
              alt="Carrinho"
              className="h-5 w-5"
            />
            Adicionar ao carrinho
          </button>

          <button
            type="button"
            onClick={handleBuy}
            disabled={esgotado}
            className="w-full py-2.5 rounded-lg bg-black text-white font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Comprar agora"
            title={esgotado ? "Produto esgotado" : "Comprar agora"}
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}