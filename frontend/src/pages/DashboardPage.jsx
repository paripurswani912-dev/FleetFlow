import React, { useEffect, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";
import Alert from "../components/Alert";
import { formatCurrency } from "../utils/formatters";
import {
  Truck,
  Users,
  Navigation,
  Percent,
  IndianRupee,
  PieChart as PieIcon,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/dashboard/summary");
      setData(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to load dashboard operational data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <div className="spinner" style={{ marginTop: "4rem" }} />;
  if (error)
    return (
      <div className="page-container">
        <Alert type="danger" message={error} />
      </div>
    );
  if (!data) return null;

  const vehicleStatusChartData = [
    { name: "Available", value: data.vehicles.available, color: "#10b981" },
    { name: "On Trip", value: data.vehicles.on_trip, color: "#2563eb" },
    { name: "In Shop", value: data.vehicles.in_shop, color: "#f59e0b" },
    { name: "Retired", value: data.vehicles.retired, color: "#64748b" },
  ];

  const tripStatusChartData = [
    { name: "Draft", count: data.trips.draft },
    { name: "Dispatched", count: data.trips.dispatched },
    { name: "Completed", count: data.trips.completed },
    { name: "Cancelled", count: data.trips.cancelled },
  ];

  const financialCostData = [
    { name: "Fuel Costs", cost: data.financials.fuel_cost },
    { name: "Maintenance", cost: data.financials.maintenance_cost },
    { name: "Other Expenses", cost: data.financials.other_expenses },
  ];

  const totalOperatingCost =
    data.financials.fuel_cost +
    data.financials.maintenance_cost +
    data.financials.other_expenses;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fleet Operations Overview</h1>
          <p className="page-subtitle">
            Operational summary and core performance metrics
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchDashboardData}>
            <Activity size={14} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="stat-grid">
        <StatCard
          title="Total Vehicles"
          value={data.vehicles.total}
          subtext={`${data.vehicles.available} Available • ${data.vehicles.on_trip} On Trip`}
          icon={Truck}
          color="blue"
        />
        <StatCard
          title="Active Drivers"
          value={data.drivers.total}
          subtext={`${data.drivers.on_trip} On Trip • ${data.drivers.available} Available`}
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Total Trips"
          value={data.trips.total}
          subtext={`${data.trips.completed} Completed • ${data.trips.dispatched} Active`}
          icon={Navigation}
          color="indigo"
        />
        <StatCard
          title="Fleet Utilization"
          value={`${data.fleet_utilization_percent}%`}
          subtext="Active vehicles vs total fleet"
          icon={Percent}
          color="amber"
        />
        <StatCard
          title="Total OpEx"
          value={formatCurrency(totalOperatingCost)}
          subtext="Fuel + Maintenance + Expenses"
          icon={IndianRupee}
          color="purple"
        />
      </div>

      {/* Visual Analytics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Fleet Distribution Pie */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Vehicle Status Breakdown</h3>
            <PieIcon size={18} color="var(--text-muted)" />
          </div>
          <div style={{ height: "260px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleStatusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {vehicleStatusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trips Lifecycle Bar Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Trip Operations Lifecycle</h3>
            <Navigation size={18} color="var(--text-muted)" />
          </div>
          <div style={{ height: "260px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tripStatusChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Distribution Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Operating Expenditure Breakdown</h3>
            <IndianRupee size={18} color="var(--text-muted)" />
          </div>
          <div style={{ height: "260px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialCostData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
