const ThesisPermissionModal = ({
  isOpen,
  code,
  error,
  onCodeChange,
  onCancel,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="card modal-card">
        <h3>Thesis Borrow Application</h3>
        <p className="muted">Enter your permission slip code to apply for this thesis.</p>
        <input
          className="input"
          type="text"
          inputMode="numeric"
          placeholder="Enter permission slip code"
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
        />
        {error ? <div className="alert">{error}</div> : null}
        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={onSubmit}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThesisPermissionModal;