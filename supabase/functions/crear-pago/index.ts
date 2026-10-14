import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { plan_id } = await req.json();
    const url = Deno.env.get("SUPABASE_URL")!;

    // Quién es el usuario, según su sesión
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Inicia sesión para contratar un plan." }, 401);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: filas, error } = await admin.rpc("crear_pago_pendiente", {
      p_user_id: user.id,
      p_plan_id: plan_id,
    });
    if (error) return json({ error: error.message }, 400);

    const fila = filas?.[0];
    if (!fila) return json({ error: "No se pudo crear el pago." }, 500);

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: `Plan ${fila.plan_nombre} (30 días)`,
            quantity: 1,
            unit_price: Number(fila.monto),
            currency_id: Deno.env.get("MP_CURRENCY") ?? "MXN",
          },
        ],
        external_reference: fila.payment_id,
        notification_url: `${url}/functions/v1/webhook-mp`,
      }),
    });

    const pref = await res.json();
    if (!res.ok) {
      console.error(pref);
      return json({ error: "No se pudo crear el cobro en Mercado Pago." }, 502);
    }

    return json({ url: pref.init_point });
  } catch (e) {
    console.error(e);
    return json({ error: "Error interno." }, 500);
  }
});