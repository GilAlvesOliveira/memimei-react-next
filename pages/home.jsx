import { useEffect, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import PromoBanner from "../components/PromoBanner";
import BrandButton from "../components/BrandButton";
import FooterLinks from "../components/FooterLinks";
import CompleteProfileBanner from "../components/CompleteProfileBanner";
import brands from "../lib/brands";
import { getUsuario, getCartCount } from "../services/api";
import { getStoredUser, getToken, clearAuth } from "../services/storage";
import { toSlug } from "../lib/brandMap";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setCartCount(0);
      return;
    }
    (async () => {
      try {
        const [freshUser, count] = await Promise.all([
          getUsuario().catch(() => getStoredUser() || null),
          getCartCount().catch(() => 0),
        ]);
        setUser(freshUser);
        setCartCount(count);
      } catch {
        setUser(getStoredUser() || null);
        setCartCount(0);
      }
    })();
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setCartCount(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderBar user={user} onLogout={handleLogout} cartCount={cartCount} />

      <main className="flex-1">
        <PromoBanner />
        <div className="w-full max-w-screen-md mx-auto px-3 py-6 space-y-3">
          {brands.map((name) => (
            <BrandButton
              key={name}
              label={name}
              href={`/produtos/${toSlug(name)}`}
            />
          ))}
        </div>
      </main>

      <FooterLinks />

      {/* Banner flutuante para completar perfil:
          aparece apenas se faltar telefone/endereco e o usuário não tiver dispensado */}
      <CompleteProfileBanner user={user} />
    </div>
  );
}
