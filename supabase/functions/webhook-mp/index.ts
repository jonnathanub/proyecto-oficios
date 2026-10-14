import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    let body: any = {};
    try { body = await req.json(); } catch (_) { /* sin cuerpo */ }

    const tipo = body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
    const id = body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");
    if (tipo !== "payment" || !id) return new Response("ignorado", { status: 200 });

    // No confiamos en el aviso: consultamos el pago directo a Mercado Pago
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}` },
    });
    if (!r.ok) return new Response("pago no encontrado", { status: 500 }); // Mercado Pago reintenta
    const pago = await r.json();
    if (pago.status !== "approved") return new Response("no aprobado", { status: 200 });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: fila } = await admin
      .from("payments")
      .select("id, amount")
      .eq("id", pago.external_reference)
      .maybeSingle();
    if (!fila) return new Response("sin referencia", { status: 200 });

    if (Number(pago.transaction_amount) < Number(fila.amount)) {
      console.error("Monto menor al esperado", pago.transaction_amount, fila.amount);
      return new Response("monto no coincide", { status: 200 });
    }

    const { error } = await admin.rpc("activar_suscripcion", {
      p_payment_id: fila.id,
      p_mp_payment_id: String(id),
    });
    if (error) {
      console.error(error);
      return new Response("error", { status: 500 });
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("error", { status: 500 });
  }
});