# Acreo

Acreo is a Chrome extension that aggregates property listings from **MagicBricks**, **99acres**, and **NoBroker** into a single, organized table. It provides powerful filtering and comparison tools, helping users discover the best properties faster without switching between multiple websites.

---

## ✨ Features

- 🏠 Scrapes property listings from:
  - MagicBricks
  - 99acres
  - NoBroker
- 📋 Displays all listings in a unified table
- 🔍 Filter properties based on different criteria
- ⚡ Quickly compare listings from multiple platforms
- 🧹 Removes the hassle of manually checking different websites

---

## 📂 Project Structure

```
Acreo/
├── background/
├── content-scripts/
│   ├── magicbricks.js
│   ├── 99acres.js
│   └── ...
├── ui/
│   ├── src/
│   ├── index.html
│   ├── output.css
│   └── package.json
├── manifest.json
├── .gitignore
└── README.md
```

---

## 🚀 Installation

1. Clone the repository.

```bash
git clone https://github.com/<your-username>/Acreo.git
```

2. Install UI dependencies.

```bash
cd ui
npm install
```

3. Build the UI (if required).

```bash
npm run build
```

4. Open Chrome and go to:

```
chrome://extensions
```

5. Enable **Developer Mode**.

6. Click **Load unpacked** and select the project folder.

---

## 🛠️ Tech Stack

- JavaScript
- HTML
- CSS / Tailwind CSS
- Chrome Extension Manifest V3

---

## 📌 How It Works

1. Visit a supported property website.
2. Acreo extracts listing information.
3. Listings are stored and displayed in a centralized table.
4. Apply filters to narrow down properties.
5. Compare listings across different platforms in one place.

---

## 📅 Roadmap

- [ ] Support additional real estate platforms
- [ ] Advanced filtering
- [ ] Sorting by price, area, and locality
- [ ] Export listings to CSV
- [ ] Favorites & saved searches
- [ ] Property change notifications

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is licensed under the MIT License.