import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabaseClient";
import PulseLine from "./PulseLine";

function formatarMin(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, "0")}min`;
}

function calcularHoras(registros) {
  let totalMs = 0;
  let entradaAberta = null;
  const ordenados = [...registros].sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em));
  for (const r of ordenados) {
    if (r.tipo === "entrada") entradaAberta = new Date(r.criado_em);
    else if (r.tipo === "saida" && entradaAberta) {
      totalMs += new Date(r.criado_em) - entradaAberta;
      entradaAberta = null;
    }
  }
  return { totalMin: Math.round(totalMs / 60000), ativo: entradaAberta !== null };
}

export default function Equipe({ perfil }) {
  const [colaboradores, setColaboradores] = useState([]);
  const [totalPendentes, setTotalPendentes] = useState(0);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarTudo() {
      const inicioSemana = new Date();
      inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
      inicioSemana.setHours(0, 0, 0, 0);

      const { data: perfis, error: erroPerfis } = await supabase.from("perfis").select("*");
      if (erroPerfis) { setErro(erroPerfis.message); setCarregando(false); return; }

      const { data: registros, error: erroRegistros } = await supabase
        .from("registros_ponto")
        .select("*")
        .gte("criado_em", inicioSemana.toISOString());
      if (erroRegistros) { setErro(erroRegistros.message); setCarregando(false); return; }

      const lista = perfis.map((p) => {
        const regsDoUsuario = registros.filter((r) => r.usuario_id === p.id);
        const { totalMin, ativo } = calcularHoras(regsDoUsuario);
        return { ...p, totalMin, ativo };
      });
      setColaboradores(lista);

      const { count, error: erroSolics } = await supabase
        .from("solicitacoes")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente");
      if (!erroSolics) setTotalPendentes(count || 0);

      setCarregando(false);
    }

    carregarTudo();
  }, []);

  if (carregando) return <div className="page">Carregando...</div>;

  const totalGeral = colaboradores.reduce((acc, c) => acc + c.totalMin, 0);
  const ativos = colaboradores.filter((c) => c.ativo).length;

  return (
    <div className="page">
      <p className="eyebrow">Visão da equipe</p>
      <h1 style={{ fontSize: "1.6rem", marginBottom: 24 }}>Como sua empresa está pulsando</h1>

      {erro && <div className="error-msg">{erro}</div>}

      <div className="equipe-dashboard-grid">
        <div className="equipe-col-principal">
          <div className="card">
            <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginBottom: 6 }}>Horas na semana</p>
            <h2 style={{ fontSize: "2.4rem" }}>{formatarMin(totalGeral)}</h2>
            <div style={{ marginTop: 16 }}><PulseLine height={60} /></div>
          </div>
          <div className="card">
            <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginBottom: 6 }}>Trabalhando agora</p>
            <h2 style={{ fontSize: "2.4rem" }}>{ativos} / {colaboradores.length}</h2>
          </div>
        </div>

        <div className="equipe-col-lateral">
          <Link to="/equipe/colaboradores" className="card card-atalho">
            <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginBottom: 6 }}>Colaboradores</p>
            <h2 style={{ fontSize: "1.8rem" }}>{colaboradores.length}</h2>
            <p style={{ color: "var(--pulso)", fontSize: "0.8rem", marginTop: 8, fontWeight: 600 }}>Ver todos →</p>
          </Link>
          <Link to="/equipe/solicitacoes" className="card card-atalho">
            <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginBottom: 6 }}>Solicitações pendentes</p>
            <h2 style={{ fontSize: "1.8rem" }}>{totalPendentes}</h2>
            <p style={{ color: "var(--pulso)", fontSize: "0.8rem", marginTop: 8, fontWeight: 600 }}>Ver solicitações →</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
