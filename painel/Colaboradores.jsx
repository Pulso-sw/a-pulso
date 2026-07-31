import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

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

export default function Colaboradores({ perfil }) {
  const [colaboradores, setColaboradores] = useState([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);

  const [ajusteUsuario, setAjusteUsuario] = useState("");
  const [ajusteTipo, setAjusteTipo] = useState("entrada");
  const [ajusteDataHora, setAjusteDataHora] = useState("");
  const [enviandoAjuste, setEnviandoAjuste] = useState(false);

  const ehRh = perfil?.cargo === "rh";

  async function carregarColaboradores() {
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
    setCarregando(false);
  }

  useEffect(() => { carregarColaboradores(); }, []);

  async function handleAlterarStatus(colaboradorId, novoStatus) {
    setErro("");
    setSucesso("");
    const { error } = await supabase.from("perfis").update({ status: novoStatus }).eq("id", colaboradorId);
    if (error) {
      setErro("Não foi possível atualizar o status. Tente novamente.");
      return;
    }
    setColaboradores((atual) =>
      atual.map((c) => (c.id === colaboradorId ? { ...c, status: novoStatus } : c))
    );
    setSucesso("Status atualizado.");
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
    else { setAjusteDataHora(""); await carregarColaboradores(); }
    setEnviandoAjuste(false);
  }

  if (carregando) return <div className="page">Carregando...</div>;

  return (
    <div className="page">
      <p className="eyebrow">Equipe</p>
      <h1 style={{ fontSize: "1.6rem", marginBottom: 24 }}>Colaboradores</h1>

      {erro && <div className="error-msg">{erro}</div>}
      {sucesso && <div className="success-msg">{sucesso}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 16 }}>Colaboradores</h3>
        <table>
          <thead>
            <tr>
              <th>Nome</th><th>Perfil</th><th>Categoria</th><th>Horas na semana</th><th>Status</th><th>Situação</th>
            </tr>
          </thead>
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
                <td>
                  <select
                    value={c.status || "ativo"}
                    onChange={(e) => handleAlterarStatus(c.id, e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--line)", fontSize: "0.82rem" }}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="afastado">Afastado</option>
                    <option value="desligado">Desligado</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
