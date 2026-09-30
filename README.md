# Rober Cerdán

Personal portfolio focused on public safety, urban intelligence, data and AI. Built with [Jekyll](https://jekyllrb.com/), deployed on GitHub Pages with no build step.

Website: https://robervx.github.io

## Running locally

```bash
bundle install
bundle exec jekyll serve
```

Then open http://127.0.0.1:4000.

## Adding a new project

Every project on the site — the "Current Work" and "Lab" cards on the homepage, and its own detail page — comes from a single Markdown file in `_projects/`. To add one:

1. Create `_projects/my-project.md` with front matter (copy an existing file as a starting point, e.g. `_projects/patrullas-valencia.md` for a rich example with code blocks and an interactive widget, or `_projects/city-monitor.md` for a minimal one):

   ```yaml
   ---
   title: "My Project"
   title_es: "Mi Proyecto"
   title_en: "My Project"
   summary_es: "..."
   summary_en: "..."
   description: "..." # used for SEO/meta description
   status: in-progress   # in-progress | prototype | concept
   status_es: "En desarrollo"
   status_en: "In progress"
   featured: false        # true = also shows in the homepage "Current Work" grid
   date: 2026-09-30
   cover_image: /assets/images/projects/my-project-cover.svg   # optional
   tags: [python, data-visualization]              # used by the Lab filters
   tag_pills:
     - { label: "Data Visualization", group: data } # group: data | ai | urban | comm | product
   tech: [python, pandas, scikit-learn]             # keys from _data/tech.yml
   repo_url: "https://github.com/robervx/my-project"
   ---
   ```

2. Write the body in Markdown below the front matter: headings, paragraphs, images, and fenced code blocks (` ```python `, ` ```r `, …) get syntax highlighting automatically.
3. To add a new technology badge, add one entry to `_data/tech.yml` (label, 2–3 letter abbreviation, and a colour group).
4. To embed an interactive "simulator" widget like the one in `patrullas-valencia.md`, copy its `<div class="explainer">` block and adjust the fields/weights — the behaviour is wired up in `assets/js/script.js`.

Nothing else needs to change — the homepage grids and filters read the `_projects` collection automatically.

## Architecture

- `_layouts/` — page shells (`default.html` for regular pages, `project.html` for project detail pages).
- `_includes/` — reusable chunks (nav, footer, tech badges, project cards, the homepage hero).
- `_data/tech.yml` — the tech-badge catalogue.
- `_projects/` — one Markdown file per project (a Jekyll collection).
- `assets/css/` — `styles.css` (site-wide design system), `project.css` (project detail pages), `hero.css` (the homepage's 3D experiment).
- `assets/js/` — language toggle, scroll reveal, Lab filters, code-block copy buttons, the interactive explainer widgets, and the 3D hero experiment.
- `assets/vendor/three/` — a locally vendored copy of [three.js](https://threejs.org/) (no CDN dependency) used only by the homepage hero.
