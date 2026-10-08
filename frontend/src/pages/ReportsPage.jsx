import React, { useState } from "react";
import api from "../services/api";
import Alert from "../components/Alert";
import { useAuth } from "../context/AuthContext";
import {
  Download,
  Truck,
  Users,
  Navigation,
  Fuel,
  Receipt,
  Wrench,
  IndianRupee,
} from "lucide-react";

export function ReportsPage() {
  const { roleId } = useAuth();
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reportsList = [
    {
      id: "vehicles",
      title: "Vehicles Master Report",
      description: "Complete inventory of all vehicles, capacities, odometer readings, status, & acquisition costs.",
      endpoint: "/reports/vehicles",
      filename: "fleetflow_vehicles_report.csv",
      icon: Truck,
      color: "#2563eb",
      allowedRoles: [1, 3, 5],
    },
    {
      id: "drivers",
      title: "Drivers Compliance Report",
      description: "Driver directory, license details, expiry tracking, contact info, & safety scores.",
      endpoint: "/reports/drivers",
      filename: "fleetflow_drivers_report.csv",
      icon: Users,
      color: "#10b981",
      allowedRoles: [1, 3, 5],
    },
    {
      id: "trips",
      title: "Trips & Operations Log",
      description: "All trip records, routes, assigned vehicles & drivers, weight, distance, revenue, & status.",
      endpoint: "/reports/trips",
      filename: "fleetflow_trips_report.csv",
      icon: Navigation,
      color: "#4f46e5",
      allowedRoles: [1, 4, 5],
    },
    {
      id: "fuel",
      title: "Fuel Consumption Audit",
      description: "Detailed fuel refueling logs, volumes, odometer checkpoints, & station costs.",
      endpoint: "/reports/fuel",
      filename: "fleetflow_fuel_report.csv",
      icon: Fuel,
      color: "#f59e0b",
      allowedRoles: [1, 4, 5],
    },
    {
      id: "expenses",
      title: "Incidental Expenses Log",
      description: "All operational expenses, toll breakdown, permits, driver allowances, & categories.",
      endpoint: "/reports/expenses",
      filename: "fleetflow_expenses_report.csv",
      icon: Receipt,
      color: "#9333ea",
      allowedRoles: [1, 4, 5],
    },
    {
      id: "maintenance",
      title: "Maintenance & Repairs Audit",
      description: "Service history, repair categories, maintenance costs, and downtime records.",
      endpoint: "/reports/maintenance",
      filename: "fleetflow_maintenance_report.csv",
      icon: Wrench,
      color: "#ef4444",
      allowedRoles: [1, 3, 5],
    },
    {
      id: "financial",
      title: "Financial & P&L Statement",
      description: "Executive summary statement of revenue, operating expenses, net profit, & fleet ROI.",
      endpoint: "/reports/financial",
      filename: "fleetflow_financial_report.csv",
      icon: IndianRupee,
      color: "#059669",
      allowedRoles: [4, 5],
    },
  ];

  const visibleReports = reportsList.filter((report) =>
    report.allowedRoles.includes(roleId)
  );

  const handleDownloadReport = async (report) => {
    setDownloading(report.id);
    setError("");
    setSuccess("");

    try {
      const response = await api.get(report.endpoint, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", report.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(`Report "${report.title}" downloaded successfully.`);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError("Access Denied: You do not have permission to download this report.");
      } else {
        setError(`Failed to download report "${report.title}".`);
      }
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations & CSV Reports</h1>
          <p className="page-subtitle">Export official data reports & financial statements</p>
        </div>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError("")} />}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess("")} />
      )}

      {visibleReports.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontWeight: 500, margin: 0 }}>
            No report exports available for your user account role.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {visibleReports.map((report) => {
            const Icon = report.icon;
            const isDownloadingThis = downloading === report.id;

            return (
              <div key={report.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: `${report.color}15`,
                      color: report.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                      {report.title}
                    </h3>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
                      CSV Export Format
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", flex: 1, marginBottom: "1.25rem" }}>
                  {report.description}
                </p>

                <button
                  className="btn btn-secondary"
                  onClick={() => handleDownloadReport(report)}
                  disabled={Boolean(downloading)}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {isDownloadingThis ? (
                    <span>Generating CSV...</span>
                  ) : (
                    <>
                      <Download size={16} color={report.color} />
                      <span>Download CSV Report</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
