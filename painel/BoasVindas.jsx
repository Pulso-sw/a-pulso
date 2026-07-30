export default function BoasVindas() {
  return (
    <div>
      <p className="admin-eyebrow">Painel Administrativo</p>
      <h1 className="admin-titulo">Bem-vindo à A Pulso</h1>
      <div className="ecg-full-bleed" style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="ecg-trace-wrap">
          <div className="ecg-track">
            <svg className="ecg-svg" viewBox="0 0 450 130" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,65 L160,65 L178,50 L196,95 L214,10 L232,70 L250,65 L450,65" fill="none" stroke="var(--pulso)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg className="ecg-svg" viewBox="0 0 450 130" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,65 L160,65 L178,50 L196,95 L214,10 L232,70 L250,65 L450,65" fill="none" stroke="var(--pulso)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
