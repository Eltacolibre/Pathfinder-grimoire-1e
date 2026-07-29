# Pathfinder 1e Grimoire

A spellbook manager for Pathfinder 1st Edition casters — track what your character knows, prepare slots each morning, and check the maths at the table.

**▶ [Open the app](https://eltacolibre.github.io/Pathfinder-grimoire-1e/)** — free, no account, nothing to install.

Everything is saved in your browser, so it works offline once loaded. Nothing is uploaded to a server.

---

## What it does

- **Daily preparation** — slot capacity per spell level (base + ability bonus + domain/specialty), prepare and re-prepare spells, mark them cast, and reset with a long rest.
- **Grimoire** — the spells your character knows, with filtering by level, school, and class.
- **Paizo Archives** — browse the bundled spell database and add spells to a character in one click.
- **20 caster classes** — Wizard, Cleric, Druid, Sorcerer, Bard, Witch, Magus, Alchemist/Investigator, Oracle, Inquisitor, Paladin, Ranger, Psychic, Shaman, Summoner, Bloodrager, Medium, Mesmerist, Occultist, and Spiritualist. Prepared, spontaneous, and formulae casting are each handled on their own terms, across arcane, divine, and occult lists.
- **Specialisation** — wizard schools with opposition schools, and 26 cleric domains with their granted slots.
- **Tactical calculator** — concentration checks, save DCs, caster level checks, and spell resistance.
- **Homebrew spells** — add your own; they sit alongside the official ones and persist.
- **PDF export** — a printable spell sheet for the character.
- **AI Lore Advisor** — an optional PF1e rules consultant (see below).

The bundled database ships with 54 commonly used spells rather than the full PF1e catalogue. It covers the staples for the preset characters; anything missing can be added as a homebrew entry.

## The AI Lore Advisor

Optional, and off until you supply a key. Click **AI Lore Advisor**, then the key icon, and paste a [free Gemini API key](https://aistudio.google.com/apikey).

The key is stored in your browser's `localStorage` and sent directly to Google. It never reaches the host of this site — there is no backend on GitHub Pages to receive it. Clear the field and save to remove it.

Everything else in the app works without a key.

## Running it locally

Local dev additionally runs a small Express server, which lets the AI advisor use a key from your environment instead of asking each visitor for one.

```bash
bun install
cp .env.example .env   # then set GEMINI_API_KEY, or leave it to skip the AI feature
bun dev                # http://localhost:3000
```

If a key is saved in the browser it takes priority over the server's.

## Deploying

`main` is the source; the built site lives on the `gh-pages` branch.

```bash
bun run deploy
```

That builds the client and force-pushes `dist/` to `gh-pages`. Only the client is deployed — `server.ts` has no role on a static host.

There is a ready-made GitHub Actions workflow at `.github/workflows/deploy.yml` for deploying on every push instead. Using it needs a token with the `workflow` scope (`gh auth refresh -s workflow`), after which you can commit the file and switch the Pages source to **GitHub Actions**.

## Built with

Vite, React 19, TypeScript, Tailwind CSS v4, jsPDF, and lucide-react.

## Support

This is free and stays free. If it saved you some prep time, you can [buy me a coffee on Ko-fi](https://ko-fi.com/bagquest).

More free tools for the table: **[MapForge](https://eltacolibre.github.io/mapforge/)** (battle maps and tokens) and **[Dice Tray](https://eltacolibre.github.io/dice-tray/)** (a multi-system roller). TTRPG PDFs at **[bagquest.itch.io](https://bagquest.itch.io)**.

## Legal

An unofficial fan tool, not affiliated with or endorsed by Paizo Inc. Pathfinder and associated marks are trademarks of Paizo Inc. Spell content is used under the Open Game License.
