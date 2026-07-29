# Scripts

## `deploy-pages.mjs`

`bun run deploy` — builds the client and force-pushes `dist/` to the `gh-pages`
branch that GitHub Pages serves.

## Spell import

`public/spells.json` is generated, not hand-written. It holds every spell in
the [Archives of Nethys](https://www.aonprd.com/Spells.aspx) (Open Game
Content) that belongs to a class the app models, mapped to the level it is for
each of those classes.

Coverage comes from two places:

- The per-class list pages in `CLASSES`, which supply the one-line summaries.
  These are the six classes that know their entire spell list, so their
  coverage must be exact.
- `all.html`, the complete spell index, which catches everything else —
  wizard-only, bard-only, and so on.

Each spell's classes and levels are read from its own detail page, so a spell
lands on every list it belongs to regardless of which page found it.

Regenerate in three steps, run from the repo root:

```bash
# 1. Download the per-class list pages into a working directory, then parse
#    them into a union of spell names, levels and one-line summaries.
node scripts/import-spells-lists.mjs

# 2. Fetch each spell's detail page for school, components, range, duration,
#    saves and description. Resumable — rerun it if interrupted.
node scripts/import-spells-fetch.mjs

# 3. Emit public/spells.json.
node scripts/import-spells-generate.mjs
```

Steps 1 and 2 expect the list HTML in the same directory as the scripts:
`cleric.html`, `druid.html`, `paladin.html`, `ranger.html`, `warpriest.html`
and `shaman.html` from `https://www.aonprd.com/Spells.aspx?Class=<Name>`, plus
`all.html` from `https://www.aonprd.com/Spells.aspx?Class=All`. Without
`all.html` the import still works but covers only the six class lists.

Step 2 makes roughly 3,000 requests, so keep the concurrency low and be a good
citizen. It is resumable: `details.json` is written as it goes and rerunning
only fetches what is missing, so widening the set costs just the new spells.

Descriptions are trimmed to about 500 characters to keep the download
reasonable on a phone; the Archives entry remains the reference for full text.
Spells hand-written in `src/data/spellsData.ts` keep their longer descriptions
when the importer finds a matching id.
