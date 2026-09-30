/* Chlorophyta Transformation Database — client-side rendering, search, filter, sort */

"use strict";

let ENTRIES = [];
let META = {};
let sortState = { key: "year", dir: "desc" };

const els = {
  search: document.getElementById("search"),
  clade: document.getElementById("filter-clade"),
  species: document.getElementById("filter-species"),
  method: document.getElementById("filter-method"),
  compartment: document.getElementById("filter-compartment"),
  onlyEff: document.getElementById("only-efficiency"),
  reset: document.getElementById("reset"),
  body: document.getElementById("table-body"),
  count: document.getElementById("count"),
  table: document.getElementById("db-table"),
};

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function compartmentBadge(c) {
  const cls = "badge badge-" + c.toLowerCase();
  return '<span class="' + cls + '">' + escapeHtml(c) + "</span>";
}

function citationCell(e) {
  const link = e.url
    ? '<a class="cite-link" href="' + escapeHtml(e.url) + '" target="_blank" rel="noopener">' +
      escapeHtml(e.authors) + " (" + escapeHtml(e.year) + ")</a>"
    : escapeHtml(e.authors) + " (" + escapeHtml(e.year) + ")";
  let html = link;
  if (e.title) html += '<span class="cite-title">' + escapeHtml(e.title) + "</span>";
  if (e.journal) html += '<span class="cite-journal">' + escapeHtml(e.journal) + "</span>";
  if (e.notes) html += '<span class="note-flag">Note: ' + escapeHtml(e.notes) + "</span>";
  return html;
}

function efficiencyCell(e) {
  if (e.hasEfficiency && e.efficiency) return escapeHtml(e.efficiency);
  return '<span class="no-eff">Not quantified in accessible text</span>';
}

function methodCell(e) {
  return compartmentBadge(e.compartment) +
    '<span class="method-text">' + escapeHtml(e.methodGroup) + "</span>" +
    (e.method && e.method.toLowerCase() !== e.methodGroup.toLowerCase()
      ? '<span class="cite-journal">' + escapeHtml(e.method) + "</span>" : "");
}

function speciesCell(e) {
  let html = escapeHtml(e.species);
  const tag = e.oclass || e.clade;
  if (tag) html += '<span class="clade-tag">' + escapeHtml(tag) + "</span>";
  return html;
}

function render() {
  const q = els.search.value.trim().toLowerCase();
  const cl = els.clade.value;
  const sp = els.species.value;
  const me = els.method.value;
  const co = els.compartment.value;
  const onlyEff = els.onlyEff.checked;

  let rows = ENTRIES.filter(function (e) {
    if (cl && e.clade !== cl) return false;
    if (sp && e.species !== sp) return false;
    if (me && e.methodGroup !== me) return false;
    if (co && e.compartment !== co) return false;
    if (onlyEff && !e.hasEfficiency) return false;
    if (q) {
      const hay = [e.species, e.strain, e.method, e.methodGroup, e.marker,
        e.authors, e.title, e.journal, e.efficiency, e.year, e.clade, e.oclass]
        .join(" ").toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });

  const dir = sortState.dir === "asc" ? 1 : -1;
  const key = sortState.key;
  rows.sort(function (a, b) {
    let va = a[key], vb = b[key];
    if (key === "year") { va = va || 0; vb = vb || 0; return (va - vb) * dir; }
    va = String(va == null ? "" : va).toLowerCase();
    vb = String(vb == null ? "" : vb).toLowerCase();
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });

  if (rows.length === 0) {
    els.body.innerHTML = '<tr><td colspan="7" class="loading">No entries match the current filters.</td></tr>';
  } else {
    els.body.innerHTML = rows.map(function (e) {
      return "<tr>" +
        '<td class="species">' + speciesCell(e) + "</td>" +
        '<td>' + escapeHtml(e.strain) + "</td>" +
        '<td class="method-cell">' + methodCell(e) + "</td>" +
        '<td class="marker-cell">' + escapeHtml(e.marker) + "</td>" +
        '<td class="eff-cell">' + efficiencyCell(e) + "</td>" +
        '<td class="year-cell">' + escapeHtml(e.year) + "</td>" +
        "<td>" + citationCell(e) + "</td>" +
        "</tr>";
    }).join("");
  }

  els.count.textContent = "Showing " + rows.length + " of " + ENTRIES.length +
    " entries" + (META.withEfficiency != null
      ? " (" + META.withEfficiency + " with quantified efficiency in full dataset)"
      : "") + ".";
}

function populateFilters() {
  const clades = Array.from(new Set(ENTRIES.map(function (e) { return e.clade; })))
    .filter(Boolean).sort();
  clades.forEach(function (c) {
    const o = document.createElement("option");
    o.value = c; o.textContent = c;
    els.clade.appendChild(o);
  });
  const species = Array.from(new Set(ENTRIES.map(function (e) { return e.species; }))).sort();
  const methods = Array.from(new Set(ENTRIES.map(function (e) { return e.methodGroup; }))).sort();
  species.forEach(function (s) {
    const o = document.createElement("option");
    o.value = s; o.textContent = s;
    els.species.appendChild(o);
  });
  methods.forEach(function (m) {
    const o = document.createElement("option");
    o.value = m; o.textContent = m;
    els.method.appendChild(o);
  });
}

function updateSortIndicators() {
  document.querySelectorAll("th.sortable").forEach(function (th) {
    th.classList.remove("sorted-asc", "sorted-desc");
    if (th.dataset.sort === sortState.key) {
      th.classList.add(sortState.dir === "asc" ? "sorted-asc" : "sorted-desc");
    }
  });
}

function loadData() {
  // Prefer embedded data (works from file:// where fetch is blocked by CORS)
  if (window.DB_DATA && window.DB_DATA.entries) {
    return Promise.resolve(window.DB_DATA);
  }
  return fetch("data/entries.json")
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
}

function init() {
  loadData()
    .then(function (data) {
      ENTRIES = data.entries || [];
      META = data.meta || {};
      document.getElementById("stat-entries").textContent = META.entryCount ?? ENTRIES.length;
      document.getElementById("stat-species").textContent = META.speciesCount ??
        new Set(ENTRIES.map(function (e) { return e.species; })).size;
      document.getElementById("stat-methods").textContent =
        new Set(ENTRIES.map(function (e) { return e.methodGroup; })).size;
      document.getElementById("stat-eff").textContent = META.withEfficiency ??
        ENTRIES.filter(function (e) { return e.hasEfficiency; }).length;

      populateFilters();
      updateSortIndicators();
      render();

      els.search.addEventListener("input", render);
      els.clade.addEventListener("change", render);
      els.species.addEventListener("change", render);
      els.method.addEventListener("change", render);
      els.compartment.addEventListener("change", render);
      els.onlyEff.addEventListener("change", render);
      els.reset.addEventListener("click", function () {
        els.search.value = "";
        els.clade.value = "";
        els.species.value = "";
        els.method.value = "";
        els.compartment.value = "";
        els.onlyEff.checked = true;
        render();
      });

      document.querySelectorAll("th.sortable").forEach(function (th) {
        th.addEventListener("click", function () {
          const k = th.dataset.sort;
          if (sortState.key === k) {
            sortState.dir = sortState.dir === "asc" ? "desc" : "asc";
          } else {
            sortState = { key: k, dir: k === "year" ? "desc" : "asc" };
          }
          updateSortIndicators();
          render();
        });
      });
    })
    .catch(function (err) {
      els.body.innerHTML = '<tr><td colspan="7" class="loading">Failed to load database: ' +
        escapeHtml(err.message) + "</td></tr>";
    });
}

init();
