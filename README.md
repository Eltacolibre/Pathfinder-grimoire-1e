# Pathfinder 1e Spellbook & Tactical Grimoire Manager

An interactive, high-performance Pathfinder 1e (PF1e) Spellbook, Daily Preparation Manager, and Tactical Combat Calculator built with React, TypeScript, and Tailwind CSS. Based on official Paizo sources and [Archives of Nethys (aonprd.com)](https://www.aonprd.com/Spells.aspx).

## 🌟 Key Features

- **Archives of Nethys Pathfinder 1e Spell Library**: Comprehensive database of PF1e spells across all levels (0–9) and spellcasting classes.
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

1. Push this repository to GitHub.
2. In your GitHub Repository, go to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. Push to `main` or `master` branch. The automated workflow in `.github/workflows/deploy.yml` will automatically build and publish your site!

---

*Pathfinder and associated trademarks are property of Paizo Inc. Rules reference Archives of Nethys (aonprd.com).*
