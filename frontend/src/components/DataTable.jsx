import React, { useState } from "react";
import { Search, Inbox } from "lucide-react";

export function DataTable({
  columns,
  data = [],
  loading = false,
  searchPlaceholder = "Search...",
  searchField,
  onSearch,
  customSearch,
  filters,
  activeFilter,
  onFilterChange,
  emptyMessage = "No records found",
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearch) onSearch(val);
  };

  const filteredData = data.filter((item) => {
    // Custom filter function
    if (customSearch) {
      if (!customSearch(item, searchTerm)) return false;
    } else if (searchTerm && searchField) {
      const fieldVal = String(item[searchField] || "").toLowerCase();
      if (!fieldVal.includes(searchTerm.toLowerCase())) return false;
    } else if (searchTerm) {
      // Default: check all string properties
      const matches = Object.values(item).some((val) =>
        String(val || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!matches) return false;
    }

    if (activeFilter && activeFilter !== "all" && item.status) {
      if (item.status.toLowerCase() !== activeFilter.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="table-container">
      <div className="table-toolbar">
        <div className="table-search">
          <Search size={16} className="table-search-icon" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {filters && filters.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {filters.map((f) => (
              <button
                key={f.key}
                className={`filter-pill ${
                  activeFilter === f.key ? "active" : ""
                }`}
                onClick={() => onFilterChange && onFilterChange(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="spinner" />
        ) : filteredData.length === 0 ? (
          <div className="empty-state">
            <Inbox size={40} className="empty-icon" />
            <p style={{ fontWeight: 500, margin: 0 }}>{emptyMessage}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} style={{ width: col.width || "auto" }}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, rowIdx) => (
                <tr key={row.id || rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default DataTable;
