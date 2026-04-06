import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { saveAuth } from "../services/auth.js";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

 async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password });
      saveAuth(data);
      if (data.user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/user");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <h2>Login</h2>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit">Login</button>
        </form>
        <p style={{ marginTop: "1.5rem" }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
      <div className="auth-hero">
        <img src="/hero.png" alt="Blood Donation Hero" />
      </div>
    </div>
  );
}

