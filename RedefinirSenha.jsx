import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import PulseLine from "./PulseLine";

export default function RedefinirSenha() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function handleSalvar(e) {
    e.preventDefault();
    setErro("");

    if (novaSenha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setCarregando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    await supabase.auth.signOut();
    navigate("/login", { state: { senhaRedefinida: true } });
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <PulseLine />
        <p className="eyebrow">A Pulso</p>
        <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>Redefinir senha</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginTop: 6, marginBottom: 24 }}>
          Escolha uma nova senha para sua conta.
        </p>

        {erro && <div className="error-msg">{erro}</div>}

        <form onSubmit={handleSalvar}>
          <div className="field">
            <label htmlFor="novaSenha">Nova senha</label>
            <input
              id="novaSenha"
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="confirmarSenha">Confirmar nova senha</label>
            <input
              id="confirmarSenha"
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} disabled={carregando}>
            {carregando ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
