import React, { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import Alert from "../components/Alert";
import StatCard from "../components/StatCard";
import { formatCurrency } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";
import { Plus, Fuel, IndianRupee, Gauge } from "lucide-react";

export function FuelLogsPage() {
  const { roleId } = useAuth();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    vehicle_id: "",
    liters: "",
    cost: "",
    odometer: "",
    notes: "",
  });

  const canManage = [1, 4, 5].includes(roleId);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [fRes, vRes] = await Promise.all([
        api.get("/fuel-logs/"),
        api.get("/vehicles/"),
      ]);
      setLogs(fRes.data);
      setVehicles(vRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load fuel records.");
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
      liters: "",
      cost: "",
      odometer: "",
      notes: "",
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
        liters: parseFloat(formData.liters),
        cost: parseFloat(formData.cost),
        odometer: parseFloat(formData.odometer),
        notes: formData.notes ? formData.notes.trim() : null,
      };

      await api.post("/fuel-logs/", payload);
      setSuccess("Fuel entry recorded successfully.");
      setIsAddOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to log fuel entry.");
    } finally {
      setActionLoading(false);
    }
  };

  const vehicleMap = vehicles.reduce((acc, v) => {
    acc[v.id] = v;
    return acc;
  }, {});

  const totalFuelLiters = logs.reduce((acc, item) => acc + item.liters, 0);
  const totalFuelCost = logs.reduce((acc, item) => acc + item.cost, 0);

  const columns = [
    {
      header: "Log ID",
      accessor: "id",
      render: (l) => (
        <span style={{ fontWeight: 600, color: "var(--primary)" }}>#{l.id}</span>
      ),
    },
    {
      header: "Vehicle",
      render: (l) => {
        const v = vehicleMap[l.vehicle_id];
        return v ? `${v.registration_number} (${v.model})` : `Vehicle #${l.vehicle_id}`;
      },
    },
    {
      header: "Volume (Liters)",
      render: (l) => `${l.liters.toLocaleString()} L`,
    },
    {
      header: "Total Cost",
      render: (l) => formatCurrency(l.cost),
    },
    {
      header: "Odometer",
      render: (l) => `${l.odometer.toLocaleString()} km`,
    },
    {
      header: "Fuel Date",
      render: (l) => new Date(l.fuel_date).toLocaleDateString(),
    },
    {
      header: "Notes / Station",
      render: (l) => l.notes || "—",
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fuel Refueling Logs</h1>
          <p className="page-subtitle">Track fuel consumption, pump transactions, & efficiency</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Record Fuel Log</span>
          </button>
        )}
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError("")} />}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess("")} />
      )}

      {/* Fuel KPI Header */}
      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard
          title="Total Fuel Volume"
          value={`${totalFuelLiters.toLocaleString()} L`}
          subtext="Cumulative fuel refueled"
          icon={Fuel}
          color="amber"
        />
        <StatCard
          title="Total Fuel Expense"
          value={formatCurrency(totalFuelCost)}
          subtext="Cumulative fuel expenditure"
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Avg Cost Per Liter"
          value={
            totalFuelLiters > 0
              ? formatCurrency(totalFuelCost / totalFuelLiters)
              : formatCurrency(0)
          }
          subtext="Unit rate benchmark"
          icon={Gauge}
          color="blue"
        />
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        searchPlaceholder="Search notes, vehicle..."
        customSearch={(item, term) => {
          if (!term) return true;
          const lower = term.toLowerCase();
          const v = vehicleMap[item.vehicle_id];
          return (
            (item.notes && item.notes.toLowerCase().includes(lower)) ||
            (v && v.registration_number.toLowerCase().includes(lower))
          );
        }}
        emptyMessage="No fuel logs recorded yet"
      />

      {/* Add Fuel Log Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Record Fuel Log"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Select Vehicle</label>
            <select
              className="form-select"
              value={formData.vehicle_id}
              onChange={(e) => {
                const selectedV = vehicleMap[e.target.value];
                setFormData({
                  ...formData,
                  vehicle_id: e.target.value,
                  odometer: selectedV ? String(selectedV.odometer) : formData.odometer,
                });
              }}
              required
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} - {v.model}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Liters Refueled</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                className="form-input"
                placeholder="e.g. 120"
                value={formData.liters}
                onChange={(e) =>
                  setFormData({ ...formData, liters: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Total Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="e.g. 185.50"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Current Odometer Reading (km)</label>
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

          <div className="form-group">
            <label className="form-label">Notes / Station Location</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Shell Interstate 95 (Receipt #9901)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {actionLoading ? "Submitting..." : "Save Fuel Entry"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default FuelLogsPage;
