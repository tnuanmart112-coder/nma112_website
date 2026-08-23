export function StatusMessage({ message, type = "info" }) {
  return (
    <div className={`status-message status-message--${type}`} role={type === "error" ? "alert" : "status"}>
      {type === "loading" ? <span className="loading-dot" aria-hidden="true" /> : null}
      <span>{message}</span>
    </div>
  );
}
