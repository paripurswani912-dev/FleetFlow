import React, { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import Alert from "../components/Alert";
import StatCard from "../components/StatCard";
import { formatCurrency } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";
import { Plus, Receipt, IndianRupee, Tag } from "lucide-react";

export function ExpensesPage() {
  const { roleId } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    vehicle_id: "",
    trip_id: "",
    category: "Tolls",
    amount: "",
    description: "",
  });

  const canManage = [1, 4, 5].includes(roleId);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [eRes, vRes, tRes] = await Promise.all([
        api.get("/expenses/"),
        api.get("/vehicles/"),
        api.get("/trips/"),
      ]);
      setExpenses(eRes.data);
      setVehicles(vRes.data);
      setTrips(tRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load expense records.");
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
      trip_id: "",
      category: "Tolls",
      amount: "",
      description: "",
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
        trip_id: formData.trip_id ? parseInt(formData.trip_id, 10) : null,
        category: formData.category.trim(),
        amount: parseFloat(formData.amount),
        description: formData.description ? formData.description.trim() : null,
      };

      await api.post("/expenses/", payload);
      setSuccess("Expense entry logged successfully.");
      setIsAddOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to log expense.");
    } finally {
      setActionLoading(false);
    }
  };

  const vehicleMap = vehicles.reduce((acc, v) => {
    acc[v.id] = v;
    return acc;
  }, {});

  const totalExpenseAmount = expenses.reduce((acc, item) => acc + item.amount, 0);

  const columns = [
    {
      header: "Expense ID",
      accessor: "id",
      render: (e) => (
        <span style={{ fontWeight: 600, color: "var(--primary)" }}>#{e.id}</span>
      ),
    },
    {
      header: "Vehicle",
      render: (e) => {
        const v = vehicleMap[e.vehicle_id];
        return v ? `${v.registration_number} (${v.model})` : `Vehicle #${e.vehicle_id}`;
      },
    },
    {
      header: "Trip ID",
      render: (e) => (e.trip_id ? `#${e.trip_id}` : "General Fleet"),
    },
    { header: "Category", accessor: "category" },
    {
      header: "Amount",
      render: (e) => (
        <span style={{ fontWeight: 600 }}>{formatCurrency(e.amount)}</span>
      ),
    },
    { header: "Description", accessor: "description" },
    {
      header: "Date Logged",
      render: (e) => new Date(e.expense_date).toLocaleDateString(),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Operational Expenses</h1>
          <p className="page-subtitle">Track tolls, permits, driver allowances, & incidental costs</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Record Expense</span>
          </button>
        )}
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError("")} />}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess("")} />
      )}

      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard
          title="Total Operational Expenses"
          value={formatCurrency(totalExpenseAmount)}
          subtext="Cumulative expense total"
          icon={IndianRupee}
          color="purple"
        />
        <StatCard
          title="Total Transactions"
          value={expenses.length}
          subtext="Log count"
          icon={Receipt}
          color="blue"
        />
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        searchPlaceholder="Search category, description..."
        customSearch={(item, term) => {
          if (!term) return true;
          const lower = term.toLowerCase();
          const v = vehicleMap[item.vehicle_id];
          return (
            item.category.toLowerCase().includes(lower) ||
            (item.description && item.description.toLowerCase().includes(lower)) ||
            (v && v.registration_number.toLowerCase().includes(lower))
          );
        }}
        emptyMessage="No operational expenses recorded"
      />

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Record Operational Expense"
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
                  {v.registration_number} - {v.model}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Associated Trip (Optional)</label>
              <select
                className="form-select"
                value={formData.trip_id}
                onChange={(e) =>
                  setFormData({ ...formData, trip_id: e.target.value })
                }
              >
                <option value="">-- General / Non-Trip Expense --</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    Trip #{t.id}: {t.source} to {t.destination}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="Tolls">Highway Tolls</option>
                <option value="Permits">Transit Permits & Customs</option>
                <option value="Driver Allowance">Driver Meals & Lodging</option>
                <option value="Parking">Parking & Depot Fees</option>
                <option value="Cleaning">Vehicle Sanitation / Wash</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Expense Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              placeholder="e.g. 750.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Details</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Turn-pike toll receipt #1049"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
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
              {actionLoading ? "Submitting..." : "Save Expense"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ExpensesPage;
