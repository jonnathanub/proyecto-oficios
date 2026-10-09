"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Registro() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client" | "professional">("client");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleRegistro() {
    setCargando(true);
    setMensaje("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });

    setCargando(false);
    setMensaje(error ? `Error: ${error.message}` : "¡Cuenta creada!");
  }

  const esError = mensaje.startsWith("Error");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <p className="text-4xl font-bold text-primary">Oficios</p>
        <p className="mt-1 text-muted">Crea tu cuenta</p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm">
        <h1>Crear cuenta</h1>

        <label className="text-sm text-muted">Soy:</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "client" | "professional")}
        >
          <option value="client">Cliente (busco un servicio)</option>
          <option value="professional">Profesional (ofrezco un oficio)</option>
        </select>

        <input
          placeholder="Nombre completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          placeholder="Correo"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Contraseña (mín. 6 caracteres)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {mensaje && (
          <p
            className={
              esError
                ? "rounded-lg bg-red-100 px-3 py-2 text-sm text-danger"
                : "rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-800"
            }
          >
            {mensaje}
          </p>
        )}

        <button onClick={handleRegistro} disabled={cargando} className="w-full">
          {cargando ? "Creando..." : "Registrarme"}
        </button>
      </div>

      <a href="/login" className="text-center">
        ¿Ya tienes cuenta? Inicia sesión
      </a>
    </main>
  );
}