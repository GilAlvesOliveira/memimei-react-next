import { useEffect, useState } from "react";
import HeaderBar from "../../components/HeaderBar";
import FooterLinks from "../../components/FooterLinks";
import AdminGuard from "../../components/AdminGuard";
import { getUsuario, getCartCount } from "../../services/api";
import { getStoredUser, clearAuth, getToken } from "../../services/storage";
import Link from "next/link";

export default function AdminDashboardPage() {
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
            <h1 className="text-2xl font-bold text-black mb-4">Painel Administrativo</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/admin/produtos"
                className="block p-4 rounded-xl border hover:shadow transition bg-white"
              >
                <h2 className="text-lg font-semibold text-black">Produtos</h2>
                <p className="text-sm text-slate-700">
                  Visualize e gerencie os produtos da loja.
                </p>
              </Link>

              <Link
                href="/admin/pedidos"
                className="block p-4 rounded-xl border hover:shadow transition bg-white"
              >
                <h2 className="text-lg font-semibold text-black">Pedidos</h2>
                <p className="text-sm text-slate-700">
                  Acompanhe os pedidos realizados.
                </p>
              </Link>

              <Link
                href="/admin/usuarios"
                className="block p-4 rounded-xl border hover:shadow transition bg-white"
              >
                <h2 className="text-lg font-semibold text-black">Usuários</h2>
                <p className="text-sm text-slate-700">
                  Consulte clientes e permissões (em construção).
                </p>
              </Link>
            </div>
          </div>
        </main>

        <FooterLinks />
      </div>
    </AdminGuard>
  );
}
