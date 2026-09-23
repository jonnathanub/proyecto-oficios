"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Cuenta() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      setNombre(data?.full_name ?? user.user_metadata?.full_name ?? user.email ?? "");
      setRol(data?.role ?? user.user_metadata?.role ?? "");
      setCargando(false);
    }
    cargar();
  }, [router]);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (cargando) return <main style={{ padding: 16 }}>Cargando...</main>;

  return (
    <main style={{ maxWidth: 400, margin: "40px auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Conectado como {nombre}</h1>
      <p>Rol: {rol === "professional" ? "Profesional" : "Cliente"}</p>
      <button onClick={cerrarSesion}>Cerrar sesión</button>
    </main>
  );
}
