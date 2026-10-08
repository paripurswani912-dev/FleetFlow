import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasAnyRole, NAV_PERMISSIONS } from "../utils/roleUtils";
import {
  LayoutDashboard,
  Truck,
  Users,
  Navigation,
  Wrench,
  Fuel,
  Receipt,
  FileText,
  BarChart3,
  Download,
  UserCog,
  Shield,
  History,
  ChevronRight,
} from "lucide-react";
import "./Sidebar.css";

export function Sidebar() {
  const { roleId } = useAuth();

  const isDriver = roleId === 2;

  const sections = [
    {
      title: "Main",
      items: [
        {
          label: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
          roles: NAV_PERMISSIONS.dashboard,
        },
      ],
    },
    {
      title: "Fleet",
      items: [
        {
          label: "Vehicles",
          path: "/vehicles",
          icon: Truck,
          roles: NAV_PERMISSIONS.vehicles,
        },
        {
          label: "Drivers",
          path: "/drivers",
          icon: Users,
          roles: NAV_PERMISSIONS.drivers,
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          label: isDriver ? "My Trips" : "Trips",
          path: "/trips",
          icon: Navigation,
          roles: NAV_PERMISSIONS.trips,
        },
        {
          label: "Maintenance",
          path: "/maintenance",
          icon: Wrench,
          roles: NAV_PERMISSIONS.maintenance,
        },
        {
          label: "Fuel Logs",
          path: "/fuel-logs",
          icon: Fuel,
          roles: NAV_PERMISSIONS.fuel,
        },
        {
          label: "Expenses",
          path: "/expenses",
          icon: Receipt,
          roles: NAV_PERMISSIONS.expenses,
        },
      ],
    },
    {
      title: "Documents",
      items: [
        {
          label: "Vehicle Documents",
          path: "/documents",
          icon: FileText,
          roles: NAV_PERMISSIONS.documents,
        },
      ],
    },
    {
      title: "Analytics & Reports",
      items: [
        {
          label: "Analytics",
          path: "/analytics",
          icon: BarChart3,
          roles: NAV_PERMISSIONS.analytics,
        },
        {
          label: "Reports",
          path: "/reports",
          icon: Download,
          roles: NAV_PERMISSIONS.reports,
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          label: "Users",
          path: "/users",
          icon: UserCog,
          roles: NAV_PERMISSIONS.users,
        },
        {
          label: "Roles",
          path: "/roles",
          icon: Shield,
          roles: NAV_PERMISSIONS.roles,
        },
        {
          label: "Audit Logs",
          path: "/audit-logs",
          icon: History,
          roles: NAV_PERMISSIONS.audit,
        },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Truck size={22} color="#ffffff" />
        </div>
        <div className="brand-text">
          <span className="brand-name">FleetFlow</span>
          <span className="brand-sub">Operations Pro</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section, idx) => {
          const visibleItems = section.items.filter((item) =>
            hasAnyRole(roleId, item.roles)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="nav-section">
              <span className="nav-section-title">{section.title}</span>
              <ul className="nav-list">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `nav-link ${isActive ? "active" : ""}`
                        }
                      >
                        <Icon size={18} className="nav-icon" />
                        <span className="nav-label">{item.label}</span>
                        <ChevronRight size={14} className="nav-arrow" />
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
