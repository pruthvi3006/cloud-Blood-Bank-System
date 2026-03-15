import { Routes, Route, Navigate, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import { getAuth, logout } from "./services/auth.js";

function Layout({ children }) {
  const auth = getAuth();
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Cloud Blood Bank System</h1>
        <nav>
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
                onClick={() => {
                  logout();
                  window.location.href = "/login";
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
        <Route path="/" element={<Navigate to="/login" replace />} />
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

