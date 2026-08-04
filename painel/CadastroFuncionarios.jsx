import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { supabase } from "../supabaseClient";

function formatarCpf(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);
  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

function formatarPis(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);
  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{5})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{2})(\d{1})$/, ".$1-$2");
}

export default function CadastroFuncionarios() {
  const { perfil } = useOutletContext();

  const [empresa, setEmpresa] = useState(null);
  const [carregandoEmpresa, setCarregandoEmpresa] = useState(true);

  const [funcionarios, setFuncionarios] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(true);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [pis, setPis] = useState("");
  const [dataAdmissao, setDataAdmissao] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [enviarComprovante, setEnviarComprovante] = useState(false);
  const [canalComprovante, setCanalComprovante] = useState("email");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    async function carregarEmpresa() {
      if (!perfil.empresa_id) {
        setCarregandoEmpresa(false);
        return;
      }
      const { data } = await supabase
        .from("empresas")
        .select("id, nome, cnpj")
        .eq("id", perfil.empresa_id)
        .maybeSingle();
      setEmpresa(data);
      setCarregandoEmpresa(false);
    }
    carregarEmpresa();
  }, [perfil.empresa_id]);

  async function carregarFuncionarios(empresaId) {
    setCarregandoLista(true);
    const { data } = await supabase
      .from("funcionarios")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("criado_em", { ascending: false });
    setFuncionarios(data || []);
    setCarregandoLista(false);
  }

  useEffect(() => {
    if (empresa) carregarFuncionarios(empresa.id);
  }, [empresa]);

  async function handleSalvar(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);

    const { error } = await supabase.from("funcionarios").insert({
      empresa_id: empresa.id,
      nome,
      cpf,
      rg: rg || null,
      pis: pis || null,
      data_admissao: dataAdmissao,
      email: email || null,
      telefone: telefone || null,
      enviar_comprovante: enviarComprovante,
      canal_comprovante: enviarComprovante ? canalComprovante : null,
      criado_por: perfil.id
    });

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    setSucesso("Funcionário cadastrado com sucesso.");
    setNome("");
    setCpf("");
    setRg("");
    setPis("");
    setDataAdmissao("");
    setEmail("");
    setTelefone("");
    setEnviarComprovante(false);
    setCanalComprovante("email");
    setSalvando(false);
    await carregarFuncionarios(empresa.id);
  }

  if (carregandoEmpresa) {
    return <p style={{ color: "var(--admin-texto-soft)" }}>Carregando...</p>;
  }

  if (!perfil.empresa_id || !empresa) {
    return (
      <div>
        <p className="admin-eyebrow">Cadastro de funcionários</p>
        <h1 className="admin-titulo">Cadastro de funcionários</h1>
        <div className="painel-azul">
          <p style={{ color: "var(--admin-texto)" }}>
            Você ainda não está vinculado a uma empresa. Cadastre sua empresa primeiro para poder cadastrar funcionários.
          </p>
          <Link to="/equipe/empresa" className="btn btn-dourado" style={{ marginTop: 16, display: "inline-flex" }}>
            Ir para Cadastro de Empresas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="admin-eyebrow">Cadastro de funcionários</p>
      <h1 className="admin-titulo">Cadastro de funcionários</h1>

      <div className="painel-azul" style={{ marginBottom: 24 }}>
        {erro && <div className="error-msg">{erro}</div>}
        {sucesso && <div className="success-msg">{sucesso}</div>}

        <form onSubmit={handleSalvar}>
          <div className="field">
            <label htmlFor="empresaVinculada">Empresa</label>
            <input id="empresaVinculada" value={`${empresa.nome} — ${empresa.cnpj}`} disabled />
          </div>

          <div className="field">
            <label htmlFor="nome">Nome do colaborador</label>
            <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="cpf">CPF</label>
              <input
                id="cpf"
                value={cpf}
                onChange={(e) => setCpf(formatarCpf(e.target.value))}
                placeholder="000.000.000-00"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="rg">RG</label>
              <input id="rg" value={rg} onChange={(e) => setRg(e.target.value)} placeholder="00.000.000-0" />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="pis">PIS/PASEP</label>
              <input
                id="pis"
                value={pis}
                onChange={(e) => setPis(formatarPis(e.target.value))}
                placeholder="000.00000.00-0"
              />
            </div>
            <div className="field">
              <label htmlFor="dataAdmissao">Data de admissão</label>
              <input
                id="dataAdmissao"
                type="date"
                value={dataAdmissao}
                onChange={(e) => setDataAdmissao(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="telefone">Telefone</label>
              <input
                id="telefone"
                type="tel"
                placeholder="(41) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={enviarComprovante}
              onChange={(e) => setEnviarComprovante(e.target.checked)}
            />
            Enviar comprovante da batida de ponto
          </label>

          {enviarComprovante && (
            <div className="field" style={{ maxWidth: 260 }}>
              <label htmlFor="canalComprovante">Enviar por</label>
              <select
                id="canalComprovante"
                value={canalComprovante}
                onChange={(e) => setCanalComprovante(e.target.value)}
              >
                <option value="email">E-mail</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          )}

          <button className="btn btn-dourado" disabled={salvando}>
            {salvando ? "Salvando..." : "Cadastrar funcionário"}
          </button>
        </form>
      </div>

      <h2 style={{ fontSize: "1.1rem", color: "var(--admin-dourado)", margin: "32px 0 12px" }}>
        Funcionários cadastrados
      </h2>

      {carregandoLista ? (
        <p style={{ color: "var(--admin-texto-soft)" }}>Carregando...</p>
      ) : funcionarios.length === 0 ? (
        <p style={{ color: "var(--admin-texto-soft)" }}>Nenhum funcionário cadastrado ainda.</p>
      ) : (
        <div className="admin-card-lista">
          {funcionarios.map((f) => (
            <div className="linha" key={f.id}>
              <span>
                {f.nome}
                <small>
                  CPF {f.cpf} · Admissão em {new Date(f.data_admissao + "T00:00:00").toLocaleDateString("pt-BR")}
                </small>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
