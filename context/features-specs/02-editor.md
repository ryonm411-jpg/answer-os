# Editor Shell

The editor shell is the primary authenticated layout for AnswerOS.

Every page inside the application should render within this shell to provide a consistent navigation experience.

The shell consists of:

- Top Navigation
- Left Navigation Sidebar
- Main Content Area
- Future Right Drawer (reserved)

The layout should be desktop-first, responsive, and reusable across all authenticated pages.

---

## Top Navigation

Create:

`components/editor/editor-navbar.tsx`

Requirements:

- fixed-height navbar
- sticky to the top
- spans the full application width
- dark background using existing theme tokens
- subtle bottom border
- consistent horizontal padding

### Left Section

Contains:

- sidebar toggle button
- current domain name
- latest scan status badge (future)

Sidebar toggle uses:

- `PanelLeftOpen`
- `PanelLeftClose`

depending on sidebar state.

Example:

```
☰   shopify.com
```

---

### Center Section

Reserved for future features.

Potential additions:

- Global Search
- Command Palette
- Breadcrumb Navigation

Do not implement yet.

---

### Right Section

Reserved for future features.

Potential additions:

- Notifications
- Running Scan Indicator
- User Menu
- Organization Switcher

Leave empty.

---

## Navigation Sidebar

Create:

`components/editor/navigation-sidebar.tsx`

Requirements:

- floating sidebar
- overlays page content
- opening should never shift the layout
- slides in from the left
- fixed position
- full viewport height
- dark background
- right border using theme tokens
- subtle shadow

Props:

```ts
interface NavigationSidebarProps {
  isOpen: boolean
  onClose: () => void
}
```

---

### Header

Display:

```
AnswerOS
```

with a close button.

---

### Navigation

Use shadcn navigation components.

Initial navigation items:

- Dashboard
- Domains
- Scan History
- Reports
- Settings

Only Dashboard should be active initially.

The remaining items should be placeholders.

---

### Footer

Pinned to the bottom.

Contains a full-width primary button.

Button:

- Plus icon
- "Add Domain"

Selecting this will eventually open the domain onboarding dialog.

Do not implement the dialog yet.

---

## Main Content Area

Create:

`components/editor/editor-layout.tsx`

Responsibilities:

- render navbar
- render navigation sidebar
- manage sidebar open state
- render page content

Children should render inside a responsive content container.

This area will host:

- Dashboard
- Domain Overview
- Visibility Reports
- Scan Results
- Recommendations
- Settings

---

## Dialog Pattern

Use the existing design tokens defined in `globals.css`.

Do not build feature dialogs yet.

Future dialogs should support:

- title
- description
- footer
- cancel action
- primary action

Use shadcn Dialog primitives.

---

## Responsive Behaviour

Desktop

- sidebar overlays content
- no layout shift
- backdrop displayed
- Escape closes sidebar
- clicking backdrop closes sidebar

Tablet

- same behaviour as desktop

Mobile

- sidebar becomes full width
- navbar remains fixed

---

## Accessibility

Support:

- keyboard navigation
- focus trapping
- Escape to close
- visible focus states
- proper ARIA labels

---

## Future Extensions

The shell should support future features without structural changes.

Planned additions include:

- Global Search
- Command Palette
- AI Scan Progress
- Notifications
- Organization Support
- Team Collaboration
- Theme Switcher
- Keyboard Shortcuts

---

## Definition of Done

- components compile without TypeScript errors
- no ESLint errors
- responsive layout functions correctly
- sidebar animation is smooth
- opening the sidebar does not shift content
- dialog styling follows shared design tokens
- shell is reusable across every authenticated route