import { useEffect, useState } from "react";
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

export default function Admin() {
  const [colaboradores, setColaboradores] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
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
      setCarregando(false);
    }
    carregar();
  }, []);

  if (carregando) return <div className="page">Carregando...</div>;

  const totalGeral = colaboradores.reduce((acc, c) => acc + c.totalMin, 0);
  const ativos = colaboradores.filter((c) => c.ativo).length;

  return (
    <div className="page">
      <p className="eyebrow">Visão da equipe</p>
      <h1 style={{ fontSize: "1.6rem", marginBottom: 24 }}>Como sua empresa está pulsando</h1>

      {erro && <div className="error-msg">{erro}</div>}

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginBottom: 6 }}>Horas na semana</p>
          <h2 style={{ fontSize: "2rem" }}>{formatarMin(totalGeral)}</h2>
          <div style={{ marginTop: 12 }}><PulseLine height={40} /></div>
        </div>
        <div className="card">
          <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginBottom: 6 }}>Trabalhando agora</p>
          <h2 style={{ fontSize: "2rem" }}>{ativos} / {colaboradores.length}</h2>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: "1rem", marginBottom: 16 }}>Colaboradores</h3>
        <table>
          <thead><tr><th>Nome</th><th>Cargo</th><th>Horas na semana</th><th>Status</th></tr></thead>
          <tbody>
            {colaboradores.map((c) => (
              <tr key={c.id}>
                <td>{c.nome}</td>
                <td style={{ textTransform: "capitalize" }}>{c.cargo}</td>
                <td>{formatarMin(c.totalMin)}</td>
                <td>
                  <span className={`status-pill ${c.ativo ? "on" : "off"}`}>
                    <span className="dot" />{c.ativo ? "Ativo" : "Parado"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
