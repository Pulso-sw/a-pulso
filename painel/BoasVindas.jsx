export default function BoasVindas() {
  return (
    <div
      className="admin-hero"
      style={{ backgroundImage: "url(/hero-bg.png)" }}
    >
      <div className="admin-hero-overlay" />
      <div className="admin-hero-content">
        <p className="admin-eyebrow">Painel administrativo</p>
        <h1 className="admin-titulo" style={{ marginBottom: 16 }}>Bem-vindo ao Pulso da sua empresa</h1>
        <p className="admin-hero-subtitulo">
          Controle o ritmo da sua empresa com informações claras, processos simples e gestão inteligente.
        </p>
      </div>
    </div>
  );
}
