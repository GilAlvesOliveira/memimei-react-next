export default function HeaderBar({
  logoSrc = "/imagens/LogoMeMimei.png",
  userIconSrc = "/imagens/usuarioCinza.png",
}) {
  return (
    <header className="h-[20vh] flex items-center justify-between bg-black text-white">
      {/* Logo (maior e 10% para a direita) */}
      <div className="flex items-center ml-[10%]">
        <img src={logoSrc} alt="Logo Memimei" className="h-16 w-auto sm:h-20" />
      </div>

      {/* Link de Login (imagem maior + texto; 10% para a esquerda) */}
      <a
        href="/login"
        className="flex items-center gap-2 mr-[10%] cursor-pointer"
        aria-label="Ir para a página de Login"
      >
        <img src={userIconSrc} alt="Ícone de usuário" className="h-14 w-14" />
        <span className="text-base font-semibold">Faça Login!</span>
      </a>
    </header>
  );
}
