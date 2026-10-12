"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";

const ENLACES = [
  { href: "/admin", texto: "Dashboard" },
  { href: "/admin/usuarios", texto: "Usuarios" },
  { href: "/admin/publicaciones", texto: "Publicaciones" },
  { href: "/admin/publicidad", texto: "Publicidad" },
  { href: "/admin/reportes", texto: "Reportes" },
  { href: "/admin/categorias", texto: "Categorías" },
  { href: "/admin/suscripciones", texto: "Suscripciones" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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

  if (cargando) {
    return <main className="p-10 text-center text-muted">Verificando acceso...</main>;
  }
  if (!autorizado) return null;

  const activo = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-border bg-card md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <a href="/" className="text-2xl font-bold text-primary hover:no-underline">
            Oficios
          </a>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted md:mt-1">
            Panel de administración
          </p>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-4">
          {ENLACES.map((e) => (
            <a
              key={e.href}
              href={e.href}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium hover:no-underline ${
                activo(e.href)
                  ? "bg-primary text-white"
                  : "text-foreground hover:bg-background"
              }`}
            >
              {e.texto}
            </a>
          ))}
          <a
            href="/cuenta"
            className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-background hover:no-underline md:mt-4"
          >
            ← Salir del panel
          </a>
        </nav>
      </aside>

      <div className="flex-1 overflow-x-auto p-4 md:p-8">{children}</div>
    </div>
  );
}