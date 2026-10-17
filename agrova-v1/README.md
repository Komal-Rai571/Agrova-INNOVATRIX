# Agrova V1 — Basic Frontend (Reconstructed Baseline)

**Team INNOVATRIX** · HTML/CSS/JavaScript · October 2026 snapshot reconstruction

> **Historical accuracy:** The team's original V1 ZIP/source was unavailable. This V1 was recreated from the Agrova V2/V3 project concept and UI references in the conversation. It is NOT a recovered historical source tree. You may import it as the first Git snapshot now, but do not claim its Git commit was written in the past or by people who did not work on it.

## Run with VS Code (Windows)

1. Unzip and open the `agrova-v1` directory in **VS Code → File → Open Folder**.
2. Check that Node.js 18+ is installed: `node -v`.
3. In **Terminal → New Terminal**, run:

```powershell
npm start
```

4. Open **http://localhost:3000**.

No `npm install`, API key, external assets or database is required.
You may also double-click `START-WINDOWS.bat`. If port 3000 is occupied, stop the other Agrova server using Ctrl+C, or start V1 with `$env:PORT=3001; npm start` in PowerShell.

### Run tests

```powershell
npm test
```

## Included V1 features

- Professional, responsive Agrova brand and FPO overview dashboard
- Demo crop lots: Asha 30 kg Grade A, Ravi 40 kg Grade B, Meena 25 kg Grade A
- Editable lot quantities, grades and safety holds; creation of a new farmer lot
- Editable buyer order criteria; creation of another demo recovery buyer
- FreshMart demo original order: 80 kg Grade A → 55 kg eligible → 25 kg shortage
- SauceWorks demo: 30 kg Grade B at ₹16/kg → up to 30 kg potential gross ₹480
- Deterministic matching by crop, grade, safety, demand and buyer availability
- Browser `localStorage` persistence and Reset demo
- Basic calculation tests and cross-platform static server

## Deliberately NOT included (these were subsequent versions)

- No user login, shared database, multi-device synchronization, supplier network or procurement
- No buyer acceptance, stock reservation, delivery inspection or settlement
- No AI extraction, PDF evidence upload, payment integration, farmer ledger or net recovery optimizer

The quoted buyers, prices and farmers are entirely **illustrative**, not real orders.
A potential match is **not** a sale.

## Files

```
agrova-v1/
  public/
    index.html       Page shell
    styles.css       Responsive styling
    app.js           Client UI, forms, local state
    domain.mjs       Pure buyer matching calculations
    favicon.svg      Brand icon
  server.mjs         Minimal Node.js HTTP static server
  tests/             Automated matching logic tests
  docs/              Version history and Git guidance
  START-WINDOWS.bat  Windows launcher
  package.json       npm start / npm test scripts
```

## For chronological Git history

Commit each **snapshot in sequence**, after reviewing differences and excluding sensitive files:

1. Import this reconstructed V1 baseline and tag `v1.0.0`.
2. Replace working files (without touching `.git`) with the existing V2 source. Commit/tag `v2.0.0`.
3. Replace with V3 source and the Windows fix. Commit/tag `v3.0.0`.
4. Let each member implement real improvements on their own branch and open PRs for a subsequent release.

Versions can be ordered by release tags without fabricating timestamps or authorship. Existing V2/V3 history is a series of imported snapshots, not a replay of original individual contributions.

## Known limitations

This is for local demonstration and education. Browser edits are stored **only on that browser**. Do not treat this as a secure or production-ready agricultural procurement system.
