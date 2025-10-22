import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/**
 * Banner flutuante e descartável pedindo para completar o perfil.
 * Mostra apenas se faltar telefone (WhatsApp) ou endereço.
 * Persistência por usuário via localStorage: profileBannerDismissed:<userId>
 */
export default function CompleteProfileBanner({ user }) {
  const uid = useMemo(() => {
    // tenta vários formatos de id (_id, id, $oid)
    const raw =
      user?._id ||
      user?.id ||
      (user?._id && user._id.$oid) ||
      (user?.id && user.id.$oid) ||
      null;
    if (!raw) return null;
    if (typeof raw === "string") return raw;
    if (typeof raw === "object" && raw.$oid) return String(raw.$oid);
    return String(raw);
  }, [user]);

  const hasPhone = !!(user?.telefone && String(user.telefone).trim());
  const hasAddress = !!(user?.endereco && String(user.endereco).trim());
  const needsUpdate = !!user && (!hasPhone || !hasAddress);

  const storageKey = uid ? `profileBannerDismissed:${uid}` : null;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const v = localStorage.getItem(storageKey);
      setDismissed(v === "1");
    } catch {}
  }, [storageKey]);

  if (!needsUpdate || dismissed) return null;

  function handleClose() {
    setDismissed(true);
    try {
      if (storageKey) localStorage.setItem(storageKey, "1");
    } catch {}
  }

  return (
    <div
      className="
        fixed z-50
        left-2 right-2 bottom-3
        md:left-auto md:right-4 md:bottom-4
        max-w-full md:max-w-md
      "
      role="alert"
      aria-live="polite"
    >
      <div className="rounded-xl border border-yellow-300 bg-yellow-50 text-yellow-900 shadow-lg">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-xl" aria-hidden>⚠</div>
            <div className="flex-1">
              <h3 className="font-bold">Complete seu cadastro</h3>
              <p className="text-sm mt-1">
                Estamos sem {hasPhone ? "" : "seu WhatsApp"}
                {!hasPhone && !hasAddress ? " e " : ""}
                {hasAddress ? "" : "seu endereço"}. Isso ajuda na entrega e no contato.
              </p>

              <div className="mt-3 flex items-center gap-2">
                <Link
                  href="/perfil"
                  className="
                    inline-flex items-center justify-center
                    px-3 py-1.5 rounded-lg
                    bg-black text-white font-semibold
                    hover:opacity-90 transition
                  "
                >
                  Atualizar agora
                </Link>
                <button
                  type="button"
                  onClick={handleClose}
                  className="
                    inline-flex items-center justify-center
                    px-3 py-1.5 rounded-lg
                    border border-yellow-400 text-yellow-900
                    hover:bg-yellow-100 transition
                  "
                  aria-label="Fechar aviso"
                  title="Fechar"
                >
                  Fechar
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="ml-1 text-yellow-900/70 hover:text-yellow-900"
              aria-label="Fechar aviso"
              title="Fechar"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
