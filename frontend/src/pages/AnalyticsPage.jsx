import React, { useEffect, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";
import Alert from "../components/Alert";
import DataTable from "../components/DataTable";
import { formatCurrency } from "../utils/formatters";
import {
  TrendingUp,
  IndianRupee,
  PieChart as PieIcon,
  BarChart3,
  Percent,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function AnalyticsPage() {
  const [financialSummary, setFinancialSummary] = useState(null);
  const [fuelEfficiency, setFuelEfficiency] = useState([]);
  const [roiData, setRoiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const [finRes, fuelRes, roiRes] = await Promise.all([
        api.get("/analytics/financial-summary"),
        api.get("/analytics/fuel-efficiency"),
        api.get("/analytics/roi"),
      ]);

      setFinancialSummary(finRes.data);
      setFuelEfficiency(fuelRes.data?.vehicles || []);
      setRoiData(roiRes.data?.vehicles || []);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to load financial & operational analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return <div className="spinner" style={{ marginTop: "4rem" }} />;
  if (error)
    return (
      <div className="page-container">
        <Alert type="danger" message={error} />
      </div>
    );

  const fin = financialSummary;

  const financialBarData = [
    {
      category: "Financials",
      Revenue: fin?.revenue?.total_revenue || 0,
      "Operating Cost": fin?.costs?.operating_cost || 0,
      Expenses: fin?.costs?.other_expenses || 0,
      "Net Profit": fin?.profitability?.net_profit || 0,
    },
  ];

  const vehicleRoiColumns = [
    {
      header: "Reg Number",
      accessor: "registration_number",
      render: (r) => (
        <span style={{ fontWeight: 600 }}>{r.registration_number}</span>
      ),
    },
    {
      header: "Acquisition Cost",
      render: (r) => formatCurrency(r.acquisition_cost),
    },
    {
      header: "Revenue Generated",
      render: (r) => formatCurrency(r.revenue),
    },
    {
      header: "Total OpEx",
      render: (r) => formatCurrency(r.operating_cost),
    },
    {
      header: "Net Return",
      render: (r) => (
        <span
          style={{
            fontWeight: 600,
            color: r.net_return >= 0 ? "var(--success-text)" : "var(--danger-text)",
          }}
        >
          {formatCurrency(r.net_return)}
        </span>
      ),
    },
    {
      header: "Asset ROI %",
      render: (r) => (
        <span style={{ fontWeight: 700, color: "var(--primary)" }}>
          {r.roi_percent !== null ? `${r.roi_percent}%` : "N/A"}
        </span>
      ),
    },
  ];

  const fuelColumns = [
    {
      header: "Reg Number",
      accessor: "registration_number",
      render: (r) => (
        <span style={{ fontWeight: 600 }}>{r.registration_number}</span>
      ),
    },
    {
      header: "Distance (km)",
      render: (r) => `${r.distance_travelled.toLocaleString()} km`,
    },
    {
      header: "Fuel Consumed",
      render: (r) => `${r.fuel_consumed.toLocaleString()} L`,
    },
    {
      header: "Fuel Efficiency",
      render: (r) =>
        r.fuel_efficiency_km_per_litre !== null ? (
          <span style={{ fontWeight: 600, color: "#0284c7" }}>
            {r.fuel_efficiency_km_per_litre} km/L
          </span>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
            Insufficient Logs (&lt; 2 logs)
          </span>
        ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Analytics & Financial Summary</h1>
          <p className="page-subtitle">P&L metrics, asset ROI, fuel economy, & fleet performance</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard
          title="Total Completed Revenue"
          value={formatCurrency(fin?.revenue?.total_revenue || 0)}
          subtext={`${fin?.revenue?.completed_trips || 0} completed trips`}
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Total Overall Cost"
          value={formatCurrency(fin?.costs?.total_overall_cost || 0)}
          subtext={`Fuel: ${formatCurrency(fin?.costs?.fuel_cost || 0)} • Maint: ${formatCurrency(
            fin?.costs?.maintenance_cost || 0
          )}`}
          icon={BarChart3}
          color="amber"
        />
        <StatCard
          title="Net Profitability"
          value={formatCurrency(fin?.profitability?.net_profit || 0)}
          subtext="Revenue minus all operating & expenses"
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Fleet Asset ROI"
          value={
            fin?.profitability?.fleet_roi_percent !== null
              ? `${fin?.profitability?.fleet_roi_percent}%`
              : "N/A"
          }
          subtext="Net return on fleet acquisition cost"
          icon={Percent}
          color="blue"
        />
      </div>

      {/* Financial Bar Chart */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <h3 className="card-title">Financial Overview (Revenue vs Cost vs Profit)</h3>
          <PieIcon size={18} color="var(--text-muted)" />
        </div>
        <div style={{ height: "300px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="category" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip formatter={(val) => formatCurrency(val)} />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Operating Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Net Profit" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vehicle ROI Table */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          Vehicle Return on Investment (ROI)
        </h3>
        <DataTable
          columns={vehicleRoiColumns}
          data={roiData}
          loading={loading}
          searchPlaceholder="Search vehicle registration..."
          searchField="registration_number"
          emptyMessage="No vehicle ROI records computed"
        />
      </div>

      {/* Fuel Efficiency Table */}
      <div>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          Vehicle Fuel Efficiency (km/L)
        </h3>
        <DataTable
          columns={fuelColumns}
          data={fuelEfficiency}
          loading={loading}
          searchPlaceholder="Search vehicle registration..."
          searchField="registration_number"
          emptyMessage="No fuel efficiency records computed"
        />
      </div>
    </div>
  );
}

export default AnalyticsPage;
