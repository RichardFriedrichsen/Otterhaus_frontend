import React, { useEffect, useState } from "react";
import { api, currentUser } from "../api";

function PersonFilter({ value, onChange, people }) {
  const me = currentUser();
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
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

function assignedLabel(chore) {
  return chore.assigned_to_detail?.length > 0
    ? chore.assigned_to_detail.map((u) => u.username).join(" & ")
    : null;
}

function ChoreItem({ chore, onComplete }) {
  const schedule =
    chore.task_type === "one_time"
      ? "one time"
      : chore.recurrence_type === "fixed"
      ? `every ${chore.interval_days} days from ${chore.start_date}`
      : `every ${chore.interval_days} days`;
  const assigned = assignedLabel(chore);
  return (
    <li className="chore">
      <div className="meta">
        <div className="name">{chore.name}</div>
        <ul className="sub-list">
          {chore.room_name && <li>{chore.room_name}</li>}
          <li>{schedule}</li>
          {assigned && <li>assigned to {assigned}</li>}
        </ul>
      </div>
      <div className="chore-actions">
        <button className="primary fit" onClick={() => onComplete(chore)}>
          Mark done
        </button>
      </div>
    </li>
  );
}

function CompactChoreItem({ chore, onComplete }) {
  const assigned = assignedLabel(chore);
  return (
    <div className="weekly-chore">
      <div className="name">{chore.name}</div>
      <div className="sub">
        {chore.room_name}
        {assigned && ` · ${assigned}`}
      </div>
      <button className="primary fit" onClick={() => onComplete(chore)}>Done</button>
    </div>
  );
}

function DayChores({ day, onComplete }) {
  if (day.chores.length === 0) return <p className="empty">Nothing scheduled.</p>;
  return (
    <ul className="plain">
      {day.chores.map((c) => <ChoreItem key={c.id} chore={c} onComplete={onComplete} />)}
    </ul>
  );
}

function CompactDayChores({ day, onComplete }) {
  if (day.chores.length === 0) return <p className="empty">—</p>;
  return day.chores.map((c) => <CompactChoreItem key={c.id} chore={c} onComplete={onComplete} />);
}

export default function WeeklyOverview() {
  const [days, setDays] = useState(null);
  const [people, setPeople] = useState([]);
  const [selected, setSelected] = useState(0);
  const [msg, setMsg] = useState(null);
  const [person, setPerson] = useState(String(currentUser()?.id ?? "all"));

  const load = () =>
    api.weeklyOverview(person)
      .then((r) => { setDays(r.days); setPeople(r.people); })
      .catch((e) => setMsg({ t: "error", m: e.message }));
  useEffect(() => { load(); }, [person]);

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

  if (!days) return <p>Loading…</p>;

  return (
    <main>
      <div className="row" style={{ alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>This week</h1>
        <PersonFilter value={person} onChange={setPerson} people={people} />
      </div>
      {msg && <p className={`msg ${msg.t}`}>{msg.m}</p>}

      <div className="weekly-desktop">
        <div className="card">
          <table className="weekly-table">
            <thead>
              <tr>
                {days.map((d) => (
                  <th key={d.date} className={d.is_today ? "today" : ""}>
                    {d.weekday}<br />
                    <span className="sub">{d.date}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {days.map((d) => (
                  <td key={d.date} className={d.is_today ? "today" : ""}>
                    <CompactDayChores day={d} onComplete={complete} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="weekly-mobile">
        <label htmlFor="weekday-select">Select weekday</label>
        <select id="weekday-select" value={selected} onChange={(e) => setSelected(Number(e.target.value))}>
          {days.map((d, i) => (
            <option key={d.date} value={i}>
              {d.weekday} ({d.date}){d.is_today ? " — today" : ""}
            </option>
          ))}
        </select>
        <div className="card" style={{ marginTop: "0.75rem" }}>
          <h2>{days[selected].weekday}</h2>
          <DayChores day={days[selected]} onComplete={complete} />
        </div>
      </div>
    </main>
  );
}
