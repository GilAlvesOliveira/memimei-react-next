export default function HeaderBar({
  user,            // { nome, avatar }
  onLogout,        // função chamada ao clicar em "Sair"
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
      {/* Logo (10% para a direita) */}
      <div className="flex items-center ml-[10%]">
        <img src={logoSrc} alt="Logo Memimei" className="h-16 w-auto sm:h-20" />
      </div>

      {/* Direita: se logado mostra avatar+nome+Sair; senão, link de login */}
      <div className="flex items-center gap-3 mr-[10%]">
        {isLogged ? (
          <>
            <img
              src={avatarSrc}
              alt={user?.nome || "Usuário"}
              className="h-14 w-14 rounded-full object-cover"
            />
            <span className="text-base font-semibold truncate max-w-[40vw] sm:max-w-[20rem]">
              {user?.nome || "Usuário"}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="ml-2 px-3 py-2 rounded-lg border border-white text-white hover:bg-white hover:text-black transition"
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
            <img src={userIconSrc} alt="Ícone de usuário" className="h-14 w-14" />
            <span className="text-base font-semibold">Faça Login!</span>
          </a>
        )}
      </div>
    </header>
  );
}
