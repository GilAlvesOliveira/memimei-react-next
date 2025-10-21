export default function ProductCard({ produto, onAdd, onBuy }) {
  const precoBRL = Number(produto?.preco || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="w-full aspect-[4/3] bg-slate-100 grid place-items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={produto.imagem}
          alt={produto.nome}
          className="max-h-full max-w-full object-contain"
        />
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

        <div className="mt-2 font-bold text-black">{precoBRL}</div>

        {/* Ações */}
        <div className="mt-3 flex flex-col gap-2">
          {/* Adicionar ao carrinho */}
          <button
            type="button"
            onClick={() => onAdd?.(produto)}
            className="w-full py-2.5 rounded-lg border border-orange-500 text-orange-600 font-semibold hover:bg-orange-50 transition flex items-center justify-center gap-2"
            aria-label="Adicionar ao carrinho"
            title="Adicionar ao carrinho"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/imagens/carrinhoLaranja.png"
              alt="Carrinho"
              className="h-5 w-5"
            />
            Adicionar ao carrinho
          </button>

          {/* Comprar (add + ir para o carrinho) */}
          <button
            type="button"
            onClick={() => onBuy?.(produto)}
            className="w-full py-2.5 rounded-lg bg-black text-white font-semibold hover:opacity-90 transition"
            aria-label="Comprar agora"
            title="Comprar agora"
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
