import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, saveSession } from "../api";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const { token, user } = await api.register(form);
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
        <h1>Create account</h1>
        <form onSubmit={submit}>
          <label htmlFor="u">Username</label>
          <input id="u" value={form.username} onChange={set("username")} required autoFocus />
          <label htmlFor="e">Email</label>
          <input id="e" type="email" value={form.email} onChange={set("email")} required />
          <label htmlFor="p">Password</label>
          <input id="p" type="password" value={form.password} onChange={set("password")} required minLength={8} />
          {error && <p className="msg error">{error}</p>}
          <p><button className="primary" style={{ width: "100%" }}>Create account</button></p>
        </form>
        <p>Already registered? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
