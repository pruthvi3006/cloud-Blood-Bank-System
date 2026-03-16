import { useEffect, useState } from "react";
import axios from "axios";
import { authHeaders } from "../services/auth.js";
import MedicalReportUploader from "../components/MedicalReportUploader.jsx";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function UserDashboard() {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [cities, setCities] = useState([]);
  const [searchForm, setSearchForm] = useState({
    bloodGroup: "A+",
    city: "",
  });
  const [results, setResults] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
    loadRequests();
    loadCities();
  }, []);

  async function loadProfile() {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, {
        headers: authHeaders(),
      });
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function loadCities() {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/blood-banks/cities`,
        { headers: authHeaders() }
      );
      setCities(data);
      if (data.length > 0) {
        setSearchForm((f) => ({ ...f, city: data[0] }));
      }
    } catch (err) {
      console.error("Error loading cities:", err);
    } finally {
      setLoadingCities(false);
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

  async function search() {
    setError("");
    setResults([]);

    // Validation checks
    if (!searchForm.city) {
      setError("Please select a city");
      return;
    }

    if (!searchForm.bloodGroup) {
      setError("Please select a blood group");
      return;
    }

    setLoadingSearch(true);
    try {
      const params = new URLSearchParams({
        bloodGroup: searchForm.bloodGroup,
        city: searchForm.city,
      }).toString();

      console.log("Searching for blood banks:", params);

      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/blood-banks/search?${params}`,
        { headers: authHeaders() }
      );

      if (data.length === 0) {
        setError(
          `No blood banks with ${searchForm.bloodGroup} in stock found in ${searchForm.city}`
        );
      }
      setResults(data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Search failed";
      console.error("Search error:", err);
      setError(errorMsg);
    } finally {
      setLoadingSearch(false);
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
            City
            <select
              value={searchForm.city}
              onChange={(e) =>
                setSearchForm((f) => ({ ...f, city: e.target.value }))
              }
              disabled={loadingCities}
            >
              {loadingCities ? (
                <option>Loading cities...</option>
              ) : (
                cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))
              )}
            </select>
          </label>
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
            <button onClick={search} disabled={loadingSearch || loadingCities}>
              {loadingSearch ? "Searching..." : "Search"}
            </button>
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
                  {r.address}<br />
                  Phone: {r.contact_phone}<br />
                  Blood Group: {r.blood_group}, Units: {r.units_available}
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

