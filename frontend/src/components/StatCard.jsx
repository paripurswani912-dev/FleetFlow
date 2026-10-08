import React from "react";

export function StatCard({ title, value, subtext, icon: Icon, color = "blue" }) {
  const colorStyles = {
    blue: { bg: "#eff6ff", text: "#2563eb" },
    emerald: { bg: "#ecfdf5", text: "#10b981" },
    amber: { bg: "#fffbeb", text: "#f59e0b" },
    rose: { bg: "#fef2f2", text: "#ef4444" },
    purple: { bg: "#f3e8ff", text: "#9333ea" },
    indigo: { bg: "#e0e7ff", text: "#4f46e5" },
  };

  const currentStyle = colorStyles[color] || colorStyles.blue;

  return (
    <div className="stat-card">
      <div className="stat-info">
        <span className="stat-label">{title}</span>
        <span className="stat-value">{value}</span>
        {subtext && <span className="stat-sub">{subtext}</span>}
      </div>
      {Icon && (
        <div
          className="stat-icon-wrapper"
          style={{ backgroundColor: currentStyle.bg, color: currentStyle.text }}
        >
          <Icon size={22} />
        </div>
      )}
    </div>
  );
}

export default StatCard;
