# Authentication

## Goal

Implement user authentication for AnswerOS using Clerk.

Follow the architecture defined in `architecture.md`.

---

## Provider

Wrap the application with:

- ClerkProvider

Use:

- Clerk dark theme

---

## Routes

Create:

- /sign-in
- /sign-up

Use Clerk's built-in authentication components.

Desktop:

- left information panel
- right authentication form

Mobile:

- authentication form only

---

## Protection

Use:

proxy.ts

Public routes:

- /sign-in
- /sign-up

Protect all other routes.

---

## Redirects

/

Authenticated:

→ /editor

Unauthenticated:

→ /sign-in

Successful authentication:

→ /editor

Sign out:

→ /sign-in

---

## Editor Integration

Navbar displays:

- UserButton

Use Clerk's default profile and account flows.

---

## Future

Reserved:

- Organizations
- RBAC
- Billing
- Enterprise SSO