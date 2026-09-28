"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

type Anuncio = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  target_url: string | null;
};

export default function AdSlot({
  location,
  categoryId,
}: {
  location: "home_banner" | "search_results" | "category_page" | "sponsored_card";
  categoryId?: string;
}) {
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);

  useEffect(() => {
    async function cargar() {
      let consulta = supabase
        .from("advertisements")
        .select("id, title, description, image_url, target_url")
        .eq("location", location)
        .eq("status", "active")
        .lte("start_date", new Date().toISOString());

      if (categoryId) {
        consulta = consulta.or(`category_id.eq.${categoryId},category_id.is.null`);
      }

      const { data } = await consulta.limit(1).maybeSingle();

      if (data) {
        setAnuncio(data as Anuncio);
        supabase.rpc("register_ad_impression", { ad_id: data.id });
      }
    }
    cargar();
  }, [location, categoryId]);

  if (!anuncio) return null;

  async function clic() {
    if (!anuncio) return;
    await supabase.rpc("register_ad_click", { ad_id: anuncio.id });
    if (anuncio.target_url) {
      window.open(anuncio.target_url, "_blank");
    }
  }

  return (
    <div
      onClick={clic}
      style={{
        border: "1px dashed #888",
        borderRadius: 8,
        padding: 12,
        cursor: anuncio.target_url ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase" }}>
        Publicidad
      </span>
      <strong>{anuncio.title}</strong>
      {anuncio.description && <span>{anuncio.description}</span>}
    </div>
  );
}