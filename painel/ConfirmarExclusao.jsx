export default function ConfirmarExclusao({ aberto, titulo, mensagem, onCancelar, onConfirmar, confirmando }) {
  if (!aberto) return null;

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: 10 }}>{titulo || "Confirmar exclusão"}</h3>
        <p style={{ color: "var(--admin-texto-soft)", fontSize: "0.9rem", marginBottom: 24 }}>{mensagem}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn btn-ghost" onClick={onCancelar} disabled={confirmando}>
            Cancelar
          </button>
          <button className="btn btn-pulso" onClick={onConfirmar} disabled={confirmando}>
            {confirmando ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
