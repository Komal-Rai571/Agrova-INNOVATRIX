# Agrova V2 — Crop Recovery & Settlement OS

**Team INNOVATRIX** • Offline-first, full-stack hackathon prototype • October 2026

> Every mismatch deserves a better next move. Track the original buyer shortage, recovery sale, delivery evidence, and settlement review in one connected case.

## Run in under 2 minutes

**Prerequisite: Node.js 22 or newer.** No npm install or package download is necessary.

```bash
cd agrova-v2
npm start
```

Open **http://localhost:3000** in your browser. To run automated business-rule tests:

```bash
npm test
```

On Windows, you can open PowerShell in the project folder and run `npm start`. Or double-click `START-WINDOWS.bat` (Node.js 22 must already be installed). To choose another port, set `PORT=4000` in a copied `.env` file.

### Sign in with demo accounts

| Account | Email | Password |
|---|---|---|
| FPO manager | `manager@agrova.test` | `Agrova123!` |
| SauceWorks buyer | `sauce@agrova.test` | `Buyer123!` |
| FreshMart buyer | `fresh@agrova.test` | `Buyer123!` |

**These credentials are for an isolated demo. Change/remove them before any public deployment.** The login screen also shows these accounts so judges can test immediately.

## What actually works

- Manager/buyer **different-role logins** using server sessions, password hashing, and an SQLite-backed shared datastore. Multiple browser tabs/devices using **the same reachable server** see the same records.
- Create and revise **farmer lots** (crop, grade, safety, quantity) and **buyer orders** (demand, rate, availability).
- **Grade/safety matching** and original shortage calculation, recalculated when inputs change.
- Multi-buyer recovery candidate comparison. Alternative buyer demand and inventory limit actual offers.
- Send an offer → buyer accepts in buyer portal (or manager selects an **explicitly labelled simulation**) → FPO manager confirms reservation.
- **Atomic, transactional stock reservation** using SQLite `BEGIN IMMEDIATE`, with guards against overbooking and replayed confirmation.
- Delivery inspection (delivered, accepted, rejected). Rejected items do **not** return to available stock automatically.
- Private TXT/PDF/JPEG/PNG/WebP evidence upload (5 MB/file), with identity-required retrieval.
- **Gemini extraction** when `GEMINI_API_KEY` is configured; otherwise **offline rule-based parser for TXT only**. PDF and images without Gemini are manually verified; no fabricated AI results.
- Editable extraction-verification form with human confirmation. Backend reconciliation uses **verified document fields + agreed offer price**, not model-calculated amounts.
- Discrepancy flags, reviewer decisions and notes; **no real payment integrations**.
- Append-only operational event history, Hindi farmer explanation, browser speech synthesis when supported, demo reset, responsive layout.
- Built-in Node test suite for matching, quantity handling, amount calculations and receipt text parsing.

## Best 4-minute demo

1. **Overview** → 95 kg of tomatoes. FreshMart orders 80 kg Grade A, but only 55 kg Grade A is available → **25 kg shortage**. Ravi's 40 kg Grade B is safe but **ineligible for FreshMart**.
2. **Buyer orders** → SauceWorks accepts Grade B at **₹16/kg**, maximum **30 kg**. Change demand to 15 kg and see the eligible offer cap change; revert to 30 kg for the main flow.
3. **Recovery case** → Send SauceWorks a 30 kg offer. For a fast demo click **Simulate buyer acceptance** (clearly marked as demo), then **Confirm FPO reservation**. Alternatively, sign in on another browser as SauceWorks and accept from the real buyer portal. Stock remaining: **10 kg**. Original FreshMart shortage: **25 kg still open**.
4. **Record delivery inspection** → 30 kg delivered, 28 kg accepted, 2 kg rejected.
5. **Settlement & review** → Upload `sample-receipts/inspection.txt` as *Delivery inspection receipt*, click **Parse text** (or **AI extract** when configured), then **Verify fields**. Upload `sample-receipts/buyer-statement.txt` as *Buyer settlement statement*, extract and verify.
6. Backend calculates **3 kg quantity difference × ₹16/kg = ₹48**. Inspection-based gross **₹448**; buyer-stated basis **₹400**. Reviewer selects *Request more evidence* and enters a reason. Settlement stays **UNPAID**.
7. **Activity log** → inspect the history. **Overview** → see amount under review while the case is unresolved. Try changing the buyer statement's accepted quantity to 21 in the TXT sample: the discrepancy changes to ₹112 (7 × ₹16), proving it is **not hardcoded**.

**Tip:** Sample receipts are synthetic. Judges should understand that amounts are illustrative and no real buyers or prices were verified.

## Turn on actual Gemini extraction (optional)

1. Copy `.env.example` to `.env`.
2. Set `GEMINI_API_KEY=your_key_here` and optionally `GEMINI_MODEL=gemini-2.5-flash`.
3. Restart the server: `npm start`.
4. Upload a supported document, click **AI extract**, check the proposed values, and verify manually.

Keys are used **only in the Node server**, not placed in browser JavaScript. Gemini requires outbound network access and an active API quota. `source_reference` is proposed evidence context, not guaranteed grounding; always verify page/line against the document. API failure shows an error rather than pretending successful extraction.

## Project files

```text
agrova-v2/
  server.mjs                Node HTTP API, session auth, SQLite transactions,
                            private uploads, optional Gemini integration
  lib/db.mjs                Data model, seed, hashing, event log
  lib/domain.mjs            Eligibility, offer cap, settlement, TXT parser
  public/index.html         Single-page app shell
  public/styles.css         Screens and responsive style
  public/app.js             FPO dashboard, buyer portal and workflows
  sample-receipts/*.txt     Two editable genuine-input demo test files
  tests/domain.test.mjs     Node built-in automated unit tests
  .env.example              Server secrets/port template
  START-WINDOWS.bat         Windows launcher
  Dockerfile                Example container deployment
  README.md
```

## Storage and data rules

- Data: `storage/agrova.sqlite`, created on first start. Evidence: `storage/<random-uuid>.bin`. Entire `storage/` is deliberately ignored by Git and excluded from the distributable ZIP.
- Authentication: salted `scrypt` password hashing + HTTP-only cookies. Sessions expire after 12 hours. Buyer accounts only see orders and offers belonging to their buyer ID; FPO manager controls lots, deliveries, settlements and evidence.
- SQLite `BEGIN IMMEDIATE` serializes write reservations **on this server**; you must keep one shared SQLite file/volume, not separate per-instance databases, if multiple clients access it.
- Unverified AI extraction is never used as approved settlement data. Verified documents are kept and can be revised, with event log entries.
- The accepted offer captures the **agreed rate snapshot**. A later change to an existing buyer order's rate invalidates reservation of an old accepted offer.
- Repeated reservation calls are rejected. Availability never includes already-reserved or delivered volume.
- Payments are not transferred and approved settlements are explicitly marked **reviewed/unpaid**.

## Security, limitations, and production migration

This is a **functional demo, not an audited production system**. Do not upload actual farmers' identity documents, bank details, or commercially sensitive evidence without a proper security deployment review.

- Shared central SQLite server is implemented. **Supabase/PostgreSQL, Supabase Auth/RLS, and Supabase Storage are NOT connected.** This was a deliberate zero-dependency runnable implementation so the delivered ZIP can be executed without account credentials, internet or package installation. Production migration to PostgreSQL/Supabase should add RLS and transactional stock locking in Postgres.
- Security work for production: enforce HTTPS, external identity verification, CSRF protection, login rate limits, tighter file validation/virus scanning, per-FPO tenant isolation, access to buyer-specific delivery evidence as applicable, structured audit retention, automated backups, database migrations and deployment-specific secret management.
- Buyer pickup distance and deadlines are illustrative; no real transport/routing API exists. Payment gateway and forecasting are intentionally out of scope.
- One lot currently has one grade; a real grading workflow needs subdivided lots with inspection revisions.
- Offers are whole-reservation deliveries, not staggered shipments. More sophisticated per-subshipment custody and rejected-goods returns should be separate inventory transactions.
- The offline TXT parser is **not AI**, may miss labels and cannot extract PDF/images. Without Gemini, human-manual verification remains available.
- This project deliberately uses **Node.js built-ins + plain JavaScript/CSS** rather than Next.js + Supabase: that keeps it runnable and verifiable immediately; a framework/backend migration can follow after the demo.

## Reset / restart

Use **Reset demo** in the manager's UI to restore the three lots, two buyer orders and one core recovery case. It clears the relational demo business records; old binary evidence files may remain in `storage/` until cleaned by an administrator. To perform a completely fresh start, stop the server and delete the `storage/agrova.sqlite*` database files and orphan evidence binaries. User accounts are re-created on first launch.
