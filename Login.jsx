import { useState } from "react";
import { supabase } from "./supabaseClient";
import PulseLine from "./PulseLine";

const PERFIS = [
  { valor: "administrador", label: "Administrador / Gestor", desc: "Visualização e aprovações" },
  { valor: "rh", label: "Recursos Humanos", desc: "Ajustes de horários e aprovações" },
  { valor: "funcionario", label: "Funcionário", desc: "Uso e solicitações" }
];

const CATEGORIAS = [
  { valor: "estagiario", label: "Estagiário" },
  { valor: "menor_aprendiz", label: "Menor Aprendiz" },
  { valor: "trainee", label: "Trainee" },
  { valor: "clt", label: "CLT" }
];

export default function Login() {
  const [modo, setModo] = useState("entrar"); // "entrar" | "cadastrar"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("funcionario");
  const [categoria, setCategoria] = useState("clt");
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
      const { error: erroPerfil } = await supabase.from("perfis").insert({
        id: userId,
        nome,
        cargo,
        categoria: cargo === "funcionario" ? categoria : null
      });
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
            <>
              <div className="field">
                <label>Qual é o seu perfil?</label>
                {PERFIS.map((p) => (
                  <label
                    key={p.valor}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.85rem",
                      padding: "10px 12px", marginBottom: 6, borderRadius: 10,
                      border: cargo === p.valor ? "1.5px solid var(--pulso)" : "1px solid var(--line)",
                      cursor: "pointer"
                    }}
                  >
                    <input
                      type="radio"
                      name="cargo"
                      value={p.valor}
                      checked={cargo === p.valor}
                      onChange={(e) => setCargo(e.target.value)}
                      style={{ marginTop: 3 }}
                    />
                    <span>
                      <strong>{p.label}</strong>
                      <div style={{ color: "var(--ink-soft)" }}>{p.desc}</div>
                    </span>
                  </label>
                ))}
              </div>

              {cargo === "funcionario" && (
                <div className="field">
                  <label htmlFor="categoria">Categoria</label>
                  <select
                    id="categoria"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)", fontSize: "0.95rem" }}
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c.valor} value={c.valor}>{c.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
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
