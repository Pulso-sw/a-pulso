import { Link, useLocation, Outlet } from "react-router-dom";

function IconePredio() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="10" height="18" />
      <rect x="14" y="8" width="6" height="13" />
      <path d="M7 7h1M7 11h1M7 15h1M10 7h1M10 11h1M10 15h1" />
    </svg>
  );
}

function IconePessoa() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

function IconeRelogio() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function IconeEquipe() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M17 12.2c2.8.4 5 2.6 5 5.3" />
    </svg>
  );
}

const ITENS_MENU = [
  { caminho: "/equipe", label: "Equipe", icone: IconeEquipe },
  { caminho: "/equipe/empresa", label: "Cadastro Empresa e filiais", icone: IconePredio },
  { caminho: "/equipe/funcionarios", label: "Cadastro funcionário", icone: IconePessoa },
  { caminho: "/equipe/escalas", label: "Cadastro escala de horário", icone: IconeRelogio }
];

export default function PainelAdmin({ perfil, onSair }) {
  const location = useLocation();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="brand"><span className="dot" /> A Pulso</Link>
        {ITENS_MENU.map((item) => {
          const Icone = item.icone;
          const ativo = location.pathname === item.caminho;
          return (
            <Link
              key={item.caminho}
              to={item.caminho}
              className={`admin-nav-item${ativo ? " active" : ""}`}
            >
              <Icone />
              {item.label}
            </Link>
          );
        })}
        <div className="admin-sidebar-footer">
          <button className="btn btn-ghost" style={{ width: "100%" }} onClick={onSair}>
            Sair
          </button>
        </div>
      </aside>
      <div className="admin-content">
        <Outlet context={{ perfil }} />
      </div>
    </div>
  );
}
