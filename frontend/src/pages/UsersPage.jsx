import React, { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Alert from "../components/Alert";
import { getRoleName } from "../utils/roleUtils";
import { UserPlus, CheckCircle2, XCircle, Shield } from "lucide-react";

const PREDEFINED_ROLES = [
  { id: 1, name: "Fleet Manager" },
  { id: 2, name: "Driver" },
  { id: 3, name: "Safety Officer" },
  { id: 4, name: "Financial Analyst" },
  { id: 5, name: "System Administrator" },
];

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(PREDEFINED_ROLES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role_id: "1",
  });

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [uRes, rRes] = await Promise.all([
        api.get("/users/"),
        api.get("/roles/"),
      ]);
      setUsers(uRes.data);
      if (rRes.data && rRes.data.length > 0) {
        setRoles(rRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load system users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      full_name: "",
      email: "",
      password: "",
      role_id: "1",
    });
    setError("");
    setIsAddOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role_id: parseInt(formData.role_id, 10),
      };

      await api.post("/users/", payload);
      setSuccess(`User "${payload.full_name}" created successfully.`);
      setIsAddOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatusConfirm = async () => {
    if (!toggleTarget) return;
    setActionLoading(true);
    setError("");

    try {
      const endpoint = toggleTarget.is_active
        ? `/users/${toggleTarget.id}/deactivate`
        : `/users/${toggleTarget.id}/activate`;

      await api.patch(endpoint);
      setSuccess(
        `User "${toggleTarget.full_name}" has been ${
          toggleTarget.is_active ? "deactivated" : "activated"
        }.`
      );
      setToggleTarget(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update user status.");
    } finally {
      setActionLoading(false);
    }
  };

  const roleMap = roles.reduce((acc, r) => {
    acc[r.id] = r.name;
    return acc;
  }, {});

  const columns = [
    {
      header: "User ID",
      accessor: "id",
      render: (u) => (
        <span style={{ fontWeight: 600, color: "var(--primary)" }}>#{u.id}</span>
      ),
    },
    {
      header: "Full Name",
      accessor: "full_name",
      render: (u) => <span style={{ fontWeight: 600 }}>{u.full_name}</span>,
    },
    { header: "Email Address", accessor: "email" },
    {
      header: "Assigned Role",
      render: (u) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            fontWeight: 500,
            fontSize: "0.8125rem",
            backgroundColor: "#f1f5f9",
            padding: "0.2rem 0.5rem",
            borderRadius: "4px",
          }}
        >
          <Shield size={12} color="#2563eb" />
          {roleMap[u.role_id] || getRoleName(u.role_id)}
        </span>
      ),
    },
    {
      header: "Account Status",
      render: (u) => (
        <Badge status={u.is_active ? "Active" : "Inactive"} />
      ),
    },
    {
      header: "Actions",
      render: (u) => (
        <button
          className={`btn btn-${u.is_active ? "danger" : "success"} btn-sm`}
          onClick={() => setToggleTarget(u)}
        >
          {u.is_active ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
          <span>{u.is_active ? "Deactivate" : "Activate"}</span>
        </button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Accounts & Access Management</h1>
          <p className="page-subtitle">Provision user credentials and manage role assignments</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <UserPlus size={16} />
          <span>Provision New User</span>
        </button>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError("")} />}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess("")} />
      )}

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchPlaceholder="Search full name, email..."
        searchField="full_name"
        emptyMessage="No user accounts found"
      />

      {/* Add User Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Provision User Account"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Alex Johnson"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. alex@fleetflow.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Initial Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assign Predefined System Role</label>
              <select
                className="form-select"
                value={formData.role_id}
                onChange={(e) =>
                  setFormData({ ...formData, role_id: e.target.value })
                }
                required
              >
                {PREDEFINED_ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: 0, marginTop: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? "Provisioning..." : "Provision User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toggle Activation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleStatusConfirm}
        title={toggleTarget?.is_active ? "Deactivate User" : "Activate User"}
        message={`Are you sure you want to ${
          toggleTarget?.is_active ? "deactivate" : "activate"
        } account for "${toggleTarget?.full_name}"?`}
        confirmText={toggleTarget?.is_active ? "Deactivate Account" : "Activate Account"}
        confirmVariant={toggleTarget?.is_active ? "danger" : "success"}
        loading={actionLoading}
      />
    </div>
  );
}

export default UsersPage;
