import React, { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Alert from "../components/Alert";
import { formatCurrency } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";
import { Plus, Send, CheckCircle2, XCircle, Navigation, ArrowRight } from "lucide-react";

export function TripsPage() {
  const { roleId } = useAuth();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Modal & Action states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState(null); // { trip, actionType: 'dispatch' | 'complete' | 'cancel' }
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    source: "",
    destination: "",
    vehicle_id: "",
    driver_id: "",
    cargo_weight: "",
    planned_distance: "",
    revenue: "",
  });

  const canManage = [1, 5].includes(roleId);

  const fetchTripsAndResources = async () => {
    setLoading(true);
    setError("");
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        api.get("/trips/"),
        api.get("/vehicles/"),
        api.get("/drivers/"),
      ]);

      setTrips(tripsRes.data);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load trips or resource data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripsAndResources();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      source: "",
      destination: "",
      vehicle_id: "",
      driver_id: "",
      cargo_weight: "",
      planned_distance: "",
      revenue: "",
    });
    setError("");
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");

    try {
      const payload = {
        source: formData.source.trim(),
        destination: formData.destination.trim(),
        vehicle_id: parseInt(formData.vehicle_id, 10),
        driver_id: parseInt(formData.driver_id, 10),
        cargo_weight: parseFloat(formData.cargo_weight),
        planned_distance: parseFloat(formData.planned_distance),
        revenue: parseFloat(formData.revenue),
      };

      await api.post("/trips/", payload);
      setSuccess(`Trip from ${payload.source} to ${payload.destination} created.`);
      setIsCreateOpen(false);
      fetchTripsAndResources();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create trip.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTripActionConfirm = async () => {
    if (!actionTarget) return;
    const { trip, actionType } = actionTarget;
    setActionLoading(true);
    setError("");

    try {
      if (actionType === "dispatch") {
        await api.patch(`/trips/${trip.id}/dispatch`);
        setSuccess(`Trip #${trip.id} dispatched successfully.`);
      } else if (actionType === "complete") {
        await api.patch(`/trips/${trip.id}/complete`);
        setSuccess(`Trip #${trip.id} completed successfully.`);
      } else if (actionType === "cancel") {
        await api.patch(`/trips/${trip.id}/cancel`);
        setSuccess(`Trip #${trip.id} cancelled successfully.`);
      }

      setActionTarget(null);
      fetchTripsAndResources();
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${actionType} trip.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Maps vehicle_id -> reg number / model
  const vehicleMap = vehicles.reduce((acc, v) => {
    acc[v.id] = v;
    return acc;
  }, {});

  // Maps driver_id -> driver name
  const driverMap = drivers.reduce((acc, d) => {
    acc[d.id] = d;
    return acc;
  }, {});

  const availableVehicles = vehicles.filter((v) => v.status === "Available");
  const availableDrivers = drivers.filter((d) => d.status === "Available");

  const selectedVehicleObj = vehicles.find(
    (v) => String(v.id) === String(formData.vehicle_id)
  );

  const columns = [
    {
      header: "Trip ID",
      accessor: "id",
      render: (t) => (
        <span style={{ fontWeight: 600, color: "var(--primary)" }}>#{t.id}</span>
      ),
    },
    {
      header: "Route",
      render: (t) => (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 500 }}>
          <span>{t.source}</span>
          <ArrowRight size={14} color="var(--text-muted)" />
          <span>{t.destination}</span>
        </div>
      ),
    },
    {
      header: "Vehicle",
      render: (t) => {
        const v = vehicleMap[t.vehicle_id];
        return v ? `${v.registration_number} (${v.model})` : `Vehicle #${t.vehicle_id}`;
      },
    },
    {
      header: "Driver",
      render: (t) => {
        const d = driverMap[t.driver_id];
        return d ? d.name : `Driver #${t.driver_id}`;
      },
    },
    {
      header: "Cargo Weight",
      render: (t) => `${t.cargo_weight} tons`,
    },
    {
      header: "Planned Distance",
      render: (t) => `${t.planned_distance} km`,
    },
    {
      header: "Revenue",
      render: (t) => formatCurrency(t.revenue),
    },
    {
      header: "Status",
      render: (t) => <Badge status={t.status} />,
    },
    ...(canManage
      ? [
          {
            header: "Workflow Actions",
            render: (t) => (
              <div style={{ display: "flex", gap: "0.35rem" }}>
                {t.status === "Draft" && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setActionTarget({ trip: t, actionType: "dispatch" })}
                    title="Dispatch Trip"
                  >
                    <Send size={13} />
                    <span>Dispatch</span>
                  </button>
                )}

                {t.status === "Dispatched" && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => setActionTarget({ trip: t, actionType: "complete" })}
                    title="Complete Trip"
                  >
                    <CheckCircle2 size={13} />
                    <span>Complete</span>
                  </button>
                )}

                {(t.status === "Draft" || t.status === "Dispatched") && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setActionTarget({ trip: t, actionType: "cancel" })}
                    title="Cancel Trip"
                  >
                    <XCircle size={13} />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  const filters = [
    { key: "all", label: "All Trips" },
    { key: "draft", label: "Draft" },
    { key: "dispatched", label: "Dispatched" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trip & Route Dispatch</h1>
          <p className="page-subtitle">Schedule, assign, dispatch, and track cargo transit</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Create Trip Draft</span>
          </button>
        )}
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError("")} />}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess("")} />
      )}

      <DataTable
        columns={columns}
        data={trips}
        loading={loading}
        searchPlaceholder="Search source, destination..."
        customSearch={(trip, term) => {
          if (!term) return true;
          const lower = term.toLowerCase();
          const v = vehicleMap[trip.vehicle_id];
          const d = driverMap[trip.driver_id];
          return (
            trip.source.toLowerCase().includes(lower) ||
            trip.destination.toLowerCase().includes(lower) ||
            (v && v.registration_number.toLowerCase().includes(lower)) ||
            (d && d.name.toLowerCase().includes(lower))
          );
        }}
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        emptyMessage="No trips found in the system"
      />

      {/* Create Trip Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Trip Draft"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Origin / Source Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Warehouse Alpha (Chicago)"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Destination Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Distribution Center (Detroit)"
                value={formData.destination}
                onChange={(e) =>
                  setFormData({ ...formData, destination: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assign Vehicle</label>
              <select
                className="form-select"
                value={formData.vehicle_id}
                onChange={(e) =>
                  setFormData({ ...formData, vehicle_id: e.target.value })
                }
                required
              >
                <option value="">-- Select Available Vehicle --</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number} - {v.model} (Max: {v.max_load_capacity}t)
                  </option>
                ))}
              </select>
              {availableVehicles.length === 0 && (
                <span className="form-error">No vehicles currently Available.</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Assign Driver</label>
              <select
                className="form-select"
                value={formData.driver_id}
                onChange={(e) =>
                  setFormData({ ...formData, driver_id: e.target.value })
                }
                required
              >
                <option value="">-- Select Available Driver --</option>
                {availableDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.license_category})
                  </option>
                ))}
              </select>
              {availableDrivers.length === 0 && (
                <span className="form-error">No drivers currently Available.</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Cargo Weight (Tons){" "}
                {selectedVehicleObj && (
                  <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>
                    (Max: {selectedVehicleObj.max_load_capacity}t)
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max={selectedVehicleObj ? selectedVehicleObj.max_load_capacity : undefined}
                className="form-input"
                placeholder="e.g. 8.5"
                value={formData.cargo_weight}
                onChange={(e) =>
                  setFormData({ ...formData, cargo_weight: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Planned Distance (km)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className="form-input"
                placeholder="e.g. 450"
                value={formData.planned_distance}
                onChange={(e) =>
                  setFormData({ ...formData, planned_distance: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Expected Revenue (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="e.g. 3200"
              value={formData.revenue}
              onChange={(e) =>
                setFormData({ ...formData, revenue: e.target.value })
              }
              required
            />
          </div>

          <div className="modal-footer" style={{ padding: 0, marginTop: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                actionLoading ||
                availableVehicles.length === 0 ||
                availableDrivers.length === 0
              }
            >
              {actionLoading ? "Creating..." : "Save Trip Draft"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Action Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(actionTarget)}
        onClose={() => setActionTarget(null)}
        onConfirm={handleTripActionConfirm}
        title={`${
          actionTarget?.actionType === "dispatch"
            ? "Dispatch Trip"
            : actionTarget?.actionType === "complete"
            ? "Complete Trip"
            : "Cancel Trip"
        }`}
        message={`Are you sure you want to ${actionTarget?.actionType} Trip #${actionTarget?.trip?.id} (${actionTarget?.trip?.source} to ${actionTarget?.trip?.destination})?`}
        confirmText={`Confirm ${actionTarget?.actionType}`}
        confirmVariant={actionTarget?.actionType === "cancel" ? "danger" : "primary"}
        loading={actionLoading}
      />
    </div>
  );
}

export default TripsPage;
