import { Link } from "react-router-dom";

const ATALHOS = [
  {
    caminho: "/equipe/visao-equipe",
    titulo: "Visão da Equipe",
    descricao: "Acompanhe os registros de ponto e o status de cada colaborador em tempo real.",
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/>
        <circle cx="17" cy="8" r="2.5"/><path d="M17 12.2c2.8.4 5 2.6 5 5.3"/>
      </svg>
    ),
  },
  {
    caminho: "/equipe/colaboradores",
    titulo: "Colaboradores",
    descricao: "Visualize e gerencie os dados de todos os colaboradores da empresa.",
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="9" r="3.5"/><circle cx="16" cy="9" r="3.5"/>
        <path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M12 20c0-3.3 2.7-6 6-6"/>
      </svg>
    ),
  },
  {
    caminho: "/equipe/empresa",
    titulo: "Empresas e Filiais",
    descricao: "Configure as empresas e filiais que utilizam o sistema de controle de ponto.",
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="10" height="18"/><rect x="14" y="8" width="6" height="13"/>
        <path d="M7 7h1M7 11h1M7 15h1M10 7h1M10 11h1M10 15h1"/>
      </svg>
    ),
  },
  {
    caminho: "/equipe/solicitacoes",
    titulo: "Solicitações",
    descricao: "Revise e responda às solicitações de ajuste e abono enviadas pela equipe.",
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v13H7l-3 3z"/><path d="M8 9h8M8 13h5"/>
      </svg>
    ),
  },
  {
    caminho: "/equipe/funcionarios",
    titulo: "Cadastro de Funcionários",
    descricao: "Cadastre e atualize os dados dos funcionários da organização.",
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
      </svg>
    ),
  },
  {
    caminho: "/equipe/escalas",
    titulo: "Escalas de Horário",
    descricao: "Defina e administre as escalas e horários de trabalho da sua equipe.",
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
      </svg>
    ),
  },
];

export default function BoasVindas() {
  return (
    <div className="bv-root">

      {/* ── Hero — mantido integralmente ── */}
     <div className="admin-hero">
        <div className="admin-hero-overlay" />
        <div className="admin-hero-content">
          <p className="admin-eyebrow">Painel administrativo</p>
          <div className="admin-hero-titulo-linha">
            <h1 className="admin-titulo" style={{ marginBottom: 0 }}>
              Bem-vindo ao Pulso da sua empresa
            </h1>
            <div className="hero-ecg-wrap">
              <div className="hero-ecg-track">
                <svg className="hero-ecg-svg" viewBox="0 0 220 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0,30 L75,30 L86,22 L97,42 L108,8 L119,32 L130,30 L220,30" fill="none" stroke="var(--pulso)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <svg className="hero-ecg-svg" viewBox="0 0 220 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0,30 L75,30 L86,22 L97,42 L108,8 L119,32 L130,30 L220,30" fill="none" stroke="var(--pulso)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
          <p className="admin-hero-subtitulo" style={{ marginTop: 16 }}>
            Controle o ritmo da sua empresa com informações claras, processos simples e gestão inteligente.
          </p>
        </div>
      </div>

      {/* ── Corpo modernizado ── */}
      <div className="bv-corpo">

        <div className="bv-secao">
          <div className="bv-secao-header">
            <h2 className="bv-secao-titulo">Acesso rápido</h2>
            <p className="bv-secao-sub">Navegue pelas principais seções do painel administrativo.</p>
          </div>
          <div className="bv-grid">
            {ATALHOS.map((item) => (
              <Link key={item.caminho} to={item.caminho} className="bv-card">
                <div className="bv-card-topo">
                  <span className="bv-card-icone">{item.icone}</span>
                  <svg className="bv-card-seta" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
                <p className="bv-card-titulo">{item.titulo}</p>
                <p className="bv-card-desc">{item.descricao}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="bv-rodape">
          <span className="bv-dot-pulso" />
          <span className="bv-rodape-texto">Pulso — Sistema de gestão de ponto</span>
        </div>

      </div>
    </div>
  );
}
