# FinanceFlux

FinanceFlux is a lightweight web-based accounting application built with [Bun](https://bun.sh/), Express, SQLite, and Handlebars. It features a simple Vue-powered frontend (via CDN) and aims to provide efficient and fast financial management for small businesses.

## ✅ Features

* Lightweight accounting management
* Handlebars templating for dynamic server-side views
* Vue-enhanced UI components using CDN
* Persistent data using SQLite
* Fast and modern backend powered by Bun

## 🛠 Tech Stack

* **Backend**: [Bun](https://bun.sh/), [Express](https://expressjs.com/), [SQLite](https://www.sqlite.org/)
* **Templating**: [Handlebars](https://handlebarsjs.com/)
* **Frontend**: [Vue.js (via CDN)](https://cdn.jsdelivr.net/npm/vue@3)
* **Testing**: [Bun Test](https://bun.sh/docs/cli/test), [Playwright](https://playwright.dev/)


## ⚙️ Installation

### 1. Install Dependencies

```bash
bun install
```

### 2. Initialize the Database

```bash
bun run init:db
```

This will create a new SQLite database with the required schema.

### 3. Run the Application

```bash
bun run start
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

### Running Unit Tests

The project uses Bun's built-in test runner for unit and integration tests:

```bash
bun test
```

### Running End-to-End Tests with Playwright

The project includes end-to-end tests with Playwright that test the application in real browsers:

```bash
# Install Playwright browsers (first time only)
bunx playwright install

# Run Playwright tests
bun run test:playwright
```

To view the Playwright test report:

```bash
bunx playwright show-report
```

## 📁 Project Structure

```
fluxfinance/
├── views/              # Handlebars templates
├── public/             # Static assets (CSS, JS, icons)
├── routes/             # Express route modules
├── db/                 # SQLite DB and schema setup
├── app.js              # Main server entry point
├── init-db.js          # DB initialization script
└── bun.lockb           # Bun lockfile
```


## 📃 License

MIT License © 2025 FluxFinance Team