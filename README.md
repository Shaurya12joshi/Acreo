# Acreo

Acreo is a Chrome extension that aggregates property listings from **MagicBricks**, **99acres**, and **NoBroker** into a single, organized table. It provides powerful filtering and comparison tools, helping users discover the best properties faster without switching between multiple websites.

---

## ✨ Features

- 🏠 Automatically captures property listings as you browse:
  - MagicBricks
  - 99acres
  - NoBroker
- 📋 Displays all listings in a unified, comparison-ready table (price, area, price/area, type, source)
- 🔍 Filter listings by Category (Buy/Rent), Type (Apartment/Land/Other), Source, BHK, Furnishing, Tenant preference, and Seen/Not Seen — with filters automatically greying out when there are no matching listings
- 👀 Tracks which listings you've already seen, in sync with the source site
- 🔎 A "View More Details" panel for extra info (Tenant, Gated, etc.) without cluttering the main table
- 📁 One-click export of your full comparison table to Excel
- 🔗 Jump straight back to the original listing to contact the owner or broker
- 🔒 Everything stays on your own device — no account, no server, nothing uploaded
- 🧹 Removes the hassle of manually checking different websites

---

## 📂 Project Structure

```
Acreo/
├── background/
│   └── background.js
├── content-scripts/
│   ├── magicbricks.js
│   ├── 99acres.js
│   └── nobroker.js
├── ui/
│   ├── src/
│   │   └── input.css
│   ├── assets/
│   ├── vendor/
│   │   └── xlsx.core.min.js
│   ├── index.html
│   ├── app.js
│   ├── output.css
│   └── package.json
├── landing/
│   ├── assets/
│   ├── index.html
│   └── output.css
├── manifest.json
├── .gitignore
├── README.md
└── ReleaseNotes.md
```

---

## 🚀 Installation

1. Clone the repository.

```bash
git clone https://github.com/<your-username>/Acreo.git
```

2. Open Chrome and go to:

```
chrome://extensions
```

3. Enable **Developer Mode**.

4. Click **Load unpacked** and select the `Acreo` folder (the one containing `manifest.json`).

That's it — no build step is required to run the extension, since the compiled CSS is already committed. You only need step 5 below if you're editing styles.

### Optional: rebuilding the UI styles

If you change anything in `ui/src/input.css`, rebuild `ui/output.css`:

```bash
cd ui
npm install
npm run build:css
```

Use `npm run watch:css` instead to rebuild automatically while you work.

---

## 🛠️ Tech Stack

- Vanilla JavaScript (content scripts, background service worker, UI)
- HTML
- Tailwind CSS v4
- SheetJS (`xlsx`) for Excel export
- Chrome Extension Manifest V3

---

## 📌 How It Works

1. Visit a supported property website (MagicBricks, 99acres, or NoBroker) and browse as usual.
2. Acreo automatically captures each listing you view — no button to click.
3. Listings are stored locally and displayed in Acreo's unified table.
4. Apply filters to narrow down properties by category, type, source, BHK, furnishing, tenant preference, or seen status.
5. Compare listings side by side, open "View More Details" for the full picture, or jump back to the source to contact the owner or broker.

---

## 📅 Roadmap

- [ ] Support additional real estate platforms
- [ ] Sorting by price, area, and locality
- [ ] Favorites & saved searches
- [ ] Property change notifications

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is licensed under the MIT License.