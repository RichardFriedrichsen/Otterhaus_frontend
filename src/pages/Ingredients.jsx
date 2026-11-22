import React, { useEffect, useState } from "react";
import { api } from "../api";

function IngredientRow({ ingredient, run }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  function startEdit() {
    setForm({ name: ingredient.name, location: ingredient.location });
    setEditing(true);
  }

  async function save() {
    await run(
      () => api.updateIngredient(ingredient.id, form),
      `Ingredient '${form.name}' updated.`
    );
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="chore">
        <div className="meta" style={{ width: "100%" }}>
          <div className="row">
            <div>
              <label htmlFor={`in-${ingredient.id}`}>Name</label>
              <input
                id={`in-${ingredient.id}`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor={`il-${ingredient.id}`}>Where to find it</label>
              <input
                id={`il-${ingredient.id}`}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Dairy aisle"
              />
            </div>
          </div>
        </div>
        <div className="row chore-actions" style={{ gap: "0.4rem" }}>
          <button className="primary fit" disabled={!form.name.trim()} onClick={save}>Save</button>
          <button className="ghost fit" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </li>
    );
  }

  return (
    <li className="chore">
      <div className="meta">
        <div className="name">{ingredient.name}</div>
        <ul className="sub-list">
          <li>{ingredient.location || "No location set"}</li>
        </ul>
      </div>
      <div className="row chore-actions" style={{ gap: "0.4rem" }}>
        <button className="fit" onClick={startEdit}>Edit</button>
        <button
          className="danger fit"
          onClick={() => {
            if (confirm(`Delete ingredient '${ingredient.name}'?`))
              run(() => api.deleteIngredient(ingredient.id), `Ingredient '${ingredient.name}' deleted.`);
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

const emptyForm = { house_id: "", name: "", location: "" };

export default function Ingredients() {
  const [houses, setHouses] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => api.ingredients().then(setIngredients).catch((e) => setMsg({ t: "error", m: e.message }));
  useEffect(() => {
    load();
    api.houses().then((hs) => {
      setHouses(hs);
      setForm((f) => ({ ...f, house_id: hs[0] ? String(hs[0].id) : "" }));
    }).catch((e) => setMsg({ t: "error", m: e.message }));
  }, []);

  async function run(fn, okMsg) {
    try {
      const r = await fn();
      setMsg({ t: "ok", m: okMsg || r?.detail || "Saved." });
      load();
    } catch (e) {
      setMsg({ t: "error", m: e.message });
    }
  }

  const canAdd = form.name.trim() && form.house_id;

  return (
    <main>
      <h1>Ingredients</h1>
      {msg && <p className={`msg ${msg.t}`}>{msg.m}</p>}

      <div className="card">
        <h2>Add an ingredient</h2>
        <div className="row">
          {houses.length > 1 && (
            <div>
              <label htmlFor="ing-house">House</label>
              <select
                id="ing-house"
                value={form.house_id}
                onChange={(e) => setForm({ ...form, house_id: e.target.value })}
              >
                {houses.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="ing-name">Name</label>
            <input
              id="ing-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Milk"
            />
          </div>
          <div>
            <label htmlFor="ing-location">Where to find it</label>
            <input
              id="ing-location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Dairy aisle"
            />
          </div>
        </div>
        <div className="row" style={{ marginTop: "0.5rem" }}>
          <button
            className="primary fit"
            disabled={!canAdd}
            onClick={() =>
              run(
                () => api.createIngredient({
                  house: Number(form.house_id),
                  name: form.name.trim(),
                  location: form.location.trim(),
                }),
                `Ingredient '${form.name}' added.`
              ).then(() => setForm((f) => ({ ...f, name: "", location: "" })))
            }
          >
            Add ingredient
          </button>
        </div>
      </div>

      {houses.length === 0 && (
        <p className="empty">Create a house first (under Houses) before adding ingredients.</p>
      )}

      <ul className="plain" style={{ marginTop: "1rem" }}>
        {ingredients.map((i) => (
          <IngredientRow key={i.id} ingredient={i} run={run} />
        ))}
      </ul>
      {ingredients.length === 0 && houses.length > 0 && (
        <p className="empty">No ingredients yet — add one above.</p>
      )}
    </main>
  );
}
