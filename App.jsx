import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Admin from "./Admin";

function useTema() {
  const [tema, setTema] = useState(() => localStorage.getItem("a-pulso-tema") || "claro");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema === "escuro" ? "dark" : "light");
    localStorage.setItem("a-pulso-tema", tema);
  }, [tema]);

  return [tema, setTema];
}

function Topbar({ perfil, onSair, tema, onAlternarTema }) {
  const location = useLocation();
  const podeVerEquipe = perfil?.cargo === "administrador" || perfil?.cargo === "rh";
  return (
    <div className="topbar">
      <Link to="/" className="brand"><span className="dot" /> A Pulso</Link>
      <nav style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div className="nav-tabs" style={{ marginBottom: 0 }}>
          <Link className={location.pathname === "/" ? "active" : ""} to="/">Meu ponto</Link>
          {podeVerEquipe && (
            <Link className={location.pathname === "/equipe" ? "active" : ""} to="/equipe">Equipe</Link>
          )}
        </div>
        <button
          className="theme-toggle"
          onClick={onAlternarTema}
          aria-label={tema === "escuro" ? "Mudar para tema claro" : "Mudar para tema escuro"}
          title={tema === "escuro" ? "Mudar para tema claro" : "Mudar para tema escuro"}
        >
          {tema === "escuro" ? "☀️" : "🌙"}
        </button>
        <button className="btn btn-ghost" onClick={onSair}>Sair</button>
      </nav>
    </div>
  );
}

export default function App() {
  const [sessao, setSessao] = useState(undefined); // undefined = carregando
  const [perfil, setPerfil] = useState(null);
  const [tema, setTema] = useTema();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
      if (!session) { setPerfil(null); navigate("/login"); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessao) return;
    supabase
      .from("perfis")
      .select("*")
      .eq("id", sessao.user.id)
      .maybeSingle()
      .then(({ data }) => setPerfil(data));
  }, [sessao]);

  if (sessao === undefined) return <div className="page">Carregando...</div>;

  async function handleSair() {
    await supabase.auth.signOut();
  }

  function alternarTema() {
    setTema((t) => (t === "escuro" ? "claro" : "escuro"));
  }

  const podeVerEquipe = perfil?.cargo === "administrador" || perfil?.cargo === "rh";

  return (
    <div className="app-shell">
      {sessao && perfil && (
        <Topbar perfil={perfil} onSair={handleSair} tema={tema} onAlternarTema={alternarTema} />
      )}
      <Routes>
        <Route path="/login" element={sessao ? <Navigate to="/" replace /> : <Login />} />
        <Route
          path="/"
          element={
            !sessao ? (
              <Navigate to="/login" replace />
            ) : !perfil ? (
              <div className="page">Preparando seu perfil...</div>
            ) : podeVerEquipe ? (
              <Navigate to="/equipe" replace />
            ) : (
              <Dashboard perfil={perfil} usuarioId={sessao.user.id} />
            )
          }
        />
        <Route
          path="/equipe"
          element={
            !sessao ? (
              <Navigate to="/login" replace />
            ) : !podeVerEquipe ? (
              <Navigate to="/" replace />
            ) : (
              <Admin perfil={perfil} />
            )
          }
        />
      </Routes>
    </div>
  );
}
