"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Tarjeta = {
  clave: string;
  titulo: string;
  detalle: string;
  href: string;
  tabla: string;
  filtro?: [string, string];
};

const TARJETAS: Tarjeta[] = [
  { clave: "usuarios", titulo: "Usuarios", detalle: "registrados", href: "/admin/usuarios", tabla: "users" },
  { clave: "suscripciones", titulo: "Suscripciones", detalle: "activas", href: "/admin/suscripciones", tabla: "subscriptions", filtro: ["status", "active"] },
  { clave: "reportes", titulo: "Reportes", detalle: "en total", href: "/admin/reportes", tabla: "reports" },
  { clave: "publicaciones", titulo: "Publicaciones", detalle: "servicios publicados", href: "/admin/publicaciones", tabla: "services" },
  { clave: "publicidad", titulo: "Publicidad", detalle: "anuncios activos", href: "/admin/publicidad", tabla: "advertisements", filtro: ["status", "active"] },
  { clave: "categorias", titulo: "Categorías", detalle: "oficios", href: "/admin/categorias", tabla: "categories" },
];

async function contar(t: Tarjeta): Promise<number | null> {
  let consulta = supabase.from(t.tabla).select("id", { count: "exact", head: true });
  if (t.filtro) consulta = consulta.eq(t.filtro[0], t.filtro[1]);
  const { count, error } = await consulta;
  return error ? null : count ?? 0;
}

export default function AdminDashboard() {
  const [conteos, setConteos] = useState<Record<string, number | null>>({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const valores = await Promise.all(TARJETAS.map((t) => contar(t)));
      setConteos(Object.fromEntries(TARJETAS.map((t, i) => [t.clave, valores[i]])));
      setCargando(false);
    }
    cargar();
  }, []);

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted">Bienvenido al panel administrativo.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TARJETAS.map((t) => (
          <a
            key={t.clave}
            href={t.href}
            className="flex flex-col gap-1 rounded-2xl bg-card p-5 shadow-sm hover:no-underline hover:shadow-md"
          >
            <span className="text-sm font-semibold text-primary-dark">{t.titulo}</span>
            <span className="text-4xl font-bold text-foreground">
              {cargando ? "…" : conteos[t.clave] ?? "–"}
            </span>
            <span className="text-sm text-muted">{t.detalle}</span>
          </a>
        ))}
      </div>
    </main>
  );
}