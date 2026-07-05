import React, { useState } from "react";
import {
  BrowserRouter, Routes, Route, NavLink, Link, Navigate, useNavigate,
} from "react-router-dom";
import { isAuthed, currentUser, clearSession } from "./api";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Houses from "./pages/Houses";
import Scoreboard from "./pages/Scoreboard";
import WeeklyOverview from "./pages/WeeklyOverview";

function RequireAuth({ children }) {
  return isAuthed() ? children : <Navigate to="/login" replace />;
}

function TopBar() {
  const navigate = useNavigate();
  const user = currentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  if (!isAuthed()) return null;

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="topbar">
      <Link to="/" className="brand" onClick={closeMenu}>chore<span>board</span></Link>
      <button
        className="burger"
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>
      <nav className={menuOpen ? "open" : ""}>
        <NavLink to="/" end onClick={closeMenu}>Dashboard</NavLink>
        <NavLink to="/weekly" onClick={closeMenu}>This week</NavLink>
        <NavLink to="/houses" onClick={closeMenu}>Houses</NavLink>
        <NavLink to="/scoreboard" onClick={closeMenu}>Scoreboard</NavLink>
      </nav>
      <div className="spacer" />
      <span className="whoami">{user?.username}</span>
      <button
        className="ghost"
        onClick={() => { clearSession(); navigate("/login"); }}
      >
        Sign out
      </button>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="shell">
        <TopBar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/weekly" element={<RequireAuth><WeeklyOverview /></RequireAuth>} />
          <Route path="/houses" element={<RequireAuth><Houses /></RequireAuth>} />
          <Route path="/scoreboard" element={<RequireAuth><Scoreboard /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
