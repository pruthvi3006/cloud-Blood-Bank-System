import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { saveAuth } from "../services/auth.js";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "USER",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, form);
      saveAuth(data);
      if (data.user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/user");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <h2>Register</h2>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </label>
          <label>
            Role
            <select
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
            >
              <option value="USER">User (Need Blood)</option>
              <option value="ADMIN">Blood Bank Admin</option>
            </select>
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit">Create account</button>
        </form>
        <p style={{ marginTop: "1.5rem" }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
      <div className="auth-hero">
        <img src="/hero.png" alt="Blood Donation Hero" />
      </div>
    </div>
  );
}

