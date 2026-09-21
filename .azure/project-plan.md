# Project Plan

**Status**: Integrated
**Created**: 2026-09-21
**Mode**: NEW

---

## 1. Project Overview

**Goal**: Build a browser-based lot calculator for trading and portfolio sizing so users can enter market assumptions, compute a recommended position size, and review the calculation with a clear reset action. The project is designed so that every module is independently testable.

**App Type**: Static + API

**API Login**: No

**Mode**: NEW

**Deployment Plan**: No deployment plan found

---

## 2. Frontend — Web App

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Runtime** | Node |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |

---

## 3. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| Azure Static Web Apps | Host the React app and serve the calculator UI | `VITE_APP_NAME` | `lot-calculator-local` | Essential |

---

## 4. Prerequisites

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Node.js | frontend | ✅ | 22.14.0 |
| npm | frontend | ✅ | 10.9.2 |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Microsoft Edge | frontend | ❓ | n/a |

---

## 5. Project Structure

```text
lot-calculator/
├─ package.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ index.html
├─ src/
│  ├─ app/
│  │  ├─ App.tsx
│  │  └─ App.css
│  ├─ components/
│  │  ├─ CalculatorForm.tsx
│  │  ├─ ResultsCard.tsx
│  │  └─ ResetButton.tsx
│  ├─ hooks/
│  │  └─ useLotCalculator.ts
│  ├─ utils/
│  │  ├─ lotCalculator.ts
│  │  └─ formatters.ts
│  ├─ styles/
│  │  └─ tokens.css
│  ├─ main.tsx
│  └─ vite-env.d.ts
├─ public/
│  └─ favicon.svg
└─ tests/
   └─ lotCalculator.test.ts
```

---

## 6. Design System & UI

**Component Library**: Fluent UI v9
**Style Direction**: A clean trading dashboard with elevated panels, a strong data-first layout, and 4px rounded surfaces that keep decisions highly scannable.
**Typography**: Segoe UI Variable

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#0f766e` | Main action buttons, active indicators, primary trade controls |
| `accent` | `#f59e0b` | Secondary highlights, risk emphasis, positive alerts |
| `surface` | `#f8fafc` | App background and card surfaces |
| `text` | `#0f172a` | Primary body text and headings |
| `muted` | `#64748b` | Secondary text, captions, and helper labels |
| `border` | `#cbd5e1` | Dividers, form outlines, and card borders |

### Pages

| Page | Route | Purpose | Layout |
|------|-------|---------|--------|
| Calculator | `/` | Calculate position size, entry, and stop-loss trade assumptions | `header + hero + form + actions + table` |
| Results | `/results` | Review the trade breakdown and support a final decision | `header + card-list + actions` |

### Sample Content

```text
Calculator — trade inputs:
| Pair | Balance | Risk % | Entry | Stop | Lot Size |
| EURUSD | $10,000 | 1.5% | 1.0820 | 1.0780 | 0.72 |
| XAUUSD | $25,000 | 2.0% | 2350.20 | 2344.80 | 0.54 |
| NAS100 | $15,000 | 1.0% | 19800 | 19740 | 1.20 |

Results — trade overview: risk: 1.5% · account currency: USD · stop distance: 40 pips
```

---

## 7. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Status Codes |
|---|--------|------|-------------|-------------|--------------|-------------|
| 1 | GET | `/` | Serve the main lot calculator UI | — | `HTML shell with the calculator form and summary` | 200 |
| 2 | GET | `/results` | Serve the result review view in the single-page app | — | `HTML shell with calculated trade summary` | 200 |

---

## 8. Next Steps

1. Run **azure-project-scaffold** to execute this plan
2. Run **azure-project-integrate** to wire the frontend to live data, smoke-test the backend, and create the migrations
3. Run **azure-debug-plan** → **azure-debug-generate** for Docker emulators and VS Code debugging
4. Run the **azure-deploy** agent when ready; it uses **azure-app-onboard** for architecture, cost estimation, IaC generation, provisioning, and health verification
