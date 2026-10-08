import React, { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import Alert from "../components/Alert";
import { History, ShieldCheck, User } from "lucide-react";

export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/audit-logs/");
      setLogs(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load system audit trail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const getActionBadgeColor = (action) => {
    const a = String(action || "").toUpperCase();
    if (a.includes("CREATE") || a.includes("ADD")) return "badge-emerald";
    if (a.includes("DISPATCH") || a.includes("COMPLETE")) return "badge-blue";
    if (a.includes("UPDATE") || a.includes("PATCH")) return "badge-amber";
    if (a.includes("DELETE") || a.includes("CANCEL") || a.includes("RETIRE"))
      return "badge-rose";
    return "badge-slate";
  };

  const columns = [
    {
      header: "Log ID",
      accessor: "id",
      render: (log) => (
        <span style={{ fontWeight: 600, color: "var(--primary)" }}>#{log.id}</span>
      ),
    },
    {
      header: "User ID",
      render: (log) => (
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <User size={14} color="var(--text-muted)" />
          <span>{log.user_id ? `User #${log.user_id}` : "System / Unknown"}</span>
        </div>
      ),
    },
    {
      header: "Action",
      render: (log) => (
        <span className={`badge ${getActionBadgeColor(log.action)}`}>
          {log.action}
        </span>
      ),
    },
    {
      header: "Entity Type",
      accessor: "entity_type",
      render: (log) => <span style={{ fontWeight: 600 }}>{log.entity_type}</span>,
    },
    {
      header: "Entity ID",
      render: (log) => (log.entity_id ? `#${log.entity_id}` : "—"),
    },
    {
      header: "Description Details",
      accessor: "description",
      render: (log) => log.description || "—",
    },
    {
      header: "Timestamp",
      render: (log) => new Date(log.created_at).toLocaleString(),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Audit Logs</h1>
          <p className="page-subtitle">Security event logging, modification records, & compliance trail</p>
        </div>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError("")} />}

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        searchPlaceholder="Search action, entity type, description..."
        customSearch={(log, term) => {
          if (!term) return true;
          const lower = term.toLowerCase();
          return (
            log.action.toLowerCase().includes(lower) ||
            log.entity_type.toLowerCase().includes(lower) ||
            (log.description && log.description.toLowerCase().includes(lower))
          );
        }}
        emptyMessage="No audit log entries recorded"
      />
    </div>
  );
}

export default AuditLogsPage;
