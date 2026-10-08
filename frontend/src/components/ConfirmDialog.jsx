import React from "react";
import { Modal } from "./Modal";
import { AlertTriangle } from "lucide-react";

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  confirmVariant = "danger",
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={`btn btn-${confirmVariant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
        <div
          style={{
            padding: "0.5rem",
            borderRadius: "50%",
            backgroundColor: confirmVariant === "danger" ? "#fef2f2" : "#eff6ff",
            color: confirmVariant === "danger" ? "#ef4444" : "#2563eb",
          }}
        >
          <AlertTriangle size={24} />
        </div>
        <div>
          <p style={{ margin: 0, color: "var(--text-main)", fontSize: "0.9375rem" }}>
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
