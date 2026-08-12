import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../supabaseClient";
import ConfirmarExclusao from "./ConfirmarExclusao";

const RAMOS_ATIVIDADE = [
  "Comércio",
  "Indústria",
  "Serviços",
  "Tecnologia",
  "Saúde",
  "Educação",
  "Construção Civil",
  "Alimentação",
  "Agronegócio",
  "Transporte e Logística",
  "Outro"
];

function formatarCnpj(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 14);
  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export default function EmpresaFiliais() {
  const { perfil } = useOutletContext();

  const [empresa, setEmpresa] = useState(null);
  const [cnpj, setCnpj] = useState("");
  const [nome, setNome] = useState("");
  const [ramoAtividade, setRamoAtividade] = useState(RAMOS_ATIVIDADE[0]);

  const [filiais, setFiliais] = useState([]);
  const [nomeFilial, setNomeFilial] = useState("");
  const [cnpjFilial, setCnpjFilial] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [excluirEmpresaAberto, setExcluirEmpresaAberto] = useState(false);
  const [excluindoEmpresa, setExcluindoEmpresa] = useState(false);
  const [filialParaExcluir, setFilialParaExcluir] = useState(null);
  const [excluindoFilial, setExcluindoFilial] = useState(false);

  useEffect(() => {
    async function carregar() {
      // A empresa é a que está vinculada ao MEU perfil (empresa_id),
      // não necessariamente a que eu criei — importante para funcionar
      // com múltiplos administradores/RH na mesma empresa.
      if (!perfil.empresa_id) {
        setCarregando(false);
        return;
      }

      const { data: empresaExistente } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", perfil.empresa_id)
        .maybeSingle();

      if (empresaExistente) {
        setEmpresa(empresaExistente);
        setCnpj(empresaExistente.cnpj);
        setNome(empresaExistente.nome);
        setRamoAtividade(empresaExistente.ramo_atividade);

        const { data: filiaisExistentes } = await supabase
          .from("filiais")
          .select("*")
          .eq("empresa_id", empresaExistente.id)
          .order("criado_em");
        setFiliais(filiaisExistentes || []);
      }
      setCarregando(false);
    }
    carregar();
  }, [perfil.empresa_id]);

  async function handleSalvarEmpresa(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);

    if (empresa) {
      const { data, error } = await supabase
        .from("empresas")
        .update({ cnpj, nome, ramo_atividade: ramoAtividade })
        .eq("id", empresa.id)
        .select()
        .maybeSingle();
      if (error) setErro(error.message);
      else { setEmpresa(data); setSucesso("Dados da empresa atualizados."); }
      setSalvando(false);
    } else {
      const { data, error } = await supabase
        .from("empresas")
        .insert({ cnpj, nome, ramo_atividade: ramoAtividade, criado_por: perfil.id })
        .select()
        .maybeSingle();
      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }

      setEmpresa(data);
      setSucesso("Empresa cadastrada com sucesso.");
      // vincula automaticamente quem criou a empresa a ela
      await supabase.from("perfis").update({ empresa_id: data.id }).eq("id", perfil.id);

      // recarrega a página pra o resto do sistema já reconhecer a empresa vinculada
      setTimeout(() => window.location.reload(), 1200);
    }
  }

  async function handleExcluirEmpresa() {
    setExcluindoEmpresa(true);
    setErro("");
    const { error } = await supabase.from("empresas").delete().eq("id", empresa.id);
    setExcluindoEmpresa(false);
    setExcluirEmpresaAberto(false);

    if (error) {
      if (error.code === "23503") {
        setErro("Não é possível excluir: existem colaboradores vinculados a esta empresa.");
      } else {
        setErro("Não foi possível excluir a empresa. Tente novamente.");
      }
      return;
    }

    setEmpresa(null);
    setCnpj("");
    setNome("");
    setRamoAtividade(RAMOS_ATIVIDADE[0]);
    setFiliais([]);
    setSucesso("Empresa excluída com sucesso.");
  }

  async function handleAdicionarFilial(e) {
    e.preventDefault();
    if (!empresa) return;
    setErro("");
    const { data, error } = await supabase
      .from("filiais")
      .insert({ empresa_id: empresa.id, nome: nomeFilial, cnpj: cnpjFilial || null })
      .select()
      .maybeSingle();
    if (error) { setErro(error.message); return; }
    setFiliais((atual) => [...atual, data]);
    setNomeFilial("");
    setCnpjFilial("");
  }

  async function handleConfirmarRemoverFilial() {
    if (!filialParaExcluir) return;
    setExcluindoFilial(true);
    const { error } = await supabase.from("filiais").delete().eq("id", filialParaExcluir.id);
    setExcluindoFilial(false);
    if (error) {
      setErro("Não foi possível remover a filial. Tente novamente.");
    } else {
      setFiliais((atual) => atual.filter((f) => f.id !== filialParaExcluir.id));
      setSucesso("Filial removida com sucesso.");
    }
    setFilialParaExcluir(null);
  }

  if (carregando) return <p style={{ color: "var(--admin-texto-soft)" }}>Carregando...</p>;

  return (
    <div>
      <p className="admin-eyebrow">Empresa</p>
      <h1 className="admin-titulo">Empresa e filiais</h1>

      <div className="painel-azul">
        {erro && <div className="error-msg">{erro}</div>}
        {sucesso && <div className="success-msg">{sucesso}</div>}

        <form onSubmit={handleSalvarEmpresa}>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="cnpj">CNPJ</label>
              <input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(formatarCnpj(e.target.value))}
                placeholder="00.000.000/0000-00"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="ramo">Ramo de atividade</label>
              <select id="ramo" value={ramoAtividade} onChange={(e) => setRamoAtividade(e.target.value)}>
                {RAMOS_ATIVIDADE.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="nomeEmpresa">Razão social / Nome da empresa</label>
            <input id="nomeEmpresa" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn btn-dourado" disabled={salvando}>
              {salvando ? "Salvando..." : empresa ? "Salvar alterações" : "Cadastrar empresa"}
            </button>

            {empresa && (
              <button
                type="button"
                className="admin-remover"
                onClick={() => setExcluirEmpresaAberto(true)}
              >
                Excluir empresa
              </button>
            )}
          </div>
        </form>
      </div>

      {empresa && (
        <>
          <h2 style={{ fontSize: "1.1rem", color: "var(--admin-texto)", margin: "32px 0 12px" }}>Filiais</h2>

          <div className="painel-azul">
            <form onSubmit={handleAdicionarFilial}>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="nomeFilial">Nome / Apelido da filial</label>
                  <input
                    id="nomeFilial"
                    value={nomeFilial}
                    onChange={(e) => setNomeFilial(e.target.value)}
                    placeholder="Ex: Filial Centro"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="cnpjFilial">CNPJ da filial (opcional)</label>
                  <input
                    id="cnpjFilial"
                    value={cnpjFilial}
                    onChange={(e) => setCnpjFilial(formatarCnpj(e.target.value))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
              <button className="btn btn-dourado">Adicionar filial</button>
            </form>
          </div>

          {filiais.length > 0 && (
            <div className="admin-card-lista">
              {filiais.map((f) => (
                <div className="linha" key={f.id}>
                  <span>
                    {f.nome}
                    {f.cnpj && <small>{f.cnpj}</small>}
                  </span>
                  <button className="admin-remover" onClick={() => setFilialParaExcluir(f)}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmarExclusao
        aberto={excluirEmpresaAberto}
        titulo="Excluir empresa"
        mensagem="Tem certeza que deseja excluir esta empresa? Esta ação não poderá ser desfeita."
        confirmando={excluindoEmpresa}
        onCancelar={() => setExcluirEmpresaAberto(false)}
        onConfirmar={handleExcluirEmpresa}
      />

      <ConfirmarExclusao
        aberto={!!filialParaExcluir}
        titulo="Remover filial"
        mensagem="Tem certeza que deseja remover esta filial? Esta ação não poderá ser desfeita."
        confirmando={excluindoFilial}
        onCancelar={() => setFilialParaExcluir(null)}
        onConfirmar={handleConfirmarRemoverFilial}
      />
    </div>
  );
}
