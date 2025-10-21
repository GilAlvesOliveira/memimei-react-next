import Link from "next/link";

export default function HeaderBar({
  user,            // { nome, avatar }
  onLogout,        // função chamada ao clicar em "Sair"
  cartCount = 0,   // quantidade de itens no carrinho
  logoSrc = "/imagens/LogoMeMimei.png",
  userIconSrc = "/imagens/usuarioCinza.png",     // ícone quando NÃO está logado
  avatarFallback = "/imagens/usuarioLaranja.png" // fallback quando está logado mas sem avatar
}) {
  const isLogged = !!user;

  // Se logado e houver avatar válido, usa-o; senão, usa fallback laranja
  const avatarSrc =
    isLogged && user?.avatar && String(user.avatar).trim()
      ? user.avatar
      : avatarFallback;

  return (
    <header className="h-[20vh] flex items-center justify-between bg-black text-white">
      {/* Logo — link para /home */}
      <div className="flex items-center ml-4 sm:ml-[10%]">
        <Link href="/home" aria-label="Ir para a Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="Logo Memimei"
            className="h-10 w-auto sm:h-16 cursor-pointer"
          />
        </Link>
      </div>

      {/* Direita: (logado) Carrinho + avatar + nome + Sair | (deslogado) Login */}
      <div className="flex items-center gap-2 sm:gap-3 mr-4 sm:mr-[10%]">
        {isLogged ? (
          <>
            {/* Carrinho + badge */}
            <Link
              href="/carrinho"
              className="inline-flex items-center justify-center relative"
              aria-label="Ir para o carrinho"
              title="Carrinho"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/imagens/carrinhoLaranja.png"
                alt="Carrinho"
                className="h-6 w-6 sm:h-8 sm:w-8"
              />
              {cartCount > 0 && (
                <span
                  className="
                    absolute -bottom-1 -left-1 sm:-bottom-1 sm:-left-1
                    bg-orange-500 text-white
                    text-[10px] sm:text-xs font-bold
                    rounded-full
                    min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px]
                    flex items-center justify-center px-1
                  "
                  aria-label={`${cartCount} item(ns) no carrinho`}
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Avatar */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarSrc}
              alt={user?.nome || "Usuário"}
              className="h-10 w-10 sm:h-14 sm:w-14 rounded-full object-cover"
            />

            {/* Nome (truncado para não esmagar layout) */}
            <span className="text-sm sm:text-base font-semibold truncate max-w-[34vw] sm:max-w-[20rem]">
              {user?.nome || "Usuário"}
            </span>

            {/* Sair (menor no mobile) */}
            <button
              type="button"
              onClick={onLogout}
              className="ml-1 px-2 py-1 sm:px-3 sm:py-2 rounded-lg border border-white text-white hover:bg-white hover:text-black transition text-xs sm:text-sm"
              aria-label="Sair da conta"
            >
              Sair
            </button>
          </>
        ) : (
          <a
            href="/login"
            className="flex items-center gap-2 cursor-pointer"
            aria-label="Ir para a página de Login"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={userIconSrc} alt="Ícone de usuário" className="h-10 w-10 sm:h-14 sm:w-14" />
            <span className="text-sm sm:text-base font-semibold">Faça Login!</span>
          </a>
        )}
      </div>
    </header>
  );
}
