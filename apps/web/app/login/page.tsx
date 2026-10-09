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
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <p className="text-4xl font-bold text-primary">Oficios</p>
        <p className="mt-1 text-muted">Encuentra al profesional que necesitas</p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm">
        <h1>Iniciar sesión</h1>

        <input
          placeholder="Correo"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {mensaje && (
          <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-danger">{mensaje}</p>
        )}

        <button onClick={handleLogin} disabled={cargando} className="w-full">
          {cargando ? "Entrando..." : "Entrar"}
        </button>
      </div>

      <a href="/registro" className="text-center">
        ¿No tienes cuenta? Regístrate
      </a>
    </main>
  );
}