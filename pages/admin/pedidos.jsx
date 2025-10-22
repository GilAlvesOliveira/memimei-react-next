import { useEffect, useState } from "react";
import HeaderBar from "../../components/HeaderBar";
import FooterLinks from "../../components/FooterLinks";
import AdminGuard from "../../components/AdminGuard";
import { getUsuario, getCartCount } from "../../services/api";
import { getStoredUser, clearAuth, getToken } from "../../services/storage";

export default function AdminPedidosPage() {
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
    <AdminGuard>
      <div className="min-h-screen flex flex-col bg-white">
        <HeaderBar user={user} onLogout={handleLogout} cartCount={cartCount} />

        <main className="flex-1">
          <div className="w-full max-w-screen-md mx-auto px-3 py-6">
            <h1 className="text-2xl font-bold text-black mb-2">Pedidos</h1>
            <p className="text-slate-700">Em construção — aguardando endpoints do backend.</p>
          </div>
        </main>

        <FooterLinks />
      </div>
    </AdminGuard>
  );
}
