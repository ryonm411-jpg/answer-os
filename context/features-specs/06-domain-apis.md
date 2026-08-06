# Domain API

## Goal

Implement the backend REST API for managing a user's monitored company and domain.

This feature only implements the API layer.

Do not connect the frontend yet.

Follow the architecture defined in:

- `architecture.md`
- `code-standards.md`

---

## Routes

Create the following endpoints.

### GET /api/domain

Returns the authenticated user's company.

Response includes:

- company name
- domain
- onboarding status

If the user has not completed onboarding, return `404`.

---

### POST /api/domain

Creates the authenticated user's company.

Request:

```json
{
  "name": "Acme",
  "domain": "acme.com"
}
```

Rules:

- associate with authenticated Clerk user
- normalize the domain
- validate the domain
- reject duplicate domains
- each user may create only one company in the MVP

Return:

`201 Created`

---

### PATCH /api/domain

Updates company information.

Allowed fields:

- name
- domain

Rules:

- only the authenticated owner may update
- validate domain before saving
- prevent duplicate domains

---

### DELETE /api/domain

Deletes the authenticated user's company.

Rules:

- authenticated users only
- owner only

Cascade delete related records using the existing Prisma relations.

Do not manually delete child records.

---

## Authentication

Use Clerk authentication.

Requirements:

- unauthenticated requests return `401`
- authenticated users may only access their own company
- ownership is determined by `clerkUserId`

Never trust IDs supplied by the client.

---

## Validation

Validate all request bodies.

Requirements:

- trim whitespace
- normalize protocol
- remove `www.`
- reject invalid domains
- reject empty names

Return validation errors using standard HTTP status codes.

---

## Error Handling

Return consistent response shapes.

Success:

```json
{
  "data": {}
}
```

Failure:

```json
{
  "error": {
    "message": "..."
  }
}
```

Use:

- 200
- 201
- 400
- 401
- 403
- 404
- 409

when appropriate.

---

## Business Rules

MVP constraints:

- one company per authenticated user
- one unique domain per company
- domains are globally unique
- no organizations
- no teams
- no shared ownership

---

## Out of Scope

Do not implement:

- competitor management
- scan creation
- recommendations
- prompt generation
- background jobs
- Redis
- AI provider calls

This feature manages company data only.

---

## Future

Reserved endpoints:

- POST /api/domain/scan
- GET /api/domain/visibility
- GET /api/domain/recommendations
- GET /api/domain/history

Do not implement.

---

## Definition of Done

- all CRUD routes compile successfully
- Clerk authentication protects every route
- ownership checks are enforced
- domain validation works correctly
- duplicate domains are rejected
- related records cascade correctly
- no TypeScript errors
- no ESLint errors
- `npm run build` passes