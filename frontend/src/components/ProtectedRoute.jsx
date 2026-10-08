import React from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasAnyRole } from "../utils/roleUtils";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, roleId } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const isPermitted = hasAnyRole(roleId, allowedRoles);
    if (!isPermitted) {
      return (
        <div
          className="page-container"
          style={{
            textAlign: "center",
            padding: "5rem 1rem",
            maxWidth: "540px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              border: "1px solid #fecaca",
            }}
          >
            <ShieldAlert size={40} />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--text-main)" }}>
            403 — Access Denied
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.6 }}>
            You do not have administrative authorization to access this module. If you believe this is an error, contact your System Administrator.
          </p>
          <Link to="/dashboard" className="btn btn-primary" style={{ display: "inline-flex" }}>
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      );
    }
  }

  return children;
}

export default ProtectedRoute;
