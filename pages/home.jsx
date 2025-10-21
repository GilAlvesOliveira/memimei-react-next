import { useEffect, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import PromoBanner from "../components/PromoBanner";
import BrandButton from "../components/BrandButton";
import FooterLinks from "../components/FooterLinks";
import brands from "../lib/brands";
import { toSlug } from "../lib/brandMap";
import { getUsuario } from "../services/api";
import { getStoredUser, getToken, clearAuth } from "../services/storage";

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    (async () => {
      try {
        const freshUser = await getUsuario();
        setUser(freshUser);
      } catch {
        const local = getStoredUser();
        setUser(local || null);
      }
    })();
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderBar user={user} onLogout={handleLogout} />

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
    </div>
  );
}
