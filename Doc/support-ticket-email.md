# Support Ticket Email Delivery

Detailed runbook for how support tickets are stored and emailed from the app.

## Overview
- The app saves each submission to Firestore collection `supportTickets`.
- After saving, it enqueues an email document in Firestore collection `mail`.
- The Firebase Extension **Trigger Email from Firestore** processes `mail` docs and sends an email from `no-reply@eywasoft.co.uk` to `support@eywasoft.co.uk`.
- Authentication uses Microsoft 365 SMTP with username/password.

## App Flow (client)
1) User submits support/feedback form.
2) `SupportTicketService` writes a `supportTickets/{id}` doc containing the form data.
3) It then writes a `mail/{id}` doc with subject/body + `to: support@eywasoft.co.uk`.
4) UI shows success; if email queue fails, the user still gets a success for ticket storage plus a prompt to email manually.

## Firebase Pieces
- Firestore collections:
  - `supportTickets`: created by client; readable only by backend (per rules).
  - `mail`: created by client to trigger the extension; not readable by clients.
- Extension: **Trigger Email from Firestore** (fires on `mail` collection).

## Firestore Rules (intent)
- Allow `create` on `supportTickets` and `mail` for authenticated users (anonymous sign-in is enabled).
- Deny read/update/delete on these collections to clients.
- Lock down other paths by default.

## Extension Configuration (Username & Password mode)
Fill these values (leave anything not listed as “Parameter not set”):
- Cloud Functions location: your chosen region (e.g., `us-central1` already fixed at install).
- Firestore Instance ID: `(default)`
- Firestore Instance Location: `europe-west2` (London)
- Authentication Type: `UsernamePassword`
- SMTP connection URI: `smtp://no-reply@eywasoft.co.uk:PASSWORD@smtp.office365.com:587`  
  (Put the real password in place of `PASSWORD`. Do not also fill SMTP password.)
- All OAuth2 fields: leave unset.
- Email documents collection: `mail`
- Default FROM address: `no-reply@eywasoft.co.uk`
- Default REPLY-TO address: `support@eywasoft.co.uk`
- Users collection / Templates collection: unset
- Firestore TTL type: `never`
- TLS Options / advanced parameters: unset

## Microsoft 365 Prerequisites
Because the extension uses SMTP AUTH:
1) Security Defaults: must be OFF (otherwise SMTP AUTH is blocked).
2) Tenant SMTP AUTH: in Exchange Admin Center (EAC) → Settings → Mail flow/SMTP AUTH → enable “Authenticated SMTP” org-wide.
3) Mailbox SMTP AUTH: EAC → Recipients → Mailboxes → `no-reply@eywasoft.co.uk` → Email apps / Mailbox features → enable “Authenticated SMTP”.
4) Credentials: ensure the password used in the SMTP URI matches the mailbox password (or app password).

## Testing
1) Submit a support ticket in the app.
2) In Firestore, confirm:
   - New doc in `supportTickets`.
   - New doc in `mail`.
3) Check the extension logs:
   - Expect `delivery.state` success.
   - If `535 5.7.139 Authentication unsuccessful` appears, SMTP AUTH is still blocked (see prerequisites above).
4) Verify the email arrives in `support@eywasoft.co.uk`.

## Common Errors & Fixes
- `535 5.7.139 Authentication unsuccessful, user is locked by your organization's security defaults policy`: Security Defaults still blocking, or Authenticated SMTP not enabled for tenant/mailbox. Re-check Microsoft steps 1–3.
- `Invalid URI: please reconfigure with a valid SMTP connection URI`: Set the full SMTP URI in the extension and clear the separate SMTP password field (or use the password field and omit password from URI—do only one).

## Ops / Maintenance
- Password rotation: update the SMTP URI with the new password and re-save the extension.
- If moving away from SMTP: implement a Cloud Function using Microsoft Graph `Mail.Send` (app-only) to avoid SMTP AUTH entirely.
