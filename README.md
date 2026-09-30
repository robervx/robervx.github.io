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

Every project on the site — the featured and regular cards in the "Laboratorio" section on the homepage, and its own detail page — comes from a single Markdown file in `_projects/`. You can do this two ways: through the **[content admin](#editing-content-without-code)** (no code), or by hand:

1. Create `_projects/my-project.md` with front matter (copy an existing file as a starting point, e.g. `_projects/patrullas-valencia.md` for a rich example with code blocks and an interactive widget, or `_projects/focus.md` for a minimal one):

   ```yaml
   ---
   title: "My Project"
   title_es: "Mi Proyecto"
   title_en: "My Project"
   summary_es: "..."
   summary_en: "..."
   description: "..." # used for SEO/meta description
   status: in-progress   # in-progress | prototype | concept | unavailable
   status_es: "En desarrollo"
   status_en: "In progress"
   featured: false        # true = gets the large card with a cover image in the Lab
   date: 2026-09-30
   cover_image: /assets/images/projects/my-project-cover.svg   # only used if featured
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

Nothing else needs to change — the homepage grid and filters read the `_projects` collection automatically.

## Editing content without code

The site includes [Decap CMS](https://decapcms.org/) at `/admin/` — a form-based editor (title, status, tags, technologies, cover image, Markdown body) that commits straight to this repo, so no separate database or server is involved. It's already configured (`admin/config.yml`) for the `projects` collection described above.

**One-time setup before it can be used** (Decap needs to authenticate as you against GitHub, and that requires a small OAuth relay — GitHub Pages can't run one itself):

1. Create a GitHub OAuth App: **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
   - Homepage URL: `https://robervx.github.io`
   - Authorization callback URL: depends on the relay you pick in step 2 — it will tell you the exact value to use.
2. Deploy a small OAuth relay that exchanges the GitHub login for a token Decap can use (GitHub requires this exchange to happen somewhere that can hold a client secret, which a static site can't). The two well-documented, free options:
   - A one-click **Cloudflare Worker** deploy — search "Decap CMS OAuth provider Cloudflare Worker" for a current template; Cloudflare's free tier is enough.
   - A throwaway **Netlify** site connected to this same GitHub repo, using only Netlify's Identity + Git Gateway (you don't host the actual site there — the live site stays on GitHub Pages).
   - Decap's own docs keep an up-to-date list under "Backends → GitHub": https://decapcms.org/docs/github-backend/
3. Add `base_url` (and `auth_endpoint` if your relay needs it) to `admin/config.yml`, pointing at whatever URL step 2 gave you.
4. Visit `https://robervx.github.io/admin/` and log in with GitHub.

Until step 1–3 are done, `/admin/` loads but "Login with GitHub" won't complete.

## Architecture

- `_layouts/` — page shells (`default.html` for regular pages, `project.html` for project detail pages).
- `_includes/` — reusable chunks (nav, footer, tech badges, project cards, the homepage hero).
- `_data/tech.yml` — the tech-badge catalogue.
- `_projects/` — one Markdown file per project (a Jekyll collection).
- `assets/css/` — `styles.css` (site-wide design system), `project.css` (project detail pages), `hero.css` (the homepage's 3D experiment).
- `assets/js/` — language toggle, scroll reveal, Lab filters, code-block copy buttons, the interactive explainer widgets, and the 3D hero experiment.
- `assets/vendor/three/` — a locally vendored copy of [three.js](https://threejs.org/) (no CDN dependency) used only by the homepage hero.
