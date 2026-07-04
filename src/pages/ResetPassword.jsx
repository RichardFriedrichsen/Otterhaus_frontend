import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.confirmPasswordReset({
        uid: params.get("uid"),
        token: params.get("token"),
        new_password: password,
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card">
        <h1>Choose a new password</h1>
        {done ? (
          <p className="msg ok">Password updated. <Link to="/login">Sign in</Link></p>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="p">New password</label>
            <input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoFocus />
            {error && <p className="msg error">{error}</p>}
            <p><button className="primary" style={{ width: "100%" }}>Save new password</button></p>
          </form>
        )}
      </div>
    </div>
  );
}
