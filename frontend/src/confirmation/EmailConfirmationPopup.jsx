const EmailConfirmationPopup = ({
  isOpen,
  email = "",
  onClose,
  onResend,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-confirmation-title"
      aria-describedby="email-confirmation-desc"
    >
      <div className="card modal-card">
        <h3 id="email-confirmation-title">Confirm Your Email</h3>
        <p id="email-confirmation-desc" className="muted">
          Please confirm email that was sent on <strong>{email || "your email"}</strong>
        </p>

        <p className="micro" style={{ marginTop: "0.75rem" }}>
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            className="btn btn--ghost"
            style={{ padding: 0, border: "none", background: "transparent" }}
            onClick={onResend}
          >
            Resend
          </button>
        </p>

        <div style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationPopup;
