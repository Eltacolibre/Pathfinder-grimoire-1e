# Scripts

## `deploy-pages.mjs`

`bun run deploy` — builds the client and force-pushes `dist/` to the `gh-pages`
branch that GitHub Pages serves.

## Spell import

`public/spells.json` is generated, not hand-written. It holds the full Cleric,
Druid, Paladin, Ranger, Warpriest and Shaman lists from the
[Archives of Nethys](https://www.aonprd.com/Spells.aspx) (Open Game Content),
along with every other class those spells appear on.

Those six are the classes that know their entire spell list, so their coverage
has to be complete. Other classes are covered only where their spells overlap
those lists — add a class to `CLASSES` in `import-spells-lists.mjs` and rerun
to fill one in.

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

Steps 1 and 2 expect the class list HTML in the same directory as the scripts
(`cleric.html`, `druid.html`, `paladin.html`, `ranger.html`, `warpriest.html`,
`shaman.html`), downloaded from
`https://www.aonprd.com/Spells.aspx?Class=<Name>`. Step 2 makes roughly 1,900
requests, so keep the concurrency low and be a good citizen. It is resumable:
`details.json` is written as it goes, and rerunning only fetches what is
missing, so adding a class costs just the new spells.

Descriptions are trimmed to about 500 characters to keep the download
reasonable on a phone; the Archives entry remains the reference for full text.
Spells hand-written in `src/data/spellsData.ts` keep their longer descriptions
when the importer finds a matching id.
