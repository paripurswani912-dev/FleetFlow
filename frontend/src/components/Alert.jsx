import React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export function Alert({ type = "danger", message, onClose }) {
  if (!message) return null;

  const icons = {
    danger: <AlertCircle size={18} />,
    success: <CheckCircle2 size={18} />,
    info: <Info size={18} />,
  };

  return (
    <div className={`alert alert-${type}`}>
      {icons[type] || <Info size={18} />}
      <div style={{ flex: 1 }}>{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.8 }}
        >
          &times;
        </button>
      )}
    </div>
  );
}

export default Alert;
