"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const ETIQUETAS: Record<number, string> = {
  1: "Muy malo",
  2: "Malo",
  3: "Regular",
  4: "Bueno",
  5: "Excelente",
};

function Cabecera() {
  return (
    <header className="border-b border-border bg-card">
      <nav className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-3">
        <a href="/" className="text-2xl font-bold text-primary hover:no-underline">
          Oficios
        </a>
        <a href="/cuenta" className="text-sm">
          Mi cuenta
        </a>
      </nav>
    </header>
  );
}

export default function Resena() {
  const router = useRouter();
  const params = useParams();
  const solicitudId = params.id as string;

  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [permitido, setPermitido] = useState(false);
  const [professionalId, setProfessionalId] = useState("");
  const [rating, setRating] = useState(5);
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: sr, error } = await supabase
        .from("service_requests")
        .select("id, client_id, professional_id, status")
        .eq("id", solicitudId)
        .single();

      if (error || !sr) {
        setMensaje("No se encontró la solicitud.");
        setCargando(false);
        return;
      }

      if (sr.client_id !== user.id || sr.status !== "completed") {
        setMensaje("Esta solicitud no está disponible para calificar.");
        setCargando(false);
        return;
      }

      const { data: existente } = await supabase
        .from("reviews")
        .select("id")
        .eq("service_request_id", solicitudId)
        .maybeSingle();

      if (existente) {
        setMensaje("Ya calificaste este servicio.");
        setCargando(false);
        return;
      }

      setProfessionalId(sr.professional_id);
      setPermitido(true);
      setCargando(false);
    }
    cargar();
  }, [solicitudId, router]);

  async function enviar() {
    setEnviando(true);
    setMensaje("");

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("reviews").insert({
      service_request_id: solicitudId,
      client_id: user!.id,
      professional_id: professionalId,
      rating,
      comment: comentario || null,
    });

    if (error) {
      setMensaje(`No se pudo guardar: ${error.message}`);
      setEnviando(false);
      return;
    }

    router.push("/solicitudes");
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen flex-col">
        <Cabecera />
        <main className="mx-auto w-full max-w-md px-4 py-10 text-center text-muted">
          Cargando...
        </main>
      </div>
    );
  }

  if (!permitido) {
    return (
      <div className="flex min-h-screen flex-col">
        <Cabecera />
        <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
          <h1>Calificar servicio</h1>
          <p className="rounded-2xl bg-card p-5 shadow-sm">{mensaje}</p>
          <a href="/solicitudes">Volver a mis solicitudes</a>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Cabecera />

      <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-8">
        <h1>Calificar servicio</h1>

        <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-center">¿Cómo calificarías el trabajo?</p>

          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                aria-label={`${n} estrellas`}
                className={`rounded-xl px-3 py-1 text-4xl leading-none ${
                  n <= rating ? "bg-accent text-white" : "bg-gray-100 text-gray-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <p className="text-center font-semibold text-muted">{ETIQUETAS[rating]}</p>

          <textarea
            rows={4}
            placeholder="Cuéntanos cómo te fue (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />

          {mensaje && (
            <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-danger">{mensaje}</p>
          )}

          <button onClick={enviar} disabled={enviando} className="w-full">
            {enviando ? "Enviando..." : "Enviar calificación"}
          </button>
        </div>

        <a href="/solicitudes" className="text-center">
          Cancelar
        </a>
      </main>
    </div>
  );
}