import React from "react";

export function Badge({ status, variant }) {
  if (!status) return null;

  const getVariantClass = () => {
    if (variant) return `badge-${variant}`;

    const s = String(status).toLowerCase();
    if (["available", "completed", "active"].includes(s)) {
      return "badge-emerald";
    }
    if (["on trip", "dispatched", "in transit"].includes(s)) {
      return "badge-blue";
    }
    if (["in shop", "off duty", "draft", "pending"].includes(s)) {
      return "badge-amber";
    }
    if (["retired", "suspended", "cancelled", "inactive"].includes(s)) {
      return "badge-rose";
    }
    return "badge-slate";
  };

  return <span className={`badge ${getVariantClass()}`}>{status}</span>;
}

export default Badge;
