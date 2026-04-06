import { useEffect, useState } from "react";
import axios from "axios";
import { authHeaders } from "../services/auth.js";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function AdminDashboard() {
  const [bank, setBank] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    contact_phone: "",
  });
  const [stock, setStock] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    loadBank();
    loadStock();
    loadRequests();
  }, []);

  async function loadBank() {
    try {
      const { data } = await axios.post(
        "/api/admin/blood-bank",
        {},
        { headers: authHeaders() }
      );
      setBank({
        ...bank,
        ...data,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function saveBank(e) {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/blood-bank`,
        {
          name: bank.name,
          address: bank.address,
          city: bank.city,
          state: bank.state,
          pincode: bank.pincode,
          contact_phone: bank.contact_phone,
        },
        { headers: authHeaders() }
      );
      setBank({ ...bank, ...data });
      alert("Blood bank profile saved");
    } catch (err) {
      console.error(err);
      alert("Failed to save blood bank profile");
    }
  }

  async function loadStock() {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stock`, {
        headers: authHeaders(),
      });
      setStock(data);
    } catch (err) {
      console.error(err);
    }
  }

  function unitsForGroup(bg) {
    const row = stock.find((s) => s.blood_group === bg);
    return row ? row.units_available : 0;
  }

  async function saveStock() {
    try {
      const items = BLOOD_GROUPS.map((bg) => ({
        blood_group: bg,
        units_available: Number(
          document.getElementById(`stock-${bg}`).value || 0
        ),
      }));
      const { data } = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/stock`,
        { items },
        { headers: authHeaders() }
      );
      setStock(data);
      alert("Stock updated");
    } catch (err) {
      console.error(err);
      alert("Failed to update stock");
    }
  }

  async function loadRequests() {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/requests`, {
        headers: authHeaders(),
      });
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function changeStatus(id, action) {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/requests/${id}/${action}`,
        {},
        { headers: authHeaders() }
      );
      await loadRequests();
    } catch (err) {
      console.error(err);
      alert("Failed to update request");
    }
  }

  async function downloadMedicalReport(userId) {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/medical-report`,
        { headers: authHeaders() }
      );
      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to download medical report");
    }
  }

  const totalStock = stock.reduce((sum, item) => sum + Number(item.units_available || 0), 0);
  const pendingRequests = requests.filter(r => r.status === "PENDING").length;

  return (
    <div className="dashboard-container">
      <div className="dashboard-banner">
        <img src="/images/admin_banner.png" alt="Blood Bank Cover" />
        <div className="dashboard-banner-overlay">
          <h2>{bank.name ? `${bank.name} Dashboard` : "Blood Bank Portal"}</h2>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card red">
          <div className="stat-icon">🩸</div>
          <div className="stat-info">
            <h4>Total Units in Stock</h4>
            <p>{totalStock}</p>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">🔔</div>
          <div className="stat-info">
            <h4>Pending Requests</h4>
            <p>{pendingRequests}</p>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🏥</div>
          <div className="stat-info">
            <h4>Location</h4>
            <p style={{fontSize:"1.2rem"}}>{bank.city || "Not Set"}</p>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Blood Bank Profile</h2>
        <form className="form" onSubmit={saveBank}>
          <label>
            Name
            <input
              value={bank.name}
              onChange={(e) => setBank({ ...bank, name: e.target.value })}
              required
            />
          </label>
          <label>
            Address
            <input
              value={bank.address}
              onChange={(e) => setBank({ ...bank, address: e.target.value })}
            />
          </label>
          <label>
            City
            <input
              value={bank.city}
              onChange={(e) => setBank({ ...bank, city: e.target.value })}
            />
          </label>
          <label>
            State
            <input
              value={bank.state}
              onChange={(e) => setBank({ ...bank, state: e.target.value })}
            />
          </label>
          <label>
            Pincode
            <input
              value={bank.pincode}
              onChange={(e) => setBank({ ...bank, pincode: e.target.value })}
            />
          </label>
          <label>
            Contact phone
            <input
              value={bank.contact_phone}
              onChange={(e) =>
                setBank({ ...bank, contact_phone: e.target.value })
              }
            />
          </label>
          <button type="submit">Save blood bank</button>
        </form>
      </div>

      <div className="card">
        <h2>Stock & Requests</h2>
        <div className="card-section">
          <h3>Blood Stock</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              {BLOOD_GROUPS.map((bg) => (
                <tr key={bg}>
                  <td>{bg}</td>
                  <td>
                    <input
                      id={`stock-${bg}`}
                      type="number"
                      min="0"
                      defaultValue={unitsForGroup(bg)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={saveStock}>Save stock</button>
        </div>
        <div className="card-section">
          <h3>Incoming Requests</h3>
          {requests.length === 0 && <p>No requests yet.</p>}
          <ul className="list">
            {requests.map((r) => (
              <li key={r.id} className="list-item">
                <div>
                  <strong>{r.user_name || "User"}</strong> ({r.user_city}) -{" "}
                  {r.blood_group} ({r.required_units} unit) -{" "}
                  <span className={`badge badge-${r.status.toLowerCase()}`}>
                    {r.status}
                  </span>
                </div>
                  <div className="actions-row">
                    {r.has_medical_report === 1 && (
                      <button onClick={() => downloadMedicalReport(r.user_id)} style={{background: "#0ea5e9"}}>
                        📄 View Report
                      </button>
                    )}
                    {r.status === "PENDING" && (
                      <>
                        <button onClick={() => changeStatus(r.id, "accept")}>
                          Accept
                        </button>
                        <button onClick={() => changeStatus(r.id, "reject")}>
                          Reject
                        </button>
                      </>
                    )}
                  </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
    </div>
  );
}

