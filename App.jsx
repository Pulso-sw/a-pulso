import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Admin from "./Admin";
import PainelAdmin from "./painel/PainelAdmin";
import EmpresaFiliais from "./painel/EmpresaFiliais";
import EmConstrucao from "./painel/EmConstrucao";
import BoasVindas from "./painel/BoasVindas";
import Colaboradores from "./painel/Colaboradores";
import Solicitacoes from "./painel/Solicitacoes";
import RedefinirSenha from "./RedefinirSenha";

function useTema() {
  const [tema, setTema] = useState(() => localStorage.getItem("a-pulso-tema") || "claro");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema === "escuro" ? "dark" : "light");
    localStorage.setItem("a-pulso-tema", tema);
  }, [tema]);

  return [tema, setTema];
}

function Topbar({ onSair, tema, onAlternarTema }) {
  const location = useLocation();
  return (
    <div className="topbar">
      <Link to="/" className="brand"><span className="dot" /> A Pulso</Link>
      <nav style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div className="nav-tabs" style={{ marginBottom: 0 }}>
          <Link className={location.pathname === "/" ? "active" : ""} to="/">Meu ponto</Link>
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

    async function carregarOuCriarPerfil() {
      const { data: perfilExistente } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", sessao.user.id)
        .maybeSingle();

      if (perfilExistente) {
        setPerfil(perfilExistente);
        return;
      }

      // não tem perfil ainda: se a pessoa confirmou clicando no link do e-mail
      // (em vez de digitar o código), os dados do cadastro ficaram salvos aqui
      const metadados = sessao.user.user_metadata;
      if (metadados?.nome) {
        const { data: perfilCriado } = await supabase
          .from("perfis")
          .insert({
            id: sessao.user.id,
            nome: metadados.nome,
            telefone: metadados.telefone,
            cargo: metadados.cargo,
            categoria: metadados.categoria
          })
          .select()
          .maybeSingle();
        setPerfil(perfilCriado);
      }
    }

    carregarOuCriarPerfil();
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
      {sessao && perfil && !podeVerEquipe && (
        <Topbar onSair={handleSair} tema={tema} onAlternarTema={alternarTema} />
      )}
      <Routes>
        <Route path="/login" element={sessao ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />

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
            ) : !perfil ? (
              <div className="page">Preparando seu perfil...</div>
            ) : !podeVerEquipe ? (
              <Navigate to="/" replace />
            ) : (
              <PainelAdmin perfil={perfil} onSair={handleSair} />
            )
          }
        >
          <Route index element={<BoasVindas />} />
          <Route path="visao-equipe" element={<Admin perfil={perfil} />} />
          <Route path="colaboradores" element={<Colaboradores perfil={perfil} />} />
          <Route path="empresa" element={<EmpresaFiliais />} />
          <Route path="funcionarios" element={<EmConstrucao titulo="Cadastro funcionário" />} />
          <Route path="escalas" element={<EmConstrucao titulo="Cadastro escala de horário" />} />
          <Route path="solicitacoes" element={<Solicitacoes perfil={perfil} />} />
        </Route>
      </Routes>
    </div>
  );
}
