import { useEffect } from "react";
import { getToken, getStoredUser, setPostLoginAction } from "../services/storage";
import { useRouter } from "next/router";

export default function AdminGuard({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (!token) {
      setPostLoginAction({ type: "redirect", redirect: router.asPath || "/dashboardAdmin" });
      router.replace("/login");
      return;
    }

    const role = (user?.role || "").toLowerCase();
    if (role !== "admin") {
      router.replace("/home");
      return;
    }
  }, [router]);

  return <>{children}</>;
}
