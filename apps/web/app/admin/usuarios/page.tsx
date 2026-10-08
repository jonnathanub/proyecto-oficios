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

const POR_PAGINA = 20;

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);

  async function cargar() {
    setCargando(true);
    const desde = (pagina - 1) * POR_PAGINA;
    const hasta = desde + POR_PAGINA - 1;

    const { data, count } = await supabase
      .from("users")
      .select("id, full_name, role, suspended, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(desde, hasta);

    const lista = (data ?? []) as Omit<Usuario, "email">[];
    const { data: correos } = await supabase.rpc("admin_emails", { p_ids: lista.map((x) => x.id) });
    const mapaCorreos = Object.fromEntries(((correos ?? []) as { id: string; correo: string }[]).map((c) => [c.id, c.correo]));
    setUsuarios(lista.map((x) => ({ ...x, email: mapaCorreos[x.id] ?? "" })));
    setTotal(count ?? 0);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, [pagina]);

  async function alternarSuspension(id: string, actual: boolean) {
    setActualizando(id);
    await supabase.from("users").update({ suspended: !actual }).eq("id", id);
    await cargar();
    setActualizando(null);
  }

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  if (cargando) return <p>Cargando...</p>;

  return (
    <main>
      <h1>Usuarios</h1>
      <p style={{ fontSize: 13, opacity: 0.75 }}>
        {total} usuario{total !== 1 ? "s" : ""} - pagina {pagina} de {totalPaginas}
      </p>
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

      {totalPaginas > 1 && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 16 }}>
          {pagina > 1 && (
            <button onClick={() => setPagina((p) => p - 1)}>Anterior</button>
          )}
          <span>Pagina {pagina} de {totalPaginas}</span>
          {pagina < totalPaginas && (
            <button onClick={() => setPagina((p) => p + 1)}>Siguiente</button>
          )}
        </div>
      )}
    </main>
  );
}