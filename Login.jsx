import { useState } from "react";
import { supabase } from "./supabaseClient";
import PulseLine from "./PulseLine";

export default function Login() {
  const [modo, setModo] = useState("entrar"); // "entrar" | "cadastrar"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [ehAdmin, setEhAdmin] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleEntrar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro(traduzErro(error.message));
    setCarregando(false);
  }

  async function handleCadastrar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error) {
      setErro(traduzErro(error.message));
      setCarregando(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      const { error: erroPerfil } = await supabase
        .from("perfis")
        .insert({ id: userId, nome, cargo: ehAdmin ? "admin" : "colaborador" });
      if (erroPerfil) setErro(erroPerfil.message);
    }
    setCarregando(false);
  }

  function traduzErro(msg) {
    if (msg.includes("Invalid login")) return "E-mail ou senha inválidos.";
    if (msg.includes("already registered")) return "Esse e-mail já tem cadastro. Tente entrar.";
    return msg;
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <PulseLine />
        <p className="eyebrow">A Pulso</p>
        <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>
          {modo === "entrar" ? "Entrar" : "Criar conta"}
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginTop: 6, marginBottom: 24 }}>
          Ponto simples pra empresas que estão crescendo.
        </p>

        {erro && <div className="error-msg">{erro}</div>}

        <form onSubmit={modo === "entrar" ? handleEntrar : handleCadastrar}>
          {modo === "cadastrar" && (
            <div className="field">
              <label htmlFor="nome">Seu nome</label>
              <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {modo === "cadastrar" && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", marginBottom: 16, color: "var(--ink-soft)" }}>
              <input type="checkbox" checked={ehAdmin} onChange={(e) => setEhAdmin(e.target.checked)} />
              Sou administrador(a) — vou gerenciar a equipe
            </label>
          )}

          <button className="btn btn-primary" style={{ width: "100%" }} disabled={carregando}>
            {carregando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="hint">
          {modo === "entrar" ? "Ainda não tem conta? " : "Já tem conta? "}
          <button
            type="button"
            onClick={() => { setModo(modo === "entrar" ? "cadastrar" : "entrar"); setErro(""); }}
            style={{ background: "none", border: "none", color: "var(--pulso)", fontWeight: 600, cursor: "pointer", padding: 0 }}
          >
            {modo === "entrar" ? "Criar conta" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
}
