"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: u } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (u?.role !== "admin") {
        router.push("/cuenta");
        return;
      }

      setAutorizado(true);
      setCargando(false);
    }
    verificar();
  }, [router]);

  if (cargando) return <main style={{ padding: 16 }}>Verificando acceso...</main>;
  if (!autorizado) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav
        style={{
          width: 200,
          borderRight: "1px solid #666",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <strong>Panel Admin</strong>
        <a href="/admin">Dashboard</a>
        <a href="/admin/usuarios">Usuarios</a>
        <a href="/cuenta">Salir del panel</a>
      </nav>
      <div style={{ flex: 1, padding: 16 }}>{children}</div>
    </div>
  );
}