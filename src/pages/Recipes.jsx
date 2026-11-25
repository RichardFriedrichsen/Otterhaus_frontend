import React, { useEffect, useState } from "react";
import { api } from "../api";

const UNIT_OPTIONS = [
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "l", label: "l" },
  { value: "tsp", label: "tsp" },
  { value: "tbsp", label: "tbsp" },
  { value: "cup", label: "cup" },
  { value: "piece", label: "piece" },
  { value: "pinch", label: "pinch" },
];

function IngredientChips({ items, selected, onToggle }) {
  return (
    <div className="row" style={{ flexWrap: "wrap" }}>
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          className={selected.includes(i.id) ? "primary fit" : "ghost fit"}
          onClick={() => onToggle(i.id)}
        >
          {i.name}
        </button>
      ))}
    </div>
  );
}

function RecipeIngredientRows({ rows, ingredients, onChange, idPrefix }) {
  function updateRow(idx, patch) {
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function removeRow(idx) {
    onChange(rows.filter((_, i) => i !== idx));
  }
  function addRow() {
    onChange([...rows, { ingredient_id: "", amount: "", unit: UNIT_OPTIONS[0].value }]);
  }

  return (
    <div>
      {rows.map((row, idx) => (
        <div className="row" key={idx}>
          <div>
            <label htmlFor={`${idPrefix}-ingredient-${idx}`}>Ingredient</label>
            <select
              id={`${idPrefix}-ingredient-${idx}`}
              value={row.ingredient_id}
              onChange={(e) => updateRow(idx, { ingredient_id: e.target.value })}
            >
              <option value="">Select…</option>
              {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div style={{ maxWidth: 110 }}>
            <label htmlFor={`${idPrefix}-amount-${idx}`}>Amount</label>
            <input
              id={`${idPrefix}-amount-${idx}`}
              type="number"
              min="0"
              step="0.01"
              value={row.amount}
              onChange={(e) => updateRow(idx, { amount: e.target.value })}
            />
          </div>
          <div style={{ maxWidth: 110 }}>
            <label htmlFor={`${idPrefix}-unit-${idx}`}>Unit</label>
            <select
              id={`${idPrefix}-unit-${idx}`}
              value={row.unit}
              onChange={(e) => updateRow(idx, { unit: e.target.value })}
            >
              {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
          <button type="button" className="danger fit" onClick={() => removeRow(idx)}>Remove</button>
        </div>
      ))}
      <button type="button" className="ghost fit" onClick={addRow}>+ Add ingredient</button>
    </div>
  );
}

function CategoryManager({ houses, categories, run }) {
  const [form, setForm] = useState({ house_id: "", name: "" });

  function set(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }

  useEffect(() => {
    if (!form.house_id && houses[0]) set({ house_id: String(houses[0].id) });
  }, [houses]);

  const canAdd = form.name.trim() && form.house_id;

  return (
    <div className="card">
      <h2>Recipe categories</h2>
      <div className="row">
        {houses.length > 1 && (
          <div>
            <label htmlFor="cat-house">House</label>
            <select
              id="cat-house"
              value={form.house_id}
              onChange={(e) => set({ house_id: e.target.value })}
            >
              {houses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="cat-name">New category</label>
          <input
            id="cat-name"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Dessert"
          />
        </div>
        <button
          className="primary fit"
          disabled={!canAdd}
          onClick={() =>
            run(
              () => api.createRecipeCategory({ house: Number(form.house_id), name: form.name.trim() }),
              `Category '${form.name}' added.`
            ).then(() => setForm((f) => ({ ...f, name: "" })))
          }
        >
          Add category
        </button>
      </div>

      <ul className="plain" style={{ marginTop: "0.6rem" }}>
        {categories.map((c) => (
          <li className="score-row" key={c.id}>
            <span>{c.name}</span>
            <button
              className="danger fit"
              style={{ marginLeft: "auto" }}
              onClick={() => {
                if (confirm(`Delete category '${c.name}'? Recipes keep their name but lose this category.`))
                  run(() => api.deleteRecipeCategory(c.id), `Category '${c.name}' deleted.`);
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      {categories.length === 0 && <p className="empty">No categories yet — add one above.</p>}
    </div>
  );
}

function AddRecipeModal({ houses, categories, ingredients, onClose, onCreated }) {
  const [form, setForm] = useState(() => ({
    house_id: houses[0] ? String(houses[0].id) : "",
    name: "",
    category_id: "",
    ingredient_rows: [],
    instructions: "",
  }));
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const houseCategories = categories.filter((c) => String(c.house) === form.house_id);
  const houseIngredients = ingredients.filter((i) => String(i.house) === form.house_id);
  const chosenRows = form.ingredient_rows.filter((r) => r.ingredient_id);
  const rowsValid = chosenRows.every((r) => r.amount !== "" && Number(r.amount) > 0);
  const canSubmit = form.name.trim() && form.house_id && rowsValid;

  async function submit() {
    setSaving(true);
    try {
      await api.createRecipe({
        house: Number(form.house_id),
        name: form.name.trim(),
        category: form.category_id ? Number(form.category_id) : null,
        recipe_ingredients: chosenRows.map((r) => ({
          ingredient: Number(r.ingredient_id),
          amount: Number(r.amount),
          unit: r.unit,
        })),
        instructions: form.instructions.trim(),
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
        <h2>Add a recipe</h2>
        {msg && <p className={`msg ${msg.t}`}>{msg.m}</p>}

        <label htmlFor="recipe-house">House</label>
        <select
          id="recipe-house"
          value={form.house_id}
          onChange={(e) => setForm((f) => ({ ...f, house_id: e.target.value, category_id: "", ingredient_rows: [] }))}
        >
          <option value="">Select a house…</option>
          {houses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>

        <label htmlFor="recipe-name">Name</label>
        <input
          id="recipe-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Pancakes"
        />

        <label htmlFor="recipe-category">Category</label>
        <select
          id="recipe-category"
          value={form.category_id}
          onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
        >
          <option value="">No category</option>
          {houseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {houseIngredients.length > 0 && (
          <>
            <label>Ingredients</label>
            <RecipeIngredientRows
              idPrefix="add-recipe"
              rows={form.ingredient_rows}
              ingredients={houseIngredients}
              onChange={(rows) => setForm((f) => ({ ...f, ingredient_rows: rows }))}
            />
          </>
        )}

        <label htmlFor="recipe-instructions">Instructions (optional)</label>
        <textarea
          id="recipe-instructions"
          rows={4}
          value={form.instructions}
          onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
        />

        <div className="row" style={{ marginTop: "1rem" }}>
          <button className="ghost fit" onClick={onClose}>Cancel</button>
          <button className="primary fit" disabled={!canSubmit || saving} onClick={submit}>
            {saving ? "Adding…" : "Add recipe"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecipeCard({ recipe, categories, ingredients, run }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const houseCategories = categories.filter((c) => c.house === recipe.house);
  const houseIngredients = ingredients.filter((i) => i.house === recipe.house);

  function startEdit() {
    setForm({
      name: recipe.name,
      category_id: recipe.category ? String(recipe.category) : "",
      ingredient_rows: (recipe.recipe_ingredients || []).map((ri) => ({
        ingredient_id: String(ri.ingredient),
        amount: String(ri.amount),
        unit: ri.unit,
      })),
      instructions: recipe.instructions || "",
    });
    setEditing(true);
  }

  const chosenRows = form ? form.ingredient_rows.filter((r) => r.ingredient_id) : [];
  const rowsValid = chosenRows.every((r) => r.amount !== "" && Number(r.amount) > 0);
  const canSave = form && form.name.trim() && rowsValid;

  async function save() {
    await run(
      () => api.updateRecipe(recipe.id, {
        name: form.name.trim(),
        category: form.category_id ? Number(form.category_id) : null,
        recipe_ingredients: chosenRows.map((r) => ({
          ingredient: Number(r.ingredient_id),
          amount: Number(r.amount),
          unit: r.unit,
        })),
        instructions: form.instructions.trim(),
      }),
      `Recipe '${form.name}' updated.`
    );
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="chore">
        <div className="meta" style={{ width: "100%" }}>
          <div className="row">
            <div>
              <label htmlFor={`rn-${recipe.id}`}>Name</label>
              <input
                id={`rn-${recipe.id}`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor={`rc-${recipe.id}`}>Category</label>
              <select
                id={`rc-${recipe.id}`}
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">No category</option>
                {houseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          {houseIngredients.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <label>Ingredients</label>
              <RecipeIngredientRows
                idPrefix={`edit-recipe-${recipe.id}`}
                rows={form.ingredient_rows}
                ingredients={houseIngredients}
                onChange={(rows) => setForm((f) => ({ ...f, ingredient_rows: rows }))}
              />
            </div>
          )}
          <label htmlFor={`ri-${recipe.id}`}>Instructions</label>
          <textarea
            id={`ri-${recipe.id}`}
            rows={3}
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          />
        </div>
        <div className="row chore-actions" style={{ gap: "0.4rem" }}>
          <button className="primary fit" disabled={!canSave} onClick={save}>Save</button>
          <button className="ghost fit" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </li>
    );
  }

  return (
    <li className="chore">
      <div className="meta">
        <div className="name">{recipe.name}</div>
        <ul className="sub-list">
          {recipe.category_name && <li>{recipe.category_name}</li>}
          {recipe.recipe_ingredients?.map((ri) => (
            <li key={ri.id}>{ri.amount} {ri.unit} {ri.ingredient_name}</li>
          ))}
        </ul>
        {recipe.instructions && (
          <p style={{ marginTop: "0.4rem", fontSize: "0.85rem", color: "var(--muted)" }}>
            {recipe.instructions}
          </p>
        )}
      </div>
      <div className="row chore-actions" style={{ gap: "0.4rem" }}>
        <button className="fit" onClick={startEdit}>Edit</button>
        <button
          className="danger fit"
          onClick={() => {
            if (confirm(`Delete recipe '${recipe.name}'?`))
              run(() => api.deleteRecipe(recipe.id), `Recipe '${recipe.name}' deleted.`);
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export default function Recipes() {
  const [houses, setHouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [ingredientFilter, setIngredientFilter] = useState([]);
  const [msg, setMsg] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const loadRecipes = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (categoryFilter) params.set("category", categoryFilter);
    ingredientFilter.forEach((id) => params.append("ingredient", id));
    api.recipes(params.toString()).then(setRecipes).catch((e) => setMsg({ t: "error", m: e.message }));
  };
  useEffect(() => { loadRecipes(); }, [search, categoryFilter, ingredientFilter]);

  const loadRefs = () => {
    api.houses().then(setHouses).catch((e) => setMsg({ t: "error", m: e.message }));
    api.recipeCategories().then(setCategories).catch((e) => setMsg({ t: "error", m: e.message }));
    api.ingredients().then(setIngredients).catch((e) => setMsg({ t: "error", m: e.message }));
  };
  useEffect(() => { loadRefs(); }, []);

  async function run(fn, okMsg) {
    try {
      const r = await fn();
      setMsg({ t: "ok", m: okMsg || r?.detail || "Saved." });
      loadRecipes();
      loadRefs();
    } catch (e) {
      setMsg({ t: "error", m: e.message });
    }
  }

  function toggleIngredientFilter(id) {
    setIngredientFilter((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );
  }

  return (
    <main>
      <div className="row" style={{ alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Recipes</h1>
        <button className="primary fit" onClick={() => setShowAdd(true)}>Add recipe</button>
        <button className="ghost fit" onClick={() => setShowCategories((v) => !v)}>
          {showCategories ? "Hide categories" : "Manage categories"}
        </button>
      </div>
      {msg && <p className={`msg ${msg.t}`}>{msg.m}</p>}

      {houses.length === 0 && (
        <p className="empty">Create a house first (under Houses) before adding recipes.</p>
      )}

      {showCategories && <CategoryManager houses={houses} categories={categories} run={run} />}

      {showAdd && (
        <AddRecipeModal
          houses={houses}
          categories={categories}
          ingredients={ingredients}
          onClose={() => setShowAdd(false)}
          onCreated={() => { loadRecipes(); setMsg({ t: "ok", m: "Recipe added." }); }}
        />
      )}

      <div className="card">
        <div className="row">
          <div>
            <label htmlFor="recipe-search">Search by name</label>
            <input
              id="recipe-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pancakes…"
            />
          </div>
          <div>
            <label htmlFor="recipe-category-filter">Category</label>
            <select
              id="recipe-category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        {ingredients.length > 0 && (
          <div style={{ marginTop: "0.6rem" }}>
            <label>Filter by ingredients</label>
            <IngredientChips
              items={ingredients}
              selected={ingredientFilter}
              onToggle={toggleIngredientFilter}
            />
          </div>
        )}
      </div>

      {recipes === null && <p>Loading…</p>}
      {recipes && recipes.length === 0 && <p className="empty">No recipes match.</p>}
      <ul className="plain" style={{ marginTop: "1rem" }}>
        {recipes?.map((r) => (
          <RecipeCard key={r.id} recipe={r} categories={categories} ingredients={ingredients} run={run} />
        ))}
      </ul>
    </main>
  );
}
