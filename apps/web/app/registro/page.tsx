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

  return (
    <main style={{ maxWidth: 400, margin: "40px auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Crear cuenta</h1>

      <label>Soy:</label>
      <select value={role} onChange={(e) => setRole(e.target.value as "client" | "professional")}>
        <option value="client">Cliente (busco un servicio)</option>
        <option value="professional">Profesional (ofrezco un oficio)</option>
      </select>

      <input placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <input placeholder="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Contraseña (mín. 6 caracteres)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

      <button onClick={handleRegistro} disabled={cargando}>
        {cargando ? "Creando..." : "Registrarme"}
      </button>

      {mensaje && <p>{mensaje}</p>}
    </main>
  );
}
