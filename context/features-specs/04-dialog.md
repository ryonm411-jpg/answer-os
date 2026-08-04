# Dialogs

## Goal

Implement the reusable dialog system for AnswerOS.

Dialogs should manage user interactions that require confirmation or structured input.

Use shadcn Dialog components and follow the shared design tokens defined in `ui-context.md`.

Do not implement API calls or persistence.

---

## Dialog State

Create a dedicated hook:

`hooks/use-dialogs.ts`

The hook manages:

- active dialog
- open / closed state
- form state
- loading state

All dialogs should use this shared state.

---

# Add Domain

Primary onboarding dialog.

Opened from:

- Dashboard empty state
- Navigation sidebar
- Future onboarding flow

Fields:

- Domain

Example:

```
https://company.com
```

Requirements:

- trim whitespace
- normalize protocol
- normalize www prefix
- validate domain format

Display validation errors inline.

Primary button:

```
Add Domain
```

Do not submit to an API.

---

# Edit Domain

Allows users to update an existing domain.

Fields:

- Domain

Pre-fill the current value.

Auto-focus the input.

Enter submits.

Escape closes.

No persistence.

---

# Remove Domain

Confirmation dialog.

Display:

```
Remove domain?

This removes the domain from AnswerOS.

Previous scan history will be permanently deleted.
```

No text input required.

Primary button uses destructive styling.

---

# Run Scan

Confirmation dialog.

Display:

```
Run a new visibility scan?

Scanning may take several minutes.
```

Actions:

- Cancel
- Start Scan

No background job implementation yet.

---

# Future Dialogs

Reserve dialog patterns for:

- Add Competitor
- Edit Competitor
- Delete Competitor
- Upgrade Plan
- Billing
- User Settings
- Scan Details
- Recommendation Details

Do not implement.

---

## Navigation Integration

Wire dialog triggers only.

Dashboard

- Add Domain → Add Domain dialog

Sidebar

- Add Domain → Add Domain dialog

Domain Details

- Edit Domain → Edit Domain dialog
- Remove Domain → Remove Domain dialog

Do not implement business logic.

---

## Mock Data

Use local mock data only.

No:

- API routes
- Prisma
- Trigger.dev
- Redis
- AI providers

---

## Acceptance Criteria

- dialog hook manages all dialog state
- dialogs open and close correctly
- keyboard shortcuts function correctly
- validation messages display correctly
- destructive actions use destructive styling
- no TypeScript errors
- no ESLint errors