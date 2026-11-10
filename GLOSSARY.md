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

**Tab**:
A top-level section of the Docs Portal addressed to exactly one audience. There are two: the Operator tab (CLI and quickstart) and the Builder tab (build on Trajectonomics). Tabs are navigation in the header; a Tab's name is not repeated as a page title.
_Avoid_: Section, category, track

**Landing Page**:
The page at `/docs/` that names the two audiences and sends each to its Tab.
_Avoid_: Home page, index page, front page

**Upstream Package**:
A Trajectonomics repository whose releases the Docs Portal documents: `cli`, `sim-core`, `ledger-core`, `tax-core` and `design-system`.
_Avoid_: Dependency, upstream repo

**Docs Sync**:
The automated proposal of Docs Portal edits after an Upstream Package release. It only proposes; a human reviews every change before it lands.
_Avoid_: Auto-update, docs bot
