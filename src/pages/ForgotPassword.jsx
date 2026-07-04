import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card">
        <h1>Reset password</h1>
        {sent ? (
          <p className="msg ok">
            If that email exists, a reset link is on its way. Check your inbox.
          </p>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="e">Email address</label>
            <input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            {error && <p className="msg error">{error}</p>}
            <p><button className="primary" style={{ width: "100%" }}>Send reset link</button></p>
          </form>
        )}
        <p><Link to="/login">Back to sign in</Link></p>
      </div>
    </div>
  );
}
