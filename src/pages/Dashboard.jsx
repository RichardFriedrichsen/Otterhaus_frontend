import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, currentUser } from "../api";

function PersonFilter({ value, onChange, people }) {
  const me = currentUser();
  return (
    <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.4rem" }}>
      Showing
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="all">Everyone</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {me && String(p.id) === String(me.id) ? `${p.username} (me)` : p.username}
          </option>
        ))}
      </select>
    </label>
  );
}

function ChoreRow({ chore, onComplete }) {
  const overdue = chore.days_overdue > 0;
  const cls = chore.is_due ? (overdue ? "chore overdue" : "chore due") : "chore";
  const schedule =
    chore.task_type === "one_time"
      ? "one time"
      : chore.recurrence_type === "fixed"
      ? `every ${chore.interval_days} days from ${chore.start_date}`
      : `every ${chore.interval_days} days`;
  return (
    <li className={cls}>
      <div className="meta">
        <div className="name">{chore.name}</div>
        <div className="sub">
          {chore.house_name}
          {chore.room_name && ` · ${chore.room_name}`} · {schedule}
          {chore.last_completed_by &&
            ` · last done by ${chore.last_completed_by}`}
          {chore.assigned_to_detail?.length > 0 &&
            ` · assigned to ${chore.assigned_to_detail.map((u) => u.username).join(" & ")}`}
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

const emptyTaskForm = {
  task_type: "planned",
  house_id: "",
  room_id: "",
  name: "",
  assignee: "all",
};

function AddTaskModal({ houses, onClose, onCreated }) {
  const [form, setForm] = useState(() => ({
    ...emptyTaskForm,
    house_id: houses[0] ? String(houses[0].id) : "",
  }));
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const house = houses.find((h) => String(h.id) === String(form.house_id));
  const rooms = house?.rooms || [];
  const members = house?.members || [];
  const selectedRoom = rooms.find((r) => String(r.id) === String(form.room_id));
  const roomTaskNames = selectedRoom ? [...new Set(selectedRoom.chores.map((c) => c.name))] : [];
  const matchedChore = selectedRoom?.chores.find((c) => c.name === form.name);

  function set(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }

  const isPlanned = form.task_type === "planned";
  const canSubmit =
    form.name.trim() &&
    form.house_id &&
    (!isPlanned || form.room_id);

  async function submit() {
    setSaving(true);
    try {
      await api.createChore({
        task_type: form.task_type,
        house: isPlanned ? undefined : Number(form.house_id),
        room: form.room_id ? Number(form.room_id) : null,
        name: form.name.trim(),
        interval_days: isPlanned ? matchedChore?.interval_days : null,
        recurrence_type: isPlanned ? matchedChore?.recurrence_type ?? "floating" : "floating",
        start_date: isPlanned && matchedChore?.recurrence_type === "fixed" ? matchedChore.start_date : null,
        assigned_to:
          form.assignee === "all" ? members.map((m) => m.id) : [Number(form.assignee)],
      });
      onCreated();
      onClose();
    } catch (e) {
      setMsg({ t: "error", m: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add a task</h2>
        {msg && <p className={`msg ${msg.t}`}>{msg.m}</p>}

        <label htmlFor="task-kind">Create one time task or planned task?</label>
        <select
          id="task-kind"
          value={form.task_type}
          onChange={(e) => set({ task_type: e.target.value, room_id: "", name: "" })}
        >
          <option value="planned">Planned task — assigned to a room, recurring</option>
          <option value="one_time">One time task — ad hoc, not recurring</option>
        </select>

        <label htmlFor="task-house">House</label>
        <select
          id="task-house"
          value={form.house_id}
          onChange={(e) => set({ house_id: e.target.value, room_id: "", name: "", assignee: "all" })}
        >
          <option value="">Select a house…</option>
          {houses.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>

        {isPlanned ? (
          <>
            <label htmlFor="task-room">Room</label>
            <select
              id="task-room"
              value={form.room_id}
              onChange={(e) => set({ room_id: e.target.value, name: "" })}
              disabled={!house}
            >
              <option value="">Select a room…</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </>
        ) : (
          house && rooms.length > 0 && (
            <>
              <label htmlFor="task-room">Room (optional)</label>
              <select
                id="task-room"
                value={form.room_id}
                onChange={(e) => set({ room_id: e.target.value })}
              >
                <option value="">No particular room</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </>
          )
        )}

        {isPlanned ? (
          <>
            <label htmlFor="task-name">Task name</label>
            <select
              id="task-name"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              disabled={!form.room_id}
            >
              <option value="">
                {!form.room_id
                  ? "Select a room first…"
                  : roomTaskNames.length === 0
                  ? "No existing tasks in this room"
                  : "Select a task…"}
              </option>
              {roomTaskNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </>
        ) : (
          <>
            <label htmlFor="task-name">Task name</label>
            <input
              id="task-name"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Extra load of laundry"
            />
          </>
        )}

        {members.length > 0 && (
          <>
            <label htmlFor="task-assignee">Assign to</label>
            <select
              id="task-assignee"
              value={form.assignee}
              onChange={(e) => set({ assignee: e.target.value })}
            >
              <option value="all">All</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.username}</option>
              ))}
            </select>
          </>
        )}

        <div className="row" style={{ marginTop: "1rem" }}>
          <button className="ghost fit" onClick={onClose}>Cancel</button>
          <button className="primary fit" disabled={!canSubmit || saving} onClick={submit}>
            {saving ? "Adding…" : "Add task"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [houses, setHouses] = useState([]);
  const [msg, setMsg] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [person, setPerson] = useState(String(currentUser()?.id ?? "all"));

  const load = () => api.dashboard(person).then(setData).catch((e) => setMsg({ t: "error", m: e.message }));
  useEffect(() => {
    load();
  }, [person]);
  useEffect(() => {
    api.houses().then(setHouses).catch((e) => setMsg({ t: "error", m: e.message }));
  }, []);

  async function complete(chore) {
    if (!confirm(`Mark '${chore.name}' as done?`)) return;
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
        <button className="primary fit" onClick={() => setShowAddTask(true)}>
          Add task
        </button>
        <button className="ghost fit" onClick={emailOverview}>
          Email me this overview
        </button>
        <PersonFilter value={person} onChange={setPerson} people={data.people} />
      </div>
      {msg && <p className={`msg ${msg.t}`}>{msg.m}</p>}

      {showAddTask && (
        <AddTaskModal
          houses={houses}
          onClose={() => setShowAddTask(false)}
          onCreated={() => {
            load();
            setMsg({ t: "ok", m: "Task added." });
          }}
        />
      )}

      <ul className="plain">
        {data.due.map((c) => <ChoreRow key={c.id} chore={c} onComplete={complete} />)}
      </ul>
      {data.due.length === 0 && (
        <p className="empty">
          Nothing is due — enjoy it. Add a task above, or under <Link to="/houses">Houses</Link>.
        </p>
      )}

      <h2 style={{ marginTop: "2rem" }}>Scoreboard (last 7 days)</h2>
      {data.scoreboard.length === 0 && <p className="empty">No chores completed in the last 7 days yet.</p>}
      {data.scoreboard.map((s, i) => (
        <div className="score-row" key={s.user.id}>
          <span className="rank">{i + 1}</span>
          <span>{s.user.username}</span>
          <span className="total">{s.total}</span>
        </div>
      ))}

      <h2 style={{ marginTop: "2rem" }}>Coming up</h2>
      <ul className="plain">
        {data.upcoming.map((c) => <ChoreRow key={c.id} chore={c} onComplete={complete} />)}
      </ul>
      {data.upcoming.length === 0 && <p className="empty">No upcoming chores scheduled.</p>}

      <h2 style={{ marginTop: "2rem" }}>Completed tasks</h2>
      {data.recent_completions.length === 0 && <p className="empty">Nothing completed yet.</p>}
      <ul className="plain">
        {data.recent_completions.map((c) => (
          <li key={c.id} className="score-row">
            <span>
              <strong>{c.user.username}</strong> · {c.chore_name}
              <div className="sub" style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                {c.room_name && `${c.room_name} · `}{new Date(c.completed_at).toLocaleString()}
              </div>
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
