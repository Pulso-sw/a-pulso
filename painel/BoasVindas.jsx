export default function BoasVindas() {
  return (
    <div
      className="admin-hero"
      style={{ backgroundImage: "url(/Imagemdefundo.png)" }}
    >
      <div className="admin-hero-overlay" />
      <div className="admin-hero-content">
        <p className="admin-eyebrow">Painel administrativo</p>

        <div className="admin-hero-titulo-linha">
          <h1 className="admin-titulo" style={{ marginBottom: 0 }}>Bem-vindo ao Pulso da sua empresa</h1>
          <div className="hero-ecg-wrap">
            <div className="hero-ecg-track">
              <svg className="hero-ecg-svg" viewBox="0 0 220 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,30 L75,30 L86,22 L97,42 L108,8 L119,32 L130,30 L220,30" fill="none" stroke="var(--pulso)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg className="hero-ecg-svg" viewBox="0 0 220 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,30 L75,30 L86,22 L97,42 L108,8 L119,32 L130,30 L220,30" fill="none" stroke="var(--pulso)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        <p className="admin-hero-subtitulo" style={{ marginTop: 16 }}>
          Controle o ritmo da sua empresa com informações claras, processos simples e gestão inteligente.
        </p>
      </div>
    </div>
  );
}
