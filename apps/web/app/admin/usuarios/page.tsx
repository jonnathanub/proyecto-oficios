"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Usuario = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  suspended: boolean;
  created_at: string;
};

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState<string | null>(null);

  async function cargar() {
    const { data } = await supabase
      .from("users")
      .select("id, email, full_name, role, suspended, created_at")
      .order("created_at", { ascending: false });
    setUsuarios((data ?? []) as Usuario[]);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function alternarSuspension(id: string, actual: boolean) {
    setActualizando(id);
    await supabase.from("users").update({ suspended: !actual }).eq("id", id);
    await cargar();
    setActualizando(null);
  }

  if (cargando) return <p>Cargando...</p>;

  return (
    <main>
      <h1>Usuarios</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Nombre</th>
            <th style={{ textAlign: "left" }}>Correo</th>
            <th style={{ textAlign: "left" }}>Rol</th>
            <th style={{ textAlign: "left" }}>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} style={{ borderTop: "1px solid #444" }}>
              <td>{u.full_name ?? "Sin nombre"}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.suspended ? "Suspendido" : "Activo"}</td>
              <td>
                {u.role !== "admin" && (
                  <button
                    onClick={() => alternarSuspension(u.id, u.suspended)}
                    disabled={actualizando === u.id}
                  >
                    {u.suspended ? "Reactivar" : "Suspender"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}