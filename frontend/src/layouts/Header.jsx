import React from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, User as UserIcon, Shield } from "lucide-react";
import "./Header.css";

export function Header() {
  const { user, roleName, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <span className="header-system-tag">Fleet Management System</span>
      </div>

      <div className="header-right">
        {user && (
          <div className="user-profile">
            <div className="user-avatar">
              <UserIcon size={18} />
            </div>
            <div className="user-details">
              <span className="user-name">{user.full_name || user.email}</span>
              <span className="user-role">
                <Shield size={10} style={{ marginRight: 3 }} />
                {roleName}
              </span>
            </div>
          </div>
        )}

        <button
          className="btn btn-secondary btn-sm logout-btn"
          onClick={logout}
          title="Sign Out"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
