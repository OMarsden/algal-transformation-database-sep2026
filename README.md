# Algal Genetic Transformation Database

A curated, searchable catalog of **successful genetic transformation experiments in algae**, compiled from primary scientific literature. Covers two phyla:

- **Chlorophyta** (green algae) — 82 entries
- **Ochrophyta** (diatoms, eustigmatophytes, xanthophytes, brown algae) — 78 entries

**160 entries · 65 species · 15 method families · 101 with quantified efficiency · 1995–2026**

## Features

- Full-text search across species, strain, method, marker, authors, and titles
- Filters for clade, species, method family, and cellular compartment
- Toggle to show only entries with quantified transformation efficiency
- Sortable columns; every entry links to its source publication via DOI
- Works entirely client-side — no server or build step required

## Usage

**Option 1 — standalone file:** open `algae_transformation_db_standalone.html` in any browser. Everything (styles, data, logic) is inlined in one file.

**Option 2 — multi-file:** serve this folder with any static file server, e.g.:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

Opening `index.html` directly from disk also works (data is embedded via `data/entries.js`).

## Data

All entries live in [`data/entries.json`](data/entries.json). Each entry records: species, strain, clade, taxonomic class, target compartment (nuclear / chloroplast / mitochondrial), delivery method, selectable marker or reporter, transformation efficiency (verbatim from the source paper, or `null`), year, authors, title, journal, DOI, and notes.

### Caveats

- Efficiency metrics are **heterogeneous across studies** (transformants per µg DNA, per 10⁶–10⁸ cells, % positive cells, editing frequency) and are **not directly comparable between entries**.
- Some CRISPR-based entries report genome-editing or homologous-recombination frequencies rather than stable-transformation rates; this is flagged per entry in the notes.
- Entries without a retrievable quantified value are landmark transformation reports retained for completeness.

## Deployment

The site is pure static HTML/CSS/JS. To publish with GitHub Pages: Settings → Pages → deploy from branch (`main`, root). No build step needed.

## License

Data compiled from primary literature; each entry credits its original publication.
