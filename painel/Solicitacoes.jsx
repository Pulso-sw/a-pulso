import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const TIPO_SOLIC_LABEL = {
  ajuste: "Ajuste de horário",
  abono: "Abono / Justificativa",
  folga: "Folga",
  outro: "Outro"
};

export default function Solicitacoes({ perfil }) {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(null);

  async function carregarTudo() {
    const { data: perfis, error: erroPerfis } = await supabase.from("perfis").select("id, nome");
    if (!erroPerfis) setColaboradores(perfis);

    const { data: solics, error: erroSolics } = await supabase
      .from("solicitacoes")
      .select("*")
      .order("criado_em", { ascending: false });
    if (erroSolics) setErro(erroSolics.message);
    else setSolicitacoes(solics);

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

  if (carregando) return <div className="page">Carregando...</div>;

  const pendentes = solicitacoes.filter((s) => s.status === "pendente");

  function nomeDoUsuario(usuarioId) {
    return colaboradores.find((c) => c.id === usuarioId)?.nome || "—";
  }

  return (
    <div className="page">
      <p className="eyebrow">Equipe</p>
      <h1 style={{ fontSize: "1.6rem", marginBottom: 24 }}>Solicitações</h1>

      {erro && <div className="error-msg">{erro}</div>}

      <div className="card">
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
    </div>
  );
}
