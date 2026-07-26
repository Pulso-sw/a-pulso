import { useEffect, useState } from "react";
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

function IconeUsuario() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

function IconeCadeado() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function IconeOlho({ aberto }) {
  return aberto ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
      <path d="M9.9 4.24A9.9 9.9 0 0 1 12 4c6 0 10 7 10 7a17.9 17.9 0 0 1-3.4 4.3M6.6 6.6C4 8.3 2 11 2 11s4 7 10 7c1.1 0 2.1-.2 3-.5" />
    </svg>
  );
}

export default function Login() {
  const [modo, setModo] = useState("entrar"); // "entrar" | "cadastrar" | "recuperar"
  const [email, setEmail] = useState(() => localStorage.getItem("a-pulso-email") || "");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("funcionario");
  const [categoria, setCategoria] = useState("clt");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [manterConectado, setManterConectado] = useState(() => !!localStorage.getItem("a-pulso-email"));

  useEffect(() => {
    setErro("");
    setSucesso("");
  }, [modo]);

  function traduzErro(msg) {
    if (msg.includes("Invalid login")) return "E-mail ou senha inválidos.";
    if (msg.includes("already registered")) return "Esse e-mail já tem cadastro. Tente entrar.";
    return msg;
  }

  async function handleEntrar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    if (manterConectado) localStorage.setItem("a-pulso-email", email);
    else localStorage.removeItem("a-pulso-email");

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

  async function handleRecuperar(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setCarregando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    });
    if (error) setErro(traduzErro(error.message));
    else setSucesso("Enviamos um link de recuperação para o seu e-mail.");
    setCarregando(false);
  }

  const titulos = {
    entrar: "Entrar",
    cadastrar: "Criar conta",
    recuperar: "Recuperar senha"
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <PulseLine />
        <p className="eyebrow">A Pulso</p>
        <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>{titulos[modo]}</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginTop: 6, marginBottom: 24 }}>
          {modo === "recuperar" ? "Informe seu e-mail cadastrado." : "Ponto simples pra empresas que estão crescendo."}
        </p>

        {erro && <div className="error-msg">{erro}</div>}
        {sucesso && <div className="success-msg">{sucesso}</div>}

        {modo === "recuperar" ? (
          <form onSubmit={handleRecuperar}>
            <div className="field field-icon">
              <label htmlFor="email">E-mail</label>
              <IconeUsuario />
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} disabled={carregando}>
              {carregando ? "Enviando..." : "Enviar link de recuperação"}
            </button>
            <p className="hint">
              <button type="button" className="link-btn" onClick={() => setModo("entrar")}>
                Voltar para o login
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={modo === "entrar" ? handleEntrar : handleCadastrar}>
            {modo === "cadastrar" && (
              <div className="field field-icon">
                <label htmlFor="nome">Seu nome</label>
                <IconeUsuario />
                <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
            )}

            <div className="field field-icon">
              <label htmlFor="email">E-mail</label>
              <IconeUsuario />
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="field field-icon">
              <label htmlFor="senha">Senha</label>
              <IconeCadeado />
              <input
                id="senha"
                type={senhaVisivel ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={6}
                required
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setSenhaVisivel((v) => !v)}
                aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
              >
                <IconeOlho aberto={senhaVisivel} />
              </button>
            </div>

            {modo === "entrar" && (
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={manterConectado}
                  onChange={(e) => setManterConectado(e.target.checked)}
                />
                Manter conectado
              </label>
            )}

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

            {modo === "entrar" && (
              <p className="hint">
                <button type="button" className="link-btn" onClick={() => setModo("recuperar")}>
                  Esqueceu a senha?
                </button>
              </p>
            )}
          </form>
        )}

        {modo !== "recuperar" && (
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
        )}
      </div>
    </div>
  );
}
