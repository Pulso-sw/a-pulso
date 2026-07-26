import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import PulseLine from "./PulseLine";

const CARGO_LABEL = {
  administrador: "Administrador / Gestor",
  rh: "Recursos Humanos",
  funcionario: "Funcionário"
};

const CATEGORIA_LABEL = {
  estagiario: "Estagiário",
  menor_aprendiz: "Menor Aprendiz",
  trainee: "Trainee",
  clt: "CLT"
};

const TIPO_SOLIC_LABEL = {
  ajuste: "Ajuste de horário",
  abono: "Abono / Justificativa",
  folga: "Folga",
  outro: "Outro"
};

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
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(null);

  // Formulário de ajuste manual (só RH)
  const [ajusteUsuario, setAjusteUsuario] = useState("");
  const [ajusteTipo, setAjusteTipo] = useState("entrada");
  const [ajusteDataHora, setAjusteDataHora] = useState("");
  const [enviandoAjuste, setEnviandoAjuste] = useState(false);

  const ehRh = perfil?.cargo === "rh";

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
    if (!ajusteUsuario && lista.length) setAjusteUsuario(lista[0].id);

    const { data: solics, error: erroSolics } = await supabase
      .from("solicitacoes")
      .select("*")
      .order("criado_em", { ascending: false });
    if (!erroSolics) setSolicitacoes(solics);

    setCarregando(false);
  }

  useEffect(() => { carregarTudo(); }, []);

  async function resolverSolicitacao(id, novoStatus) {
    setProcessando(id);
    const { error } = await supabase
      .from("solicitacoes")
      .update({ status: novoStatus, resolvido_em: new Date().toISOString(), resolvido_por: perfil.id })
      .eq("id", id);
    if (!error) await carregarTudo();
    setProcessando(null);
  }

  async function registrarAjuste(e) {
    e.preventDefault();
    if (!ajusteUsuario || !ajusteDataHora) return;
    setEnviandoAjuste(true);
    const { error } = await supabase.from("registros_ponto").insert({
      usuario_id: ajusteUsuario,
      tipo: ajusteTipo,
      criado_em: new Date(ajusteDataHora).toISOString()
    });
    if (error) setErro(error.message);
    else { setAjusteDataHora(""); await carregarTudo(); }
    setEnviandoAjuste(false);
  }

  if (carregando) return <div className="page">Carregando...</div>;

  const totalGeral = colaboradores.reduce((acc, c) => acc + c.totalMin, 0);
  const ativos = colaboradores.filter((c) => c.ativo).length;
  const pendentes = solicitacoes.filter((s) => s.status === "pendente");

  function nomeDoUsuario(usuarioId) {
    return colaboradores.find((c) => c.id === usuarioId)?.nome || "—";
  }

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

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 16 }}>Colaboradores</h3>
        <table>
          <thead><tr><th>Nome</th><th>Perfil</th><th>Categoria</th><th>Horas na semana</th><th>Status</th></tr></thead>
          <tbody>
            {colaboradores.map((c) => (
              <tr key={c.id}>
                <td>{c.nome}</td>
                <td>{CARGO_LABEL[c.cargo] || c.cargo}</td>
                <td>{c.categoria ? CATEGORIA_LABEL[c.categoria] : "—"}</td>
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

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 16 }}>
          Solicitações pendentes {pendentes.length > 0 && `(${pendentes.length})`}
        </h3>
        {pendentes.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>Nenhuma solicitação pendente.</p>
        ) : (
          pendentes.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 0", borderBottom: "1px solid var(--line)", gap: 12
              }}
            >
              <div style={{ fontSize: "0.9rem" }}>
                <strong>{nomeDoUsuario(s.usuario_id)}</strong> — {TIPO_SOLIC_LABEL[s.tipo] || s.tipo}
                <div style={{ color: "var(--ink-soft)" }}>
                  {s.descricao} · ref. {new Date(s.data_referencia).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  className="btn btn-primary"
                  style={{ padding: "8px 14px", fontSize: "0.8rem" }}
                  disabled={processando === s.id}
                  onClick={() => resolverSolicitacao(s.id, "aprovado")}
                >
                  Aprovar
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ padding: "8px 14px", fontSize: "0.8rem" }}
                  disabled={processando === s.id}
                  onClick={() => resolverSolicitacao(s.id, "rejeitado")}
                >
                  Rejeitar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {ehRh && (
        <div className="card">
          <h3 style={{ fontSize: "1rem", marginBottom: 16 }}>Registrar ajuste de ponto</h3>
          <form onSubmit={registrarAjuste}>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="ajusteUsuario">Colaborador</label>
                <select
                  id="ajusteUsuario"
                  value={ajusteUsuario}
                  onChange={(e) => setAjusteUsuario(e.target.value)}
                  style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)", fontSize: "0.95rem" }}
                >
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="ajusteTipo">Tipo</label>
                <select
                  id="ajusteTipo"
                  value={ajusteTipo}
                  onChange={(e) => setAjusteTipo(e.target.value)}
                  style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)", fontSize: "0.95rem" }}
                >
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="ajusteDataHora">Data e hora</label>
              <input
                id="ajusteDataHora"
                type="datetime-local"
                value={ajusteDataHora}
                onChange={(e) => setAjusteDataHora(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" disabled={enviandoAjuste}>
              {enviandoAjuste ? "Registrando..." : "Registrar ajuste"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
