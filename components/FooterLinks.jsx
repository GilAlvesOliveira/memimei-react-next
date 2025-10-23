export default function FooterLinks({
  instagramUrl = "https://www.instagram.com/memimei.presentes/",
  whatsappUrl = "https://wa.me/5515991254042",
  instagramImg = "/imagens/instagramLogo.jpg",
  whatsappImg = "/imagens/whatsappLogo.png",
  phoneText = "WhatsApp (15) 991254042",
}) {
  return (
    <footer className="h-[20vh] bg-orange-500 px-4 py-3">
      <div className="h-full flex flex-col justify-center items-center gap-3">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 cursor-pointer"
        >
          <img src={instagramImg} alt="Instagram" className="h-6 w-6 rounded" />
          <span className="text-base font-semibold text-black">Instagram</span>
        </a>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 cursor-pointer"
        >
          <img src={whatsappImg} alt="WhatsApp" className="h-6 w-6" />
          <span className="text-base font-semibold text-black">{phoneText}</span>
        </a>
      </div>
    </footer>
  );
}
