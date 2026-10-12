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

const ROLES: Record<string, string> = {
  admin: "Administrador",
  professional: "Profesional",
  client: "Cliente",
};

const COLOR_ROL: Record<string, string> = {
  admin: "bg-indigo-100 text-indigo-800",
  professional: "bg-blue-100 text-blue-900",
  client: "bg-gray-100 text-gray-700",
};

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
    const mapaCorreos = Object.fromEntries(
      ((correos ?? []) as { id: string; correo: string }[]).map((c) => [c.id, c.correo])
    );
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

  if (cargando) return <p className="py-10 text-center text-muted">Cargando...</p>;

  return (
    <main className="flex flex-col gap-5">
      <div>
        <h1>Usuarios</h1>
        <p className="text-sm text-muted">
          {total} usuario{total !== 1 ? "s" : ""} · página {pagina} de {totalPaginas}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="font-medium">{u.full_name ?? "Sin nombre"}</td>
                <td className="text-muted">{u.email}</td>
                <td>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      COLOR_ROL[u.role] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {ROLES[u.role] ?? u.role}
                  </span>
                </td>
                <td>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      u.suspended ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {u.suspended ? "Suspendido" : "Activo"}
                  </span>
                </td>
                <td className="text-right">
                  {u.role !== "admin" && (
                    <button
                      onClick={() => alternarSuspension(u.id, u.suspended)}
                      disabled={actualizando === u.id}
                      className={
                        u.suspended
                          ? "border border-primary bg-white text-primary"
                          : "bg-danger"
                      }
                    >
                      {u.suspended ? "Reactivar" : "Suspender"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-4">
          {pagina > 1 && (
            <button
              onClick={() => setPagina((p) => p - 1)}
              className="border border-primary bg-white text-primary"
            >
              ← Anterior
            </button>
          )}
          <span className="text-sm text-muted">
            Página {pagina} de {totalPaginas}
          </span>
          {pagina < totalPaginas && (
            <button
              onClick={() => setPagina((p) => p + 1)}
              className="border border-primary bg-white text-primary"
            >
              Siguiente →
            </button>
          )}
        </div>
      )}
    </main>
  );
}