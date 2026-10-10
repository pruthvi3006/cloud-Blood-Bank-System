import { useState } from "react";
import axios from "axios";
import { authHeaders } from "../services/auth.js";
import { apiUrl, downloadAuthFile } from "../services/api.js";

export default function MedicalReportUploader({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await axios.post(apiUrl("/api/profile/medical-report"), form, {
        headers: authHeaders(),
      });

      alert("Medical report uploaded successfully.");
      setFile(null);
      onUploaded?.();
    } catch (err) {
      console.error("Upload error details:", err);
      const errorMsg = err.response?.data?.message || err.message || "Unknown error";
      alert(`Upload failed: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadAuthFile("/api/profile/medical-report", "medical-report");
    } catch (err) {
      console.error(err);
      alert(err.message || "No medical report found or download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="card-section">
      <h3>Medical Report</h3>
      <input
        type="file"
        accept=".pdf,image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <div className="actions-row">
        <button disabled={!file || uploading} onClick={handleUpload}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <button onClick={handleDownload} disabled={downloading}>
          {downloading ? "Preparing..." : "Download existing report"}
        </button>
      </div>
    </div>
  );
}
