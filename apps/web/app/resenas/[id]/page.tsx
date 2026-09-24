"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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

  if (cargando) return <main style={{ padding: 16 }}>Cargando...</main>;

  if (!permitido) {
    return (
      <main style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
        <h1>Calificar servicio</h1>
        <p>{mensaje}</p>
        <a href="/solicitudes">Volver a mis solicitudes</a>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "40px auto",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <h1>Calificar servicio</h1>

      <label>¿Cómo calificarías el trabajo?</label>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            style={{
              fontSize: 24,
              padding: "4px 10px",
              cursor: "pointer",
              background: n <= rating ? "#f5b301" : "transparent",
              border: "1px solid #666",
              borderRadius: 6,
            }}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        rows={4}
        placeholder="Cuéntanos cómo te fue (opcional)"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />

      <button onClick={enviar} disabled={enviando} style={{ padding: "8px 10px", cursor: "pointer" }}>
        {enviando ? "Enviando..." : "Enviar calificación"}
      </button>

      {mensaje && <p>{mensaje}</p>}

      <a href="/solicitudes">Cancelar</a>
    </main>
  );
}