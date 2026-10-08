import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import VehiclesPage from "./pages/VehiclesPage";
import DriversPage from "./pages/DriversPage";
import TripsPage from "./pages/TripsPage";
import MaintenancePage from "./pages/MaintenancePage";
import FuelLogsPage from "./pages/FuelLogsPage";
import ExpensesPage from "./pages/ExpensesPage";
import VehicleDocumentsPage from "./pages/VehicleDocumentsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import RolesPage from "./pages/RolesPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import { NAV_PERMISSIONS } from "./utils/roleUtils";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={NAV_PERMISSIONS.dashboard}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vehicles"
              element={
                <ProtectedRoute allowedRoles={NAV_PERMISSIONS.vehicles}>
                  <VehiclesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/drivers"
              element={
                <ProtectedRoute allowedRoles={NAV_PERMISSIONS.drivers}>
                  <DriversPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/trips"
              element={
                <ProtectedRoute allowedRoles={NAV_PERMISSIONS.trips}>
                  <TripsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/maintenance"
              element={
                <ProtectedRoute allowedRoles={NAV_PERMISSIONS.maintenance}>
                  <MaintenancePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/fuel-logs"
              element={
                <ProtectedRoute allowedRoles={NAV_PERMISSIONS.fuel}>
                  <FuelLogsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/expenses"
              element={
                <ProtectedRoute allowedRoles={NAV_PERMISSIONS.expenses}>
                  <ExpensesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/documents"
              element={
                <ProtectedRoute allowedRoles={NAV_PERMISSIONS.documents}>
                  <VehicleDocumentsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={NAV_PERMISSIONS.analytics}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={NAV_PERMISSIONS.reports}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={NAV_PERMISSIONS.users}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/roles"
              element={
                <ProtectedRoute allowedRoles={NAV_PERMISSIONS.roles}>
                  <RolesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={NAV_PERMISSIONS.audit}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;