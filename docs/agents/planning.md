# Planning

What a plan, an issue and a pull request say about the work they propose: what it will do, what it will not, and what a change a reader of the Docs Portal can see will look like.

## Goals and non-goals

Every plan and issue states its goals and its **non-goals**: the work that is deliberately left out. Anything a reader of the plan could expect and the work does not cover belongs in the non-goals, so that leaving it out is a choice rather than an accident.

A Spec draft's **Out of Scope** section is its non-goals list. A draft that rules nothing out says "None" there; an empty section is not the same answer.

## The audit

Six things disappear from plans when nobody names them. Mark each one a goal, a non-goal, or not applicable:

- **Visual language**: what the change looks like, and against which reference.
- **Copy**: the words on the page, and who writes them.
- **Accessibility**: keyboard use, landmarks, contrast, and the accessible name of anything new.
- **Performance**: what the change costs a page load.
- **Mobile**: how it behaves at 390 px.
- **Dark mode**: how it looks with the dark colour scheme.

A bare omission is neither a goal nor a non-goal, and a reviewer may send the plan back for it.

## Surface & design

User-facing work adds a **Surface & design** section. Work is user-facing when it changes what a reader of the Docs Portal sees or does: the shell, layout, styling, components, copy inside components, page templates, and the 404 page.

The section names:

- **The reference** the result is measured against. A change that follows the design brief behind [`0004-docs-portal-shell.md`](../adr/0004-docs-portal-shell.md) cites it: Stripe Docs and its three traits (the audience split in persistent navigation, a readable column with generous vertical rhythm, restrained neutral chrome). A deviation from the brief says why.
- **The states** the surface handles, linked to the [Surface states](../design/portal-shell.md#surface-states) table rather than copied from it. A state the change does not reach says so.
- **The screenshots**, attached by hand at 1280, 2000 and 390 px, in light and dark mode. Those are the widths in [`0004-browser-tests-run-outside-the-deploy-gate.md`](../adr/0004-browser-tests-run-outside-the-deploy-gate.md) and in [the design brief](../design/portal-shell.md). That ADR's `e2e` job already uploads a `screenshots` artifact at the three widths, so the section may link it for them; dark mode stays a manual screenshot until the job captures it.

Plain content edits to existing MDX pages need no Surface & design section. A content change that adds a layout or a component does. When a case is borderline, say under Surface & design why the work does or does not count.

## Where the rule is checked

The rule is a convention, checked by people and by reviewers; no CI step enforces it. The feature request template asks for non-goals and Surface & design where work is proposed, and the pull request template asks for the design section where it lands. Revisit this when the `e2e` job of [`0004-browser-tests-run-outside-the-deploy-gate.md`](../adr/0004-browser-tests-run-outside-the-deploy-gate.md) becomes a required check.

## Language

The audience is a **reader of the Docs Portal** ([`GLOSSARY.md`](../../GLOSSARY.md)): never an end user or a user. "User-facing" describes work a reader can see or do; it never names the person.
