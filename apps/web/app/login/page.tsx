"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleLogin() {
    setMensaje("");
    if (!email || !password) {
      setMensaje("Escribe tu correo y contraseña.");
      return;
    }
    setCargando(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setCargando(false);
    if (error) {
      setMensaje(`Error: ${error.message}`);
    } else {
      router.push("/cuenta");
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: "40px auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Iniciar sesión</h1>

      <input placeholder="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

      <button onClick={handleLogin} disabled={cargando}>
        {cargando ? "Entrando..." : "Entrar"}
      </button>

      {mensaje && <p>{mensaje}</p>}

      <a href="/registro">¿No tienes cuenta? Regístrate</a>
    </main>
  );
}
