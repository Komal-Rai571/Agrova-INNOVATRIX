# Agrova V3.1 — FPO Connect (Patch Release)

Team INNOVATRIX | Applies on top of V3 source in `agrova-v3/`.

## Included changes

- FPO organisation signup with password confirmation and show/hide controls.
- Email verification: single-use 24-hour link; unverified new accounts cannot log in.
- Forgot/reset password: single-use 30-minute link; reset signs out previous sessions.
- Dedicated SQLite workspace for each newly registered FPO.
- FPO-assisted farmer registration, farmer IDs, and linked crop lots.
- Responsive login, registration, dashboard and compact mobile navigation.
- Existing V3 demo, recovery, shortage fulfillment and settlement workflows kept.

## Before applying the patches

1. Shut down the running development server (`Ctrl+C`).
2. Commit or preserve any existing edits. Create a feature branch.
3. Backup `agrova-v3/storage/` outside the Git repository. Do not commit its contents.
4. Run `git apply --check` and then `git apply` for the three provided patches from the repository root.
5. Do not copy any other project folder over your original working directory.

## Local test

```powershell
cd agrova-v3
npm test
npm start
```

Open `http://localhost:3000` and choose **Create FPO account**. With no email provider configured, the server **prints a development-only verification URL**; it does **not** send real email. For real sending, configure Resend via `.env.example`. Never commit `.env` or API keys.

The original demo login continues to exist for the hackathon dataset. New registered FPO accounts get empty isolated workspaces rather than the example farmers.

## Limitations and safety

This release is designed for free *local development*, not public production onboarding. The farmer portal is not a self-service login, and SMS/phone OTP is not implemented. Provider-backed email sending requires sender/domain verification and may be subject to free-plan limits. Use fictional/test farmer contact information until the system has had an independent security/privacy review. For real multi-tenant production use, migrate to a security-hardened server and database, stronger sessions/CSRF protections, backups, and appropriately reviewed tenant isolation.

## Release checklist

- [ ] 18/18 automated tests pass.
- [ ] Existing V3 manager account and original recovery/settlement flow work.
- [ ] New FPO signup shows password validation/confirmation.
- [ ] Unverified FPO cannot log in.
- [ ] Verification URL works once.
- [ ] New FPO sees only its own farmers/lots.
- [ ] Mobile screens and menu checked on actual phone or device emulation.
- [ ] `.env`, secrets and `storage/` are not staged.
- [ ] Reviewed PR merged before tagging `v3.1.0`.
