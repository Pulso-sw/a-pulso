export default function BoasVindas() {
  return (
    <div>
      <p className="admin-eyebrow">Painel Administrativo</p>
      <h1 className="admin-titulo">Bem-vindo à A Pulso</h1>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center", padding: "40px 0" }}>
        <svg width="220" height="70" viewBox="0 0 200 60" fill="none" stroke="var(--admin-dourado)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M0 30 H60 L75 5 L95 55 L110 30 H140 L150 15 L160 45 L170 30 H200" />
        </svg>
        <p style={{ color: "var(--admin-texto-soft)" }}>Use o menu acima para navegar entre as áreas do sistema.</p>
      </div>
    </div>
  );
}
