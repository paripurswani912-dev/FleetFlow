import React, { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Alert from "../components/Alert";
import { formatCurrency } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";
import { Plus, Edit3, Archive, Truck } from "lucide-react";

export function VehiclesPage() {
  const { roleId } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [retireTarget, setRetireTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    registration_number: "",
    model: "",
    vehicle_type: "",
    max_load_capacity: "",
    odometer: "0",
    acquisition_cost: "",
  });

  const canManage = [1, 5].includes(roleId);

  const fetchVehicles = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/vehicles/");
      setVehicles(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load vehicles list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      registration_number: "",
      model: "",
      vehicle_type: "Truck",
      max_load_capacity: "",
      odometer: "0",
      acquisition_cost: "",
    });
    setError("");
    setIsAddOpen(true);
  };

  const handleOpenEdit = (v) => {
    setSelectedVehicle(v);
    setFormData({
      registration_number: v.registration_number,
      model: v.model,
      vehicle_type: v.vehicle_type,
      max_load_capacity: String(v.max_load_capacity),
      odometer: String(v.odometer),
      acquisition_cost: String(v.acquisition_cost),
      status: v.status,
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
        registration_number: formData.registration_number.trim(),
        model: formData.model.trim(),
        vehicle_type: formData.vehicle_type.trim(),
        max_load_capacity: parseFloat(formData.max_load_capacity),
        odometer: parseFloat(formData.odometer || 0),
        acquisition_cost: parseFloat(formData.acquisition_cost || 0),
      };

      await api.post("/vehicles/", payload);
      setSuccess(`Vehicle ${payload.registration_number} created successfully.`);
      setIsAddOpen(false);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create vehicle.");
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
        registration_number: formData.registration_number.trim(),
        model: formData.model.trim(),
        vehicle_type: formData.vehicle_type.trim(),
        max_load_capacity: parseFloat(formData.max_load_capacity),
        odometer: parseFloat(formData.odometer),
        acquisition_cost: parseFloat(formData.acquisition_cost),
        status: formData.status,
      };

      await api.patch(`/vehicles/${selectedVehicle.id}`, payload);
      setSuccess(`Vehicle ${payload.registration_number} updated successfully.`);
      setIsEditOpen(false);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update vehicle.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetireConfirm = async () => {
    if (!retireTarget) return;
    setActionLoading(true);
    setError("");

    try {
      await api.patch(`/vehicles/${retireTarget.id}/retire`);
      setSuccess(`Vehicle ${retireTarget.registration_number} retired successfully.`);
      setRetireTarget(null);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to retire vehicle.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: "Reg Number",
      accessor: "registration_number",
      render: (v) => (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              padding: "0.35rem",
              borderRadius: "4px",
              backgroundColor: "#f1f5f9",
              color: "#334155",
            }}
          >
            <Truck size={16} />
          </div>
          <span style={{ fontWeight: 600 }}>{v.registration_number}</span>
        </div>
      ),
    },
    { header: "Model", accessor: "model" },
    { header: "Type", accessor: "vehicle_type" },
    {
      header: "Max Capacity",
      render: (v) => `${v.max_load_capacity} tons`,
    },
    {
      header: "Odometer",
      render: (v) => `${v.odometer.toLocaleString()} km`,
    },
    {
      header: "Acquisition Cost",
      render: (v) => formatCurrency(v.acquisition_cost),
    },
    {
      header: "Status",
      render: (v) => <Badge status={v.status} />,
    },
    ...(canManage
      ? [
          {
            header: "Actions",
            render: (v) => (
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenEdit(v)}
                  title="Edit Vehicle"
                >
                  <Edit3 size={14} />
                  <span>Edit</span>
                </button>
                {v.status !== "Retired" && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setRetireTarget(v)}
                    title="Retire Vehicle"
                  >
                    <Archive size={14} />
                    <span>Retire</span>
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  const filters = [
    { key: "all", label: "All Vehicles" },
    { key: "available", label: "Available" },
    { key: "on trip", label: "On Trip" },
    { key: "in shop", label: "In Shop" },
    { key: "retired", label: "Retired" },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicle Management</h1>
          <p className="page-subtitle">Track, update, and manage fleet assets</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Add New Vehicle</span>
          </button>
        )}
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError("")} />}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess("")} />
      )}

      <DataTable
        columns={columns}
        data={vehicles}
        loading={loading}
        searchPlaceholder="Search reg number, model, type..."
        searchField="registration_number"
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        emptyMessage="No vehicles match the selected criteria"
      />

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Vehicle"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Registration Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. TX-9081"
              value={formData.registration_number}
              onChange={(e) =>
                setFormData({ ...formData, registration_number: e.target.value })
              }
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Model</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Volvo FH16"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <select
                className="form-select"
                value={formData.vehicle_type}
                onChange={(e) =>
                  setFormData({ ...formData, vehicle_type: e.target.value })
                }
                required
              >
                <option value="Truck">Heavy Duty Truck</option>
                <option value="Van">Cargo Van</option>
                <option value="Trailer">Semi-Trailer</option>
                <option value="Pickup">Pickup Utility</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Max Capacity (Tons)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className="form-input"
                placeholder="e.g. 15.5"
                value={formData.max_load_capacity}
                onChange={(e) =>
                  setFormData({ ...formData, max_load_capacity: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Current Odometer (km)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="form-input"
                value={formData.odometer}
                onChange={(e) =>
                  setFormData({ ...formData, odometer: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Acquisition Cost (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="e.g. 85000"
              value={formData.acquisition_cost}
              onChange={(e) =>
                setFormData({ ...formData, acquisition_cost: e.target.value })
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
              {actionLoading ? "Saving..." : "Create Vehicle"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Vehicle: ${selectedVehicle?.registration_number}`}
      >
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">Registration Number</label>
            <input
              type="text"
              className="form-input"
              value={formData.registration_number}
              onChange={(e) =>
                setFormData({ ...formData, registration_number: e.target.value })
              }
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Model</label>
              <input
                type="text"
                className="form-input"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <input
                type="text"
                className="form-input"
                value={formData.vehicle_type}
                onChange={(e) =>
                  setFormData({ ...formData, vehicle_type: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Max Capacity (Tons)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className="form-input"
                value={formData.max_load_capacity}
                onChange={(e) =>
                  setFormData({ ...formData, max_load_capacity: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Odometer (km)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="form-input"
                value={formData.odometer}
                onChange={(e) =>
                  setFormData({ ...formData, odometer: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Acquisition Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={formData.acquisition_cost}
                onChange={(e) =>
                  setFormData({ ...formData, acquisition_cost: e.target.value })
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
                <option value="In Shop">In Shop</option>
                <option value="Retired">Retired</option>
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
              {actionLoading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Retire Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(retireTarget)}
        onClose={() => setRetireTarget(null)}
        onConfirm={handleRetireConfirm}
        title="Retire Vehicle"
        message={`Are you sure you want to retire vehicle ${retireTarget?.registration_number}? It will be marked as Retired and cannot be dispatched.`}
        confirmText="Retire Vehicle"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
}

export default VehiclesPage;
