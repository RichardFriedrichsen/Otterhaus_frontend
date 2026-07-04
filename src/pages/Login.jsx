import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, saveSession } from "../api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const { token, user } = await api.login({ username, password });
      saveSession(token, user);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-wrap">
      <span className="brand">chore<span style={{ color: "var(--fresh)" }}>board</span></span>
      <div className="card">
        <h1>Sign in</h1>
        <form onSubmit={submit}>
          <label htmlFor="u">Username</label>
          <input id="u" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          <label htmlFor="p">Password</label>
          <input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="msg error">{error}</p>}
          <p><button className="primary" style={{ width: "100%" }}>Sign in</button></p>
        </form>
        <p><Link to="/forgot-password">Forgot your password?</Link></p>
        <p>New here? <Link to="/register">Create an account</Link></p>
      </div>
    </div>
  );
}
