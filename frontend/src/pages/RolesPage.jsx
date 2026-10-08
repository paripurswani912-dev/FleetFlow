import React, { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import Alert from "../components/Alert";
import { Shield, Lock } from "lucide-react";

export function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRoles = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/roles/");
      setRoles(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load roles list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const columns = [
    {
      header: "Role ID",
      accessor: "id",
      render: (r) => (
        <span style={{ fontWeight: 600, color: "var(--primary)" }}>#{r.id}</span>
      ),
    },
    {
      header: "Role Name",
      accessor: "name",
      render: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Shield size={16} color="var(--primary)" />
          <span style={{ fontWeight: 600 }}>{r.name}</span>
        </div>
      ),
    },
    {
      header: "Authorization & Responsibility Scope",
      accessor: "description",
      render: (r) => r.description || "—",
    },
    {
      header: "System Status",
      render: () => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--text-muted)",
            backgroundColor: "var(--bg-main)",
            padding: "0.25rem 0.6rem",
            borderRadius: "9999px",
            border: "1px solid var(--border-color)",
          }}
        >
          <Lock size={12} /> Predefined System Role
        </span>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Role Authorization Reference</h1>
          <p className="page-subtitle">Predefined system roles and access control matrix</p>
        </div>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError("")} />}

      <DataTable
        columns={columns}
        data={roles}
        loading={loading}
        searchPlaceholder="Search role name, description..."
        searchField="name"
        emptyMessage="No system roles found"
      />
    </div>
  );
}

export default RolesPage;
