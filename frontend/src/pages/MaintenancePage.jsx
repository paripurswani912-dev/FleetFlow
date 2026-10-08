import React, { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Alert from "../components/Alert";
import { formatCurrency } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";
import { Plus, Wrench, CheckCircle2 } from "lucide-react";

export function MaintenancePage() {
  const { roleId } = useAuth();
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    vehicle_id: "",
    maintenance_type: "Routine Service",
    description: "",
    cost: "",
  });

  const canManage = [1, 3, 5].includes(roleId);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [mRes, vRes] = await Promise.all([
        api.get("/maintenance/"),
        api.get("/vehicles/"),
      ]);
      setRecords(mRes.data);
      setVehicles(vRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load maintenance logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      vehicle_id: "",
      maintenance_type: "Routine Service",
      description: "",
      cost: "",
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
        vehicle_id: parseInt(formData.vehicle_id, 10),
        maintenance_type: formData.maintenance_type.trim(),
        description: formData.description.trim(),
        cost: parseFloat(formData.cost),
      };

      await api.post("/maintenance/", payload);
      setSuccess("Maintenance order submitted. Vehicle marked as In Shop.");
      setIsAddOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create maintenance record.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteConfirm = async () => {
    if (!completeTarget) return;
    setActionLoading(true);
    setError("");

    try {
      await api.patch(`/maintenance/${completeTarget.id}/complete`);
      setSuccess(`Maintenance #${completeTarget.id} completed. Vehicle returned to Available.`);
      setCompleteTarget(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to complete maintenance.");
    } finally {
      setActionLoading(false);
    }
  };

  const vehicleMap = vehicles.reduce((acc, v) => {
    acc[v.id] = v;
    return acc;
  }, {});

  const columns = [
    {
      header: "Log ID",
      accessor: "id",
      render: (m) => (
        <span style={{ fontWeight: 600, color: "var(--primary)" }}>#{m.id}</span>
      ),
    },
    {
      header: "Vehicle",
      render: (m) => {
        const v = vehicleMap[m.vehicle_id];
        return v ? `${v.registration_number} (${v.model})` : `Vehicle #${m.vehicle_id}`;
      },
    },
    { header: "Service Type", accessor: "maintenance_type" },
    { header: "Description", accessor: "description" },
    {
      header: "Cost (₹)",
      render: (m) => formatCurrency(m.cost),
    },
    {
      header: "Started At",
      render: (m) => new Date(m.started_at).toLocaleDateString(),
    },
    {
      header: "Completed At",
      render: (m) => (m.completed_at ? new Date(m.completed_at).toLocaleDateString() : "—"),
    },
    {
      header: "Status",
      render: (m) => <Badge status={m.status} />,
    },
    ...(canManage
      ? [
          {
            header: "Action",
            render: (m) =>
              m.status === "Pending" ? (
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => setCompleteTarget(m)}
                >
                  <CheckCircle2 size={13} />
                  <span>Mark Complete</span>
                </button>
              ) : (
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Resolved
                </span>
              ),
          },
        ]
      : []),
  ];

  const filters = [
    { key: "all", label: "All Logs" },
    { key: "pending", label: "Pending / In Shop" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fleet Maintenance</h1>
          <p className="page-subtitle">Schedule servicing, repair logs, & shop status</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>New Service Order</span>
          </button>
        )}
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError("")} />}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess("")} />
      )}

      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        searchPlaceholder="Search maintenance type, description..."
        customSearch={(item, term) => {
          if (!term) return true;
          const lower = term.toLowerCase();
          const v = vehicleMap[item.vehicle_id];
          return (
            item.maintenance_type.toLowerCase().includes(lower) ||
            item.description.toLowerCase().includes(lower) ||
            (v && v.registration_number.toLowerCase().includes(lower))
          );
        }}
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        emptyMessage="No maintenance logs found"
      />

      {/* Add Maintenance Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Schedule Maintenance / Repair"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Select Vehicle</label>
            <select
              className="form-select"
              value={formData.vehicle_id}
              onChange={(e) =>
                setFormData({ ...formData, vehicle_id: e.target.value })
              }
              required
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} - {v.model} ({v.status})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Service Type</label>
              <select
                className="form-select"
                value={formData.maintenance_type}
                onChange={(e) =>
                  setFormData({ ...formData, maintenance_type: e.target.value })
                }
              >
                <option value="Routine Service">Routine Oil & Filter</option>
                <option value="Engine Repair">Engine / Transmission Repair</option>
                <option value="Tire Replacement">Tire Service & Replacement</option>
                <option value="Brake Inspection">Brake & Safety Inspection</option>
                <option value="Body & Chassis">Body & Paint Work</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="e.g. 450"
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Service Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe required service or repairs..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
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
              {actionLoading ? "Submitting..." : "Schedule Maintenance"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Maintenance Dialog */}
      <ConfirmDialog
        isOpen={Boolean(completeTarget)}
        onClose={() => setCompleteTarget(null)}
        onConfirm={handleCompleteConfirm}
        title="Complete Maintenance Order"
        message={`Mark Maintenance #${completeTarget?.id} as Completed? This will return vehicle ${vehicleMap[completeTarget?.vehicle_id]?.registration_number} to 'Available' status.`}
        confirmText="Mark Completed"
        confirmVariant="success"
        loading={actionLoading}
      />
    </div>
  );
}

export default MaintenancePage;
