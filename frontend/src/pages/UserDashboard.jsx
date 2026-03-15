import { useEffect, useState } from "react";
import axios from "axios";
import { authHeaders } from "../services/auth.js";
import MedicalReportUploader from "../components/MedicalReportUploader.jsx";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function UserDashboard() {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [searchForm, setSearchForm] = useState({
    bloodGroup: "A+",
    lat: "",
    lng: "",
  });
  const [results, setResults] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
    loadRequests();
  }, []);

  async function loadProfile() {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, {
        headers: authHeaders(),
      });
      setProfile(data);
      setSearchForm((f) => ({
        ...f,
        lat: data.latitude || "",
        lng: data.longitude || "",
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function loadRequests() {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/requests`, {
        headers: authHeaders(),
      });
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function updateProfileLocation() {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/profile`,
        {
          latitude: parseFloat(searchForm.lat),
          longitude: parseFloat(searchForm.lng),
        },
        { headers: authHeaders() }
      );
      await loadProfile();
      alert("Location updated");
    } catch (err) {
      console.error(err);
      alert("Failed to update location");
    }
  }

  async function useBrowserLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported in this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setSearchForm((f) => ({ ...f, lat, lng }));
      },
      () => {
        alert("Could not get location");
      }
    );
  }

  async function search() {
    setError("");
    try {
      const params = new URLSearchParams({
        bloodGroup: searchForm.bloodGroup,
        lat: searchForm.lat,
        lng: searchForm.lng,
      }).toString();
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/blood-banks/search?${params}`, {
        headers: authHeaders(),
      });
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.message || "Search failed");
    }
  }

  async function createRequest(bankId, bloodGroup) {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/requests`,
        { blood_bank_id: bankId, blood_group: bloodGroup, required_units: 1 },
        { headers: authHeaders() }
      );
      alert("Request created");
      await loadRequests();
    } catch (err) {
      console.error(err);
      alert("Failed to create request");
    }
  }

  return (
    <div className="grid-2">
      <div className="card">
        <h2>User Profile</h2>
        {loadingProfile ? (
          <p>Loading...</p>
        ) : profile ? (
          <>
            <p>
              <strong>Name:</strong> {profile.name || "-"}
            </p>
            <p>
              <strong>Email:</strong> {profile.email}
            </p>
            <p>
              <strong>Location:</strong>{" "}
              {profile.latitude && profile.longitude
                ? `${profile.latitude}, ${profile.longitude}`
                : "Not set"}
            </p>
            <div className="card-section">
              <h3>Set Location</h3>
              <div className="form-inline">
                <input
                  placeholder="Latitude"
                  value={searchForm.lat}
                  onChange={(e) =>
                    setSearchForm((f) => ({ ...f, lat: e.target.value }))
                  }
                />
                <input
                  placeholder="Longitude"
                  value={searchForm.lng}
                  onChange={(e) =>
                    setSearchForm((f) => ({ ...f, lng: e.target.value }))
                  }
                />
              </div>
              <div className="actions-row">
                <button onClick={useBrowserLocation}>Use my location</button>
                <button onClick={updateProfileLocation}>Save location</button>
              </div>
            </div>
            <MedicalReportUploader />
          </>
        ) : (
          <p>Could not load profile.</p>
        )}
      </div>

      <div className="card">
        <h2>Search Blood</h2>
        <div className="card-section">
          <label>
            Blood group
            <select
              value={searchForm.bloodGroup}
              onChange={(e) =>
                setSearchForm((f) => ({ ...f, bloodGroup: e.target.value }))
              }
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </label>
          <div className="actions-row">
            <button onClick={search}>Search nearby blood banks</button>
          </div>
          {error && <div className="error">{error}</div>}
        </div>
        <div className="card-section">
          <h3>Results</h3>
          {results.length === 0 && <p>No results yet.</p>}
          <ul className="list">
            {results.map((r) => (
              <li key={`${r.id}-${r.blood_group}`} className="list-item">
                <div>
                  <strong>{r.name}</strong> ({r.city}, {r.state})<br />
                  Group {r.blood_group}, Units: {r.units_available}, Distance:{" "}
                  {r.distance.toFixed(1)} km
                </div>
                <button onClick={() => createRequest(r.id, r.blood_group)}>
                  Request
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-section">
          <h3>My Requests</h3>
          {requests.length === 0 && <p>No requests yet.</p>}
          <ul className="list">
            {requests.map((r) => (
              <li key={r.id} className="list-item">
                <div>
                  To <strong>{r.blood_bank_name}</strong> ({r.blood_bank_city}) -{" "}
                  {r.blood_group} ({r.required_units} unit)
                </div>
                <span className={`badge badge-${r.status.toLowerCase()}`}>
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

