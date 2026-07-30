import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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

function IconeTelefone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2Z" />
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
  // "entrar" | "cadastrar" | "confirmar" | "recuperar"
  const [modo, setModo] = useState("entrar");
  const [email, setEmail] = useState(() => localStorage.getItem("a-pulso-email") || "");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cargo, setCargo] = useState("funcionario");
  const [categoria, setCategoria] = useState("clt");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [manterConectado, setManterConectado] = useState(() => !!localStorage.getItem("a-pulso-email"));

  // guarda os dados do cadastro enquanto aguarda a confirmação por e-mail
  const [dadosPendentes, setDadosPendentes] = useState(null);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.senhaRedefinida) {
      setSucesso("Senha redefinida com sucesso! Faça login com a nova senha.");
    }
  }, []);

  useEffect(() => {
    setErro("");
    setSucesso("");
  }, [modo]);

  function traduzErro(msg) {
    if (msg.includes("Invalid login")) return "E-mail ou senha inválidos.";
    if (msg.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar.";
    if (msg.includes("already registered")) return "Esse e-mail já tem cadastro. Tente entrar.";
    if (msg.includes("Token has expired") || msg.includes("expired")) return "Código expirado. Peça um novo.";
    if (msg.includes("Invalid token") || msg.includes("invalid")) return "Código inválido. Confira e tente de novo.";
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

    const { error } = await supabase.auth.signUp({ email, password: senha });
    if (error) {
      setErro(traduzErro(error.message));
      setCarregando(false);
      return;
    }

    // guarda os dados do perfil pra criar assim que o código for confirmado
    setDadosPendentes({ nome, telefone, cargo, categoria: cargo === "funcionario" ? categoria : null });
    setSucesso("");
    setModo("confirmar");
    setCarregando(false);
  }

  async function handleConfirmarCodigo(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const { data, error } = await supabase.auth.verifyOtp({ email, token: codigo, type: "signup" });
    if (error) {
      setErro(traduzErro(error.message));
      setCarregando(false);
      return;
    }

    const userId = data.user?.id;
    if (userId && dadosPendentes) {
      const { error: erroPerfil } = await supabase.from("perfis").insert({
        id: userId,
        nome: dadosPendentes.nome,
        telefone: dadosPendentes.telefone,
        cargo: dadosPendentes.cargo,
        categoria: dadosPendentes.categoria
      });
      if (erroPerfil) setErro(erroPerfil.message);
      // a partir daqui, um Database Webhook cuida de disparar o SMS de boas-vindas
    }
    setCarregando(false);
  }

  async function handleReenviarCodigo() {
    setErro("");
    setSucesso("");
    setCarregando(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) setErro(traduzErro(error.message));
    else setSucesso("Reenviamos o código para o seu e-mail.");
    setCarregando(false);
  }

  async function handleRecuperar(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setCarregando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`
    });
    if (error) setErro(traduzErro(error.message));
    else setSucesso("Enviamos um link de recuperação para o seu e-mail.");
    setCarregando(false);
  }

  const titulos = {
    entrar: "Entrar",
    cadastrar: "Criar conta",
    confirmar: "Confirme seu e-mail",
    recuperar: "Recuperar senha"
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <PulseLine />
        <p className="eyebrow">A Pulso</p>
        <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>{titulos[modo]}</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginTop: 6, marginBottom: 24 }}>
          {modo === "recuperar" && "Informe seu e-mail cadastrado."}
          {modo === "confirmar" && <>Enviamos um código de 6 dígitos para <strong>{email}</strong>.</>}
          {(modo === "entrar" || modo === "cadastrar") && "Ponto simples pra empresas que estão crescendo."}
        </p>

        {erro && <div className="error-msg">{erro}</div>}
        {sucesso && <div className="success-msg">{sucesso}</div>}

        {modo === "confirmar" && (
          <form onSubmit={handleConfirmarCodigo}>
            <div className="field">
              <label htmlFor="codigo">Código de confirmação</label>
              <input
                id="codigo"
                inputMode="numeric"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "1.3rem", letterSpacing: "0.3em" }}
                required
              />
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} disabled={carregando}>
              {carregando ? "Confirmando..." : "Confirmar e entrar"}
            </button>
            <p className="hint">
              Não recebeu?{" "}
              <button type="button" className="link-btn" onClick={handleReenviarCodigo} disabled={carregando}>
                Reenviar código
              </button>
            </p>
          </form>
        )}

        {modo === "recuperar" && (
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
        )}

        {(modo === "entrar" || modo === "cadastrar") && (
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

            {modo === "cadastrar" && (
              <div className="field field-icon">
                <label htmlFor="telefone">Celular (com DDD)</label>
                <IconeTelefone />
                <input
                  id="telefone"
                  type="tel"
                  placeholder="(41) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                />
              </div>
            )}

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

        {(modo === "entrar" || modo === "cadastrar") && (
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
