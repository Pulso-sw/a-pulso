import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../supabaseClient";

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

  useEffect(() => {
    async function carregar() {
      const { data: empresaExistente } = await supabase
        .from("empresas")
        .select("*")
        .eq("criado_por", perfil.id)
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
  }, [perfil.id]);

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
    } else {
      const { data, error } = await supabase
        .from("empresas")
        .insert({ cnpj, nome, ramo_atividade: ramoAtividade, criado_por: perfil.id })
        .select()
        .maybeSingle();
      if (error) setErro(error.message);
      else { setEmpresa(data); setSucesso("Empresa cadastrada com sucesso."); }
    }
    setSalvando(false);
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

  async function handleRemoverFilial(id) {
    await supabase.from("filiais").delete().eq("id", id);
    setFiliais((atual) => atual.filter((f) => f.id !== id));
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

          <button className="btn btn-dourado" disabled={salvando}>
            {salvando ? "Salvando..." : empresa ? "Salvar alterações" : "Cadastrar empresa"}
          </button>
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
                  <button className="admin-remover" onClick={() => handleRemoverFilial(f.id)}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
