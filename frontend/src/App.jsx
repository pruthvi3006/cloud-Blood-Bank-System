import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import { getAuth, logout } from "./services/auth.js";

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  return (
    <div className="app-container">
      <header className="app-header">
        <Link to="/" className="brand brand-link">
          <img src="/logo.png" alt="Blood Bank Logo" className="brand-logo" />
          <h1>Cloud Blood Bank System</h1>
        </Link>
        <nav key={location.pathname}>
          <Link to="/">Home</Link>
          {auth ? (
            <>
              {auth.user.role === "USER" && (
                <Link to="/user">User Dashboard</Link>
              )}
              {auth.user.role === "ADMIN" && (
                <Link to="/admin">Admin Dashboard</Link>
              )}
              <button
                className="link-button"
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}

function RequireAuth({ children, role }) {
  const auth = getAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (role && auth.user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/user"
          element={
            <RequireAuth role="USER">
              <UserDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth role="ADMIN">
              <AdminDashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

