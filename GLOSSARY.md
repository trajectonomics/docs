# Trajectonomics Docs

The public documentation portal for the Trajectonomics ecosystem, written for two audiences and served under `trajectonomics.com/docs`.

## Language

**Docs Portal**:
The public documentation site for Trajectonomics. Everything in it is public; nothing about private infrastructure appears.
_Avoid_: Docs site, developer portal, wiki

**Operator**:
A person who installs and runs the Trajectonomics CLI.
_Avoid_: User, end user, customer

**Builder**:
A person who builds on Trajectonomics packages or contributes to them.
_Avoid_: Developer, consumer, contributor

**Agent**:
The model-driven program a person runs beside the CLI: it asks for the facts and reads the results, while `traj` computes them.
_Avoid_: Bot, assistant

**Data directory**:
The one directory `traj` keeps on a machine, `~/.traj` or `$TRAJ_HOME`: the ledger in `traj.db` and the npm launcher's `bin/` cache.
_Avoid_: Data folder, state directory

**Tab**:
A top-level section of the Docs Portal addressed to exactly one audience. There are two: the Operator tab (CLI and quickstart) and the Builder tab (build on Trajectonomics). Tabs are navigation in the header; a Tab's name is not repeated as a page title.
_Avoid_: Section, category, track

**Command reference**:
The Operator tab's pages that document every released `traj` leaf and its flags: one page per top-level command, one section per leaf beneath it. The check in `.github/workflows/command-reference.yml` fails when they disagree with the published release ([ADR 0011](./docs/adr/0011-command-reference-drift-is-checked-by-a-workflow.md)).
_Avoid_: CLI docs, reference docs, man pages

**Landing Page**:
The page at `/docs/` that names the two audiences and sends each to its Tab.
_Avoid_: Home page, index page, front page

**Release Line**:
The one line on the Landing Page naming the release of `traj` the Operator content was synced from, read from the sync manifest.
_Avoid_: Version line, version footer, latest release

**Site Home**:
The page at `/` on trajectonomics.com, built and deployed by `trajectonomics/site`, outside the Docs Portal.
_Avoid_: Landing Page (that is the page at `/docs/`)

**Sitemap**:
The machine-readable list of the Docs Portal's pages, served at `/docs/sitemap.xml` and generated at build time from the same content collection the search index reads. It is not the Site's sitemap at `/sitemap.xml`, which lists the Site's two language homes.
_Avoid_: page list, XML index, page index

**Upstream Package**:
A Trajectonomics repository whose releases the Docs Portal documents: `cli`, `sim-core`, `ledger-core`, `tax-core` and `design-system`.
_Avoid_: Dependency, upstream repo

**Docs Sync**:
The automated proposal of Docs Portal edits after an Upstream Package release. It only proposes; a human reviews every change before it lands.
_Avoid_: Auto-update, docs bot

**Backfill**:
The first authored pages for an Upstream Package, written by hand from its latest release. Docs Sync only proposes edits to them afterwards.
_Avoid_: Import, mirror, migration

**Markdown twin**:
The Markdown form of a page, served at the page's path with `.md` in place of its trailing slash (and at `/docs/index.md` for the Landing Page). It is the authored page, not a second copy: the same words with their links made absolute.
_Avoid_: Markdown export, plain-text version

**Docs index**:
The file at `/docs/llms.txt` that names every page of the Docs Portal and its Markdown twin, in the order the Tabs present them. An Agent reads it first.
_Avoid_: Sitemap, index file
