import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Houses() {
  const [houses, setHouses] = useState([]);
  const [msg, setMsg] = useState(null);
  const [newHouse, setNewHouse] = useState("");

  const load = () => api.houses().then(setHouses).catch((e) => setMsg({ t: "error", m: e.message }));
  useEffect(() => { load(); }, []);

  const flash = (t, m) => setMsg({ t, m });

  async function run(fn, okMsg) {
    try {
      const r = await fn();
      flash("ok", okMsg || r?.detail || "Saved.");
      load();
    } catch (e) {
      flash("error", e.message);
    }
  }

  return (
    <main>
      <h1>Houses</h1>
      {msg && <p className={`msg ${msg.t}`}>{msg.m}</p>}

      <div className="card">
        <h2>Create a house</h2>
        <div className="row">
          <div>
            <label htmlFor="nh">House name</label>
            <input id="nh" value={newHouse} onChange={(e) => setNewHouse(e.target.value)} placeholder="e.g. Our flat" />
          </div>
          <button
            className="primary fit"
            disabled={!newHouse.trim()}
            onClick={() => run(() => api.createHouse(newHouse.trim()), `House '${newHouse}' created.`).then(() => setNewHouse(""))}
          >
            Create house
          </button>
        </div>
      </div>

      {houses.map((h) => <HouseCard key={h.id} house={h} run={run} />)}
      {houses.length === 0 && <p className="empty">No houses yet — create one above.</p>}
    </main>
  );
}

function HouseCard({ house, run }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [roomName, setRoomName] = useState("");

  return (
    <div className="card">
      <h2>{house.name}</h2>
      <p className="sub" style={{ color: "var(--muted)" }}>
        Members: {house.members.map((m) => m.username).join(", ")}
        {house.invites.length > 0 &&
          ` · invited: ${house.invites.map((i) => i.email).join(", ")}`}
      </p>

      <div className="row">
        <div>
          <label htmlFor={`inv-${house.id}`}>Invite someone by email</label>
          <input
            id={`inv-${house.id}`}
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="partner@example.com"
          />
        </div>
        <button
          className="fit"
          disabled={!inviteEmail.trim()}
          onClick={() => run(() => api.invite(house.id, inviteEmail.trim())).then(() => setInviteEmail(""))}
        >
          Send invite
        </button>
      </div>

      <div className="row" style={{ marginTop: "0.6rem" }}>
        <div>
          <label htmlFor={`room-${house.id}`}>Add a room</label>
          <input
            id={`room-${house.id}`}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Kitchen"
          />
        </div>
        <button
          className="fit"
          disabled={!roomName.trim()}
          onClick={() => run(() => api.createRoom(house.id, roomName.trim()), `Room '${roomName}' added.`).then(() => setRoomName(""))}
        >
          Add room
        </button>
      </div>

      {house.rooms.map((r) => <RoomBlock key={r.id} room={r} run={run} />)}
    </div>
  );
}

function RoomBlock({ room, run }) {
  const [form, setForm] = useState({ name: "", interval_days: 7 });

  return (
    <div style={{ marginTop: "1rem", paddingTop: "0.8rem", borderTop: "1px dashed var(--line)" }}>
      <div className="row" style={{ alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{room.name}</h3>
        <button
          className="danger fit"
          onClick={() => {
            if (confirm(`Delete room '${room.name}' and all its chores?`))
              run(() => api.deleteRoom(room.id), `Room '${room.name}' deleted.`);
          }}
        >
          Delete room
        </button>
      </div>

      <ul className="plain" style={{ marginTop: "0.5rem" }}>
        {room.chores.map((c) => (
          <li key={c.id} className={`chore ${c.is_due ? (c.days_overdue > 0 ? "overdue" : "due") : ""}`}>
            <div className="meta">
              <div className="name">{c.name}</div>
              <div className="sub">
                every {c.interval_days} days · next due {c.due_date}
                {c.last_completed_by && ` · last done by ${c.last_completed_by}`}
              </div>
            </div>
            <button
              className="danger fit"
              onClick={() => {
                if (confirm(`Delete chore '${c.name}'?`))
                  run(() => api.deleteChore(c.id), `Chore '${c.name}' deleted.`);
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <div className="row">
        <div>
          <label htmlFor={`cn-${room.id}`}>New chore</label>
          <input
            id={`cn-${room.id}`}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Mop the floor"
          />
        </div>
        <div style={{ maxWidth: 160 }}>
          <label htmlFor={`ci-${room.id}`}>Repeat every (days)</label>
          <input
            id={`ci-${room.id}`}
            type="number"
            min="1"
            value={form.interval_days}
            onChange={(e) => setForm({ ...form, interval_days: e.target.value })}
          />
        </div>
        <button
          className="primary fit"
          disabled={!form.name.trim() || !(form.interval_days > 0)}
          onClick={() =>
            run(
              () => api.createChore({ room: room.id, name: form.name.trim(), interval_days: Number(form.interval_days) }),
              `Chore '${form.name}' added.`
            ).then(() => setForm({ name: "", interval_days: 7 }))
          }
        >
          Add chore
        </button>
      </div>
    </div>
  );
}
