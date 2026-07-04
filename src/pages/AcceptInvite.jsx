import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, isAuthed } from "../api";

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState({ status: "working", message: "" });

  useEffect(() => {
    if (!isAuthed()) {
      setState({ status: "anon", message: "" });
      return;
    }
    api.acceptInvite(token)
      .then((r) => setState({ status: "ok", message: r.detail }))
      .catch((e) => setState({ status: "error", message: e.message }));
  }, [token]);

  return (
    <div className="auth-wrap">
      <div className="card">
        <h1>House invite</h1>
        {state.status === "working" && <p>Applying your invite…</p>}
        {state.status === "ok" && (
          <p className="msg ok">{state.message} <Link to="/">Go to your dashboard</Link></p>
        )}
        {state.status === "error" && <p className="msg error">{state.message}</p>}
        {state.status === "anon" && (
          <p>
            Sign in or register first, then this invite will be applied.{" "}
            <Link to={`/register?invite=${token}`}>Register</Link> ·{" "}
            <Link to="/login">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
