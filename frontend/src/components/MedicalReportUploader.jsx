import { useState } from "react";
import axios from "axios";
import { authHeaders } from "../services/auth.js";

export default function MedicalReportUploader() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/profile/medical-report/upload-url`,
        { contentType: file.type || "application/octet-stream" },
        { headers: authHeaders() }
      );
      await axios.put(data.uploadUrl, file, {
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      alert("Medical report uploaded.");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/profile/medical-report/download-url`,
        { headers: authHeaders() }
      );
      window.open(data.downloadUrl, "_blank");
    } catch (err) {
      console.error(err);
      alert("No medical report found or download failed");
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

