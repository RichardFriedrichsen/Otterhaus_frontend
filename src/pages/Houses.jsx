import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Houses() {
  const [houses, setHouses] = useState([]);
  const [msg, setMsg] = useState(null);
  const [newHouse, setNewHouse] = useState("");
  const [joinCode, setJoinCode] = useState("");

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

      <div className="grid2">
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

        <div className="card">
          <h2>Join a house</h2>
          <div className="row">
            <div>
              <label htmlFor="jc">Access code</label>
              <input
                id="jc"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="e.g. AB12CD34"
              />
            </div>
            <button
              className="primary fit"
              disabled={!joinCode.trim()}
              onClick={() => run(() => api.joinHouse(joinCode.trim())).then(() => setJoinCode(""))}
            >
              Join house
            </button>
          </div>
        </div>
      </div>

      {houses.map((h) => <HouseCard key={h.id} house={h} run={run} flash={flash} />)}
      {houses.length === 0 && <p className="empty">No houses yet — create one above, or join one with an access code.</p>}
    </main>
  );
}

function HouseCard({ house, run, flash }) {
  const [roomName, setRoomName] = useState("");

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(house.access_code);
      flash("ok", "Access code copied to clipboard.");
    } catch {
      flash("error", "Couldn't copy — copy it manually: " + house.access_code);
    }
  }

  return (
    <div className="card">
      <h2>{house.name}</h2>
      <p className="sub" style={{ color: "var(--muted)" }}>
        Members: {house.members.map((m) => m.username).join(", ")}
      </p>

      <div className="row" style={{ alignItems: "center" }}>
        <div>
          <label>Access code</label>
          <p style={{ margin: 0, fontFamily: "monospace", fontSize: "1.1rem", letterSpacing: "0.05em" }}>
            {house.access_code}
          </p>
        </div>
        <button className="fit" onClick={copyCode}>Copy access code</button>
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

      {house.rooms.map((r) => <RoomBlock key={r.id} room={r} members={house.members} run={run} />)}
    </div>
  );
}

const emptyChoreForm = {
  name: "",
  interval_days: 7,
  recurrence_type: "floating",
  start_date: "",
  assignee: "all",
};

function RoomBlock({ room, members, run }) {
  const [form, setForm] = useState(emptyChoreForm);

  const canSubmit =
    form.name.trim() &&
    form.interval_days > 0 &&
    (form.recurrence_type !== "fixed" || form.start_date);

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
                {c.recurrence_type === "fixed"
                  ? `every ${c.interval_days} days from ${c.start_date}`
                  : `every ${c.interval_days} days`}
                {" · next due "}{c.due_date}
                {c.last_completed_by && ` · last done by ${c.last_completed_by}`}
                {c.assigned_to_detail?.length > 0 &&
                  ` · assigned to ${c.assigned_to_detail.map((u) => u.username).join(" & ")}`}
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
        <div style={{ maxWidth: 220 }}>
          <label htmlFor={`crt-${room.id}`}>Schedule</label>
          <select
            id={`crt-${room.id}`}
            value={form.recurrence_type}
            onChange={(e) => setForm({ ...form, recurrence_type: e.target.value })}
          >
            <option value="floating">Every N days after completed</option>
            <option value="fixed">Every N days from a start date</option>
          </select>
        </div>
        {form.recurrence_type === "fixed" && (
          <div style={{ maxWidth: 170 }}>
            <label htmlFor={`csd-${room.id}`}>Start date</label>
            <input
              id={`csd-${room.id}`}
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
        )}
      </div>

      {members?.length > 0 && (
        <div style={{ marginTop: "0.5rem", maxWidth: 220 }}>
          <label htmlFor={`ca-${room.id}`}>Assign to</label>
          <select
            id={`ca-${room.id}`}
            value={form.assignee}
            onChange={(e) => setForm({ ...form, assignee: e.target.value })}
          >
            <option value="all">All</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.username}</option>
            ))}
          </select>
        </div>
      )}

      <div className="row" style={{ marginTop: "0.5rem" }}>
        <button
          className="primary fit"
          disabled={!canSubmit}
          onClick={() =>
            run(
              () =>
                api.createChore({
                  room: room.id,
                  name: form.name.trim(),
                  interval_days: Number(form.interval_days),
                  recurrence_type: form.recurrence_type,
                  start_date: form.recurrence_type === "fixed" ? form.start_date : null,
                  assigned_to:
                    form.assignee === "all" ? members.map((m) => m.id) : [Number(form.assignee)],
                }),
              `Chore '${form.name}' added.`
            ).then(() => setForm(emptyChoreForm))
          }
        >
          Add chore
        </button>
      </div>
    </div>
  );
}
