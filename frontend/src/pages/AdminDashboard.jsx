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
    latitude: "",
    longitude: "",
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
          latitude: parseFloat(bank.latitude),
          longitude: parseFloat(bank.longitude),
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

  return (
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
          <div className="form-inline">
            <input
              placeholder="Latitude"
              value={bank.latitude}
              onChange={(e) =>
                setBank({ ...bank, latitude: e.target.value })
              }
            />
            <input
              placeholder="Longitude"
              value={bank.longitude}
              onChange={(e) =>
                setBank({ ...bank, longitude: e.target.value })
              }
            />
          </div>
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
                {r.status === "PENDING" && (
                  <div className="actions-row">
                    <button onClick={() => changeStatus(r.id, "accept")}>
                      Accept
                    </button>
                    <button onClick={() => changeStatus(r.id, "reject")}>
                      Reject
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

