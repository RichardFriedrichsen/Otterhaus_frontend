import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

function ChoreRow({ chore, onComplete }) {
  const overdue = chore.days_overdue > 0;
  const cls = chore.is_due ? (overdue ? "chore overdue" : "chore due") : "chore";
  return (
    <li className={cls}>
      <div className="meta">
        <div className="name">{chore.name}</div>
        <div className="sub">
          {chore.house_name} · {chore.room_name} · every {chore.interval_days} days
          {chore.last_completed_by &&
            ` · last done by ${chore.last_completed_by}`}
        </div>
      </div>
      {chore.is_due ? (
        <span className={`badge ${overdue ? "overdue" : "due"}`}>
          {overdue ? `overdue by ${chore.days_overdue}d` : "due today"}
        </span>
      ) : (
        <span className="badge ok">due {chore.due_date}</span>
      )}
      {onComplete && (
        <button className="primary fit" onClick={() => onComplete(chore)}>
          Mark done
        </button>
      )}
    </li>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = () => api.dashboard().then(setData).catch((e) => setMsg({ t: "error", m: e.message }));
  useEffect(() => { load(); }, []);

  async function complete(chore) {
    try {
      const r = await api.completeChore(chore.id);
      setMsg({ t: "ok", m: r.detail });
      load();
    } catch (e) {
      setMsg({ t: "error", m: e.message });
    }
  }

  async function emailOverview() {
    try {
      const r = await api.sendOverviewEmail();
      setMsg({ t: "ok", m: r.detail });
    } catch (e) {
      setMsg({ t: "error", m: e.message });
    }
  }

  if (!data) return <p>Loading…</p>;

  return (
    <main>
      <div className="row" style={{ alignItems: "center", marginBottom: "0.5rem" }}>
        <h1 style={{ margin: 0 }}>What needs doing</h1>
        <button className="ghost fit" onClick={emailOverview}>
          Email me this overview
        </button>
      </div>
      {msg && <p className={`msg ${msg.t}`}>{msg.m}</p>}

      <ul className="plain">
        {data.due.map((c) => <ChoreRow key={c.id} chore={c} onComplete={complete} />)}
      </ul>
      {data.due.length === 0 && (
        <p className="empty">
          Nothing is due — enjoy it. Add chores under <Link to="/houses">Houses</Link>.
        </p>
      )}

      <h2 style={{ marginTop: "2rem" }}>Coming up</h2>
      <ul className="plain">
        {data.upcoming.map((c) => <ChoreRow key={c.id} chore={c} />)}
      </ul>
      {data.upcoming.length === 0 && <p className="empty">No upcoming chores scheduled.</p>}
    </main>
  );
}
