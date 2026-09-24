"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Props = {
  professionalId: string;
};

export default function FavoritoButton({ professionalId }: Props) {
  const router = useRouter();

  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [esFavorito, setEsFavorito] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    async function cargarFavorito() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCargando(false);
        return;
      }

      setUsuarioId(user.id);

      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("client_id", user.id)
        .eq("professional_id", professionalId)
        .maybeSingle();

      if (!error) {
        setEsFavorito(!!data);
      }

      setCargando(false);
    }

    cargarFavorito();
  }, [professionalId]);

  async function alternarFavorito() {
    if (!usuarioId) {
      router.push("/login");
      return;
    }

    setActualizando(true);

    if (esFavorito) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("client_id", usuarioId)
        .eq("professional_id", professionalId);

      if (!error) {
        setEsFavorito(false);
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({
          client_id: usuarioId,
          professional_id: professionalId,
        });

      if (!error) {
        setEsFavorito(true);
      }
    }

    setActualizando(false);
  }

  if (cargando) {
    return <button disabled>Cargando favorito...</button>;
  }

  return (
    <button
      type="button"
      onClick={alternarFavorito}
      disabled={actualizando}
    >
      {actualizando
        ? "Guardando..."
        : esFavorito
          ? "?? Quitar de favoritos"
          : "?? Agregar a favoritos"}
    </button>
  );
}
