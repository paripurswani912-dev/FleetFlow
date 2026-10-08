import React, { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import Alert from "../components/Alert";
import { useAuth } from "../context/AuthContext";
import { Plus, FileText, Upload, Download, AlertTriangle, ExternalLink } from "lucide-react";

export function VehicleDocumentsPage() {
  const { roleId } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [vehicleId, setVehicleId] = useState("");
  const [documentType, setDocumentType] = useState("Registration Certificate");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const canManage = [1, 3, 5].includes(roleId);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [dRes, vRes] = await Promise.all([
        api.get("/vehicle-documents/"),
        api.get("/vehicles/"),
      ]);
      setDocuments(dRes.data);
      setVehicles(vRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load vehicle documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenUpload = () => {
    setVehicleId("");
    setDocumentType("Registration Certificate");
    setExpiryDate("");
    setSelectedFile(null);
    setError("");
    setIsUploadOpen(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("vehicle_id", vehicleId);
      formData.append("document_type", documentType);
      if (expiryDate) {
        formData.append("expiry_date", expiryDate);
      }
      formData.append("file", selectedFile);

      await api.post("/vehicle-documents/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Vehicle document uploaded successfully.");
      setIsUploadOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload document.");
    } finally {
      setActionLoading(false);
    }
  };

  const vehicleMap = vehicles.reduce((acc, v) => {
    acc[v.id] = v;
    return acc;
  }, {});

  const isExpired = (expiryStr) => {
    if (!expiryStr) return false;
    return new Date(expiryStr) < new Date();
  };

  const columns = [
    {
      header: "Doc ID",
      accessor: "id",
      render: (doc) => (
        <span style={{ fontWeight: 600, color: "var(--primary)" }}>#{doc.id}</span>
      ),
    },
    {
      header: "Vehicle",
      render: (doc) => {
        const v = vehicleMap[doc.vehicle_id];
        return v ? `${v.registration_number} (${v.model})` : `Vehicle #${doc.vehicle_id}`;
      },
    },
    {
      header: "Document Type",
      render: (doc) => (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <FileText size={16} color="var(--primary)" />
          <span style={{ fontWeight: 500 }}>{doc.document_type}</span>
        </div>
      ),
    },
    { header: "File Name", accessor: "file_name" },
    {
      header: "Expiry Date",
      render: (doc) => {
        if (!doc.expiry_date) return "No Expiry";
        const expired = isExpired(doc.expiry_date);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span>{doc.expiry_date}</span>
            {expired && (
              <span
                style={{ color: "#ef4444", fontSize: "0.75rem", fontWeight: 600 }}
                title="Document Expired"
              >
                <AlertTriangle size={13} /> Expired
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Upload Date",
      render: (doc) => new Date(doc.uploaded_at).toLocaleDateString(),
    },
    {
      header: "File Access",
      render: (doc) => (
        <a
          href={`http://127.0.0.1:8000/${doc.file_path}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ textDecoration: "none" }}
        >
          <ExternalLink size={13} />
          <span>View File</span>
        </a>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicle Documents Vault</h1>
          <p className="page-subtitle">Store, verify, and track insurance, registration, & safety compliance</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={handleOpenUpload}>
            <Upload size={16} />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError("")} />}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess("")} />
      )}

      <DataTable
        columns={columns}
        data={documents}
        loading={loading}
        searchPlaceholder="Search document type, file name..."
        customSearch={(item, term) => {
          if (!term) return true;
          const lower = term.toLowerCase();
          const v = vehicleMap[item.vehicle_id];
          return (
            item.document_type.toLowerCase().includes(lower) ||
            item.file_name.toLowerCase().includes(lower) ||
            (v && v.registration_number.toLowerCase().includes(lower))
          );
        }}
        emptyMessage="No vehicle documents uploaded"
      />

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Vehicle Document"
      >
        <form onSubmit={handleUploadSubmit}>
          <div className="form-group">
            <label className="form-label">Select Vehicle</label>
            <select
              className="form-select"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
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

          <div className="form-group">
            <label className="form-label">Document Type</label>
            <select
              className="form-select"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              required
            >
              <option value="Registration Certificate">Registration Certificate (RC)</option>
              <option value="Insurance Policy">Insurance Policy</option>
              <option value="Safety Inspection">Safety Inspection Certificate</option>
              <option value="Pollution Certificate">Pollution / Emission Clearance (PUC)</option>
              <option value="Permit">State / Interstate Permit</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Expiry Date (Optional)</label>
            <input
              type="date"
              className="form-input"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Upload File (PDF, JPG, PNG)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="form-input"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              required
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", display: "block" }}>
              Accepted formats: PDF, JPG, JPEG, PNG (Max 10MB)
            </span>
          </div>

          <div className="modal-footer" style={{ padding: 0, marginTop: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsUploadOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default VehicleDocumentsPage;
