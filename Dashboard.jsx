import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const TIPOS_SOLICITACAO = [
  { valor: "ajuste", label: "Ajuste de horário" },
  { valor: "abono", label: "Abono / Justificativa" },
  { valor: "folga", label: "Folga" },
  { valor: "outro", label: "Outro" }
];

const STATUS_LABEL = {
  pendente: { texto: "Pendente", cor: "off" },
  aprovado: { texto: "Aprovado", cor: "on" },
  rejeitado: { texto: "Rejeitado", cor: "off" }
};

function formatarMin(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, "0")}min`;
}

function calcularHoras(registros) {
  let totalMs = 0;
  let entradaAberta = null;
  for (const r of registros) {
    if (r.tipo === "entrada") entradaAberta = new Date(r.criado_em);
    else if (r.tipo === "saida" && entradaAberta) {
      totalMs += new Date(r.criado_em) - entradaAberta;
      entradaAberta = null;
    }
  }
  return { totalMin: Math.round(totalMs / 60000), ativo: entradaAberta !== null };
}

export default function Dashboard({ perfil, usuarioId }) {
  const [registros, setRegistros] = useState([]);
  const [relogio, setRelogio] = useState(new Date());
  const [carregando, setCarregando] = useState(true);
  const [batendo, setBatendo] = useState(false);
  const [erro, setErro] = useState("");

  const [solicitacoes, setSolicitacoes] = useState([]);
  const [tipoSolic, setTipoSolic] = useState("ajuste");
  const [descricaoSolic, setDescricaoSolic] = useState("");
  const [dataSolic, setDataSolic] = useState(() => new Date().toISOString().slice(0, 10));
  const [enviandoSolic, setEnviandoSolic] = useState(false);

  async function carregar() {
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("registros_ponto")
      .select("*")
      .eq("usuario_id", usuarioId)
      .gte("criado_em", inicioHoje.toISOString())
      .order("criado_em", { ascending: true });

    if (error) setErro(error.message);
    else setRegistros(data);
    setCarregando(false);
  }

  async function carregarSolicitacoes() {
    const { data, error } = await supabase
      .from("solicitacoes")
      .select("*")
      .eq("usuario_id", usuarioId)
      .order("criado_em", { ascending: false });
    if (!error) setSolicitacoes(data);
  }

  useEffect(() => {
    carregar();
    carregarSolicitacoes();
    const t = setInterval(() => setRelogio(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { totalMin, ativo } = calcularHoras(registros);
  const proximaAcao = registros.length && registros[registros.length - 1].tipo === "entrada" ? "saida" : "entrada";

  async function bater() {
    setBatendo(true);
    setErro("");
    const { error } = await supabase
      .from("registros_ponto")
      .insert({ usuario_id: usuarioId, tipo: proximaAcao });
    if (error) setErro(error.message);
    else await carregar();
    setBatendo(false);
  }

  async function enviarSolicitacao(e) {
    e.preventDefault();
    if (!descricaoSolic.trim()) return;
    setEnviandoSolic(true);
    const { error } = await supabase.from("solicitacoes").insert({
      usuario_id: usuarioId,
      tipo: tipoSolic,
      descricao: descricaoSolic,
      data_referencia: dataSolic
    });
    if (!error) {
      setDescricaoSolic("");
      await carregarSolicitacoes();
    }
    setEnviandoSolic(false);
  }

  if (carregando) return <div className="page">Carregando...</div>;

  return (
    <div className="page">
      <p className="eyebrow">Olá, {perfil?.nome?.split(" ")[0]}</p>
      <h1 style={{ fontSize: "1.6rem", marginBottom: 24 }}>Seu ponto de hoje</h1>

      {erro && <div className="error-msg">{erro}</div>}

      <div className="card punch-card">
        <div className="punch-clock">
          {relogio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
        <span className={`status-pill ${ativo ? "on" : "off"}`}>
          <span className="dot" />
          {ativo ? "Trabalhando agora" : "Fora do expediente"}
        </span>
        <button className="btn btn-pulso" style={{ padding: "16px 32px", fontSize: "1rem" }} onClick={bater} disabled={batendo}>
          {batendo ? "Registrando..." : proximaAcao === "entrada" ? "Registrar entrada" : "Registrar saída"}
        </button>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>
          Horas trabalhadas hoje: <strong>{formatarMin(totalMin)}</strong>
        </p>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 16 }}>Registros de hoje</h3>
        {registros.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>Nenhum registro ainda.</p>
        ) : (
          <table>
            <thead><tr><th>Tipo</th><th>Horário</th></tr></thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id}>
                  <td>{r.tipo === "entrada" ? "Entrada" : "Saída"}</td>
                  <td>{new Date(r.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 16 }}>Minhas solicitações</h3>

        <form onSubmit={enviarSolicitacao} style={{ marginBottom: 20 }}>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="tipoSolic">Tipo</label>
              <select
                id="tipoSolic"
                value={tipoSolic}
                onChange={(e) => setTipoSolic(e.target.value)}
                style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)", fontSize: "0.95rem" }}
              >
                {TIPOS_SOLICITACAO.map((t) => (
                  <option key={t.valor} value={t.valor}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="dataSolic">Data de referência</label>
              <input id="dataSolic" type="date" value={dataSolic} onChange={(e) => setDataSolic(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="descricaoSolic">Descrição</label>
            <input
              id="descricaoSolic"
              placeholder="Ex: esqueci de bater o ponto às 8h"
              value={descricaoSolic}
              onChange={(e) => setDescricaoSolic(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary" disabled={enviandoSolic}>
            {enviandoSolic ? "Enviando..." : "Enviar solicitação"}
          </button>
        </form>

        {solicitacoes.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>Nenhuma solicitação enviada ainda.</p>
        ) : (
          <table>
            <thead><tr><th>Tipo</th><th>Descrição</th><th>Data ref.</th><th>Status</th></tr></thead>
            <tbody>
              {solicitacoes.map((s) => (
                <tr key={s.id}>
                  <td>{TIPOS_SOLICITACAO.find((t) => t.valor === s.tipo)?.label || s.tipo}</td>
                  <td>{s.descricao}</td>
                  <td>{new Date(s.data_referencia).toLocaleDateString("pt-BR")}</td>
                  <td>
                    <span className={`status-pill ${STATUS_LABEL[s.status].cor}`}>
                      <span className="dot" />{STATUS_LABEL[s.status].texto}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
