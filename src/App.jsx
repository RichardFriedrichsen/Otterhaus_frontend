import React from "react";
import {
  BrowserRouter, Routes, Route, NavLink, Link, Navigate, useNavigate,
} from "react-router-dom";
import { isAuthed, currentUser, clearSession } from "./api";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AcceptInvite from "./pages/AcceptInvite";
import Dashboard from "./pages/Dashboard";
import Houses from "./pages/Houses";
import Scoreboard from "./pages/Scoreboard";

function RequireAuth({ children }) {
  return isAuthed() ? children : <Navigate to="/login" replace />;
}

function TopBar() {
  const navigate = useNavigate();
  const user = currentUser();
  if (!isAuthed()) return null;
  return (
    <header className="topbar">
      <Link to="/" className="brand">chore<span>board</span></Link>
      <nav>
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/houses">Houses</NavLink>
        <NavLink to="/scoreboard">Scoreboard</NavLink>
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
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/houses" element={<RequireAuth><Houses /></RequireAuth>} />
          <Route path="/scoreboard" element={<RequireAuth><Scoreboard /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
