import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Scoreboard() {
  const [houses, setHouses] = useState([]);
  const [houseId, setHouseId] = useState("");
  const [board, setBoard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.houses().then((hs) => {
      setHouses(hs);
      if (hs.length) setHouseId(String(hs[0].id));
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!houseId) return;
    api.scoreboard(houseId).then(setBoard).catch((e) => setError(e.message));
  }, [houseId]);

  return (
    <main>
      <h1>Scoreboard</h1>
      {error && <p className="msg error">{error}</p>}
      {houses.length > 1 && (
        <p>
          <select value={houseId} onChange={(e) => setHouseId(e.target.value)} style={{ maxWidth: 280 }}>
            {houses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </p>
      )}
      {houses.length === 0 && <p className="empty">Create a house first to see a scoreboard.</p>}
      {board && (
        <div className="grid2">
          <div className="card">
            <h2>Totals (all time)</h2>
            {board.scores.map((s, i) => (
              <div className="score-row" key={s.user.id}>
                <span className="rank">{i + 1}</span>
                <span>{s.user.username}</span>
                <span className="total">{s.total}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h2>Latest chores done</h2>
            {board.recent.length === 0 && <p className="empty">Nothing completed yet.</p>}
            <ul className="plain">
              {board.recent.map((c) => (
                <li key={c.id} className="score-row">
                  <span>
                    <strong>{c.user.username}</strong> · {c.chore_name}
                    <div className="sub" style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                      {c.room_name} · {new Date(c.completed_at).toLocaleString()}
                    </div>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
