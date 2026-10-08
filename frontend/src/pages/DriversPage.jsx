import React, { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import Alert from "../components/Alert";
import { useAuth } from "../context/AuthContext";
import { Plus, Edit3, UserCheck, Shield, AlertTriangle } from "lucide-react";

export function DriversPage() {
  const { roleId } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    license_number: "",
    license_category: "Heavy Commercial",
    license_expiry: "",
    contact_number: "",
    safety_score: 100,
    status: "Available",
  });

  const canManage = [1, 5].includes(roleId);

  const fetchDrivers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/drivers/");
      setDrivers(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load drivers data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      license_number: "",
      license_category: "Class A CDL",
      license_expiry: new Date(Date.now() + 365 * 86400000)
        .toISOString()
        .split("T")[0],
      contact_number: "",
      safety_score: 100,
      status: "Available",
    });
    setError("");
    setIsAddOpen(true);
  };

  const handleOpenEdit = (d) => {
    setSelectedDriver(d);
    setFormData({
      name: d.name,
      license_number: d.license_number,
      license_category: d.license_category,
      license_expiry: d.license_expiry,
      contact_number: d.contact_number,
      safety_score: d.safety_score,
      status: d.status,
    });
    setError("");
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");

    try {
      const payload = {
        name: formData.name.trim(),
        license_number: formData.license_number.trim(),
        license_category: formData.license_category.trim(),
        license_expiry: formData.license_expiry,
        contact_number: formData.contact_number.trim(),
      };

      await api.post("/drivers/", payload);
      setSuccess(`Driver ${payload.name} created successfully.`);
      setIsAddOpen(false);
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create driver.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");

    try {
      const payload = {
        name: formData.name.trim(),
        license_number: formData.license_number.trim(),
        license_category: formData.license_category.trim(),
        license_expiry: formData.license_expiry,
        contact_number: formData.contact_number.trim(),
        safety_score: parseFloat(formData.safety_score),
        status: formData.status,
      };

      await api.patch(`/drivers/${selectedDriver.id}`, payload);
      setSuccess(`Driver ${payload.name} updated successfully.`);
      setIsEditOpen(false);
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update driver.");
    } finally {
      setActionLoading(false);
    }
  };

  const isExpired = (expiryDateStr) => {
    if (!expiryDateStr) return false;
    return new Date(expiryDateStr) < new Date();
  };

  const columns = [
    {
      header: "Driver Name",
      accessor: "name",
      render: (d) => (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              padding: "0.35rem",
              borderRadius: "50%",
              backgroundColor: "#eff6ff",
              color: "#2563eb",
            }}
          >
            <UserCheck size={16} />
          </div>
          <span style={{ fontWeight: 600 }}>{d.name}</span>
        </div>
      ),
    },
    { header: "License Number", accessor: "license_number" },
    { header: "Category", accessor: "license_category" },
    {
      header: "License Expiry",
      render: (d) => {
        const expired = isExpired(d.license_expiry);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span>{d.license_expiry}</span>
            {expired && (
              <span
                style={{
                  color: "#ef4444",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                }}
                title="License Expired"
              >
                <AlertTriangle size={14} /> Expired
              </span>
            )}
          </div>
        );
      },
    },
    { header: "Contact", accessor: "contact_number" },
    {
      header: "Safety Score",
      render: (d) => (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Shield
            size={14}
            color={d.safety_score >= 85 ? "#10b981" : d.safety_score >= 70 ? "#f59e0b" : "#ef4444"}
          />
          <span style={{ fontWeight: 600 }}>{d.safety_score} / 100</span>
        </div>
      ),
    },
    {
      header: "Status",
      render: (d) => <Badge status={d.status} />,
    },
    ...(canManage
      ? [
          {
            header: "Actions",
            render: (d) => (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleOpenEdit(d)}
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
            ),
          },
        ]
      : []),
  ];

  const filters = [
    { key: "all", label: "All Drivers" },
    { key: "available", label: "Available" },
    { key: "on trip", label: "On Trip" },
    { key: "off duty", label: "Off Duty" },
    { key: "suspended", label: "Suspended" },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Driver Personnel</h1>
          <p className="page-subtitle">Manage operator profiles, safety compliance, & licensing</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Add Driver</span>
          </button>
        )}
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError("")} />}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess("")} />
      )}

      <DataTable
        columns={columns}
        data={drivers}
        loading={loading}
        searchPlaceholder="Search driver name, license #, contact..."
        searchField="name"
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        emptyMessage="No driver profiles match your search criteria"
      />

      {/* Add Driver Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Driver"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Johnathan Smith"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">License Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. DL-8839210"
                value={formData.license_number}
                onChange={(e) =>
                  setFormData({ ...formData, license_number: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Class A CDL"
                value={formData.license_category}
                onChange={(e) =>
                  setFormData({ ...formData, license_category: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">License Expiry Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.license_expiry}
                onChange={(e) =>
                  setFormData({ ...formData, license_expiry: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. +1 555-0192"
                value={formData.contact_number}
                onChange={(e) =>
                  setFormData({ ...formData, contact_number: e.target.value })
                }
                required
              />
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
              {actionLoading ? "Registering..." : "Add Driver"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Driver Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Driver: ${selectedDriver?.name}`}
      >
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">License Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.license_number}
                onChange={(e) =>
                  setFormData({ ...formData, license_number: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-input"
                value={formData.license_category}
                onChange={(e) =>
                  setFormData({ ...formData, license_category: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">License Expiry Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.license_expiry}
                onChange={(e) =>
                  setFormData({ ...formData, license_expiry: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.contact_number}
                onChange={(e) =>
                  setFormData({ ...formData, contact_number: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Safety Score (0 - 100)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={formData.safety_score}
                onChange={(e) =>
                  setFormData({ ...formData, safety_score: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="Off Duty">Off Duty</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: 0, marginTop: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DriversPage;
