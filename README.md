# Pathfinder 1e Spellbook & Tactical Grimoire Manager

An interactive, high-performance Pathfinder 1e (PF1e) Spellbook, Daily Preparation Manager, and Tactical Combat Calculator built with React, TypeScript, and Tailwind CSS. Based on official Paizo sources and [Archives of Nethys (aonprd.com)](https://www.aonprd.com/Spells.aspx).

## 🌟 Key Features

- **Archives of Nethys Pathfinder 1e Spell Library**: 3,021 spells covering every class the app models — the complete PF1e set (Cleric 1,128 · Wizard 1,905 · Sorcerer 1,893). Loaded from `public/spells.json` after first paint; see [`scripts/README.md`](scripts/README.md) to regenerate.
- **AI Lore Advisor (bring your own key)**: Optional Gemini-powered PF1e rules consultant. The key is stored in your browser only and sent straight to Google.
- **Divine / Full List Class Auto-Inscribe**: Full class-list divine casters (*Cleric, Druid, Ranger, Paladin, Shaman, Warpriest*) can instantly auto-inscribe all granted spells on their class list directly into their grimoire with one click.
- **Multiclassing Support**: Full support for multiclass characters! Manage multiple spellcasting classes (e.g. Cleric 5 / Wizard 3), each with independent caster levels, ability scores, spell slots, and prepared spell lists.
- **Dual Cleric Domains Support**: Clerics can configure their 2 divine domains or subdomains with automatic domain slot tagging and granted domain spell highlights.
- **PF1e Tactical Combat Calculator**: Built-in Concentration Roller (defensive casting, injury DC thresholds, Combat Casting feat) and Spell Resistance (SR) check roller.
- **Export & Homebrew**: Print high-contrast character spell sheets to PDF or create custom homebrew spells.
- **Mobile & Desktop Ability Score Customization**: Direct numerical input for ability scores with instant PF1e modifier calculation (`(Score - 10) / 2`).

## ☕ Support the Project

If you find this Pathfinder 1e tool useful for your tabletop gaming sessions, feel free to support development on Ko-Fi!

👉 **[Support on Ko-Fi](https://ko-fi.com/bagquest)**

## 🚀 Getting Started

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/pf1e-grimoire-manager.git
   cd pf1e-grimoire-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

### Deploying to GitHub Pages

Live at **<https://eltacolibre.github.io/Pathfinder-grimoire-1e/>**. `main` holds the
source; the built site lives on the `gh-pages` branch.

```bash
bun run deploy
```

That builds the client and force-pushes `dist/` to `gh-pages`. Only the client is
deployed — `server.ts` has no role on a static host.

A GitHub Actions workflow (`.github/workflows/deploy.yml`) is also included for
deploying on every push. Using it needs a token with the `workflow` scope
(`gh auth refresh -s workflow`), after which you can commit it and switch the
Pages source to **GitHub Actions**.

---

*Pathfinder and associated trademarks are property of Paizo Inc. Rules reference Archives of Nethys (aonprd.com).*
