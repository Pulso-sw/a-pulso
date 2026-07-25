import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Admin from "./Admin";

function Topbar({ perfil, onSair }) {
  const location = useLocation();
  return (
    <div className="topbar">
      <Link to="/" className="brand"><span className="dot" /> A Pulso</Link>
      <nav style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div className="nav-tabs" style={{ marginBottom: 0 }}>
          <Link className={location.pathname === "/" ? "active" : ""} to="/">Meu ponto</Link>
          {perfil?.cargo === "admin" && (
            <Link className={location.pathname === "/admin" ? "active" : ""} to="/admin">Equipe</Link>
          )}
        </div>
        <button className="btn btn-ghost" onClick={onSair}>Sair</button>
      </nav>
    </div>
  );
}

export default function App() {
  const [sessao, setSessao] = useState(undefined); // undefined = carregando
  const [perfil, setPerfil] = useState(null);
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

  return (
    <div className="app-shell">
      {sessao && perfil && <Topbar perfil={perfil} onSair={handleSair} />}
      <Routes>
        <Route path="/login" element={sessao ? <Navigate to="/" replace /> : <Login />} />
        <Route
          path="/"
          element={
            !sessao ? (
              <Navigate to="/login" replace />
            ) : !perfil ? (
              <div className="page">Preparando seu perfil...</div>
            ) : (
              <Dashboard perfil={perfil} usuarioId={sessao.user.id} />
            )
          }
        />
        <Route
          path="/admin"
          element={
            !sessao ? (
              <Navigate to="/login" replace />
            ) : perfil?.cargo !== "admin" ? (
              <Navigate to="/" replace />
            ) : (
              <Admin />
            )
          }
        />
      </Routes>
    </div>
  );
}
