# UI Context

## Theme

Dark-first design language. A technical, data-dense workspace aesthetic — near-black backgrounds, layered surfaces, and vivid accent colors for interactive elements and data visualizations. The feel should be professional and analytical (think: Bloomberg Terminal meets Modern SaaS), not playful. Charts and data visualizations use the accent palette for clarity. Light mode is not supported in MVP.

## Colors

| Role            | CSS Variable        | Value     |
| --------------- | ------------------- | --------- |
| Page background | `--bg-base`         | `#0a0a0b` |
| Surface         | `--bg-surface`      | `#141416` |
| Elevated        | `--bg-elevated`     | `#1c1c1f` |
| Primary text    | `--text-primary`    | `#f4f4f5` |
| Secondary text  | `--text-secondary`  | `#a1a1aa` |
| Muted text      | `--text-muted`      | `#71717a` |
| Primary accent  | `--accent-primary`  | `#3b82f6` |
| Accent success   | `--accent-success`  | `#22c55e` |
| Accent warning   | `--accent-warning`  | `#f59e0b` |
| Accent danger    | `--accent-danger`   | `#ef4444` |
| Border          | `--border-default`  | `#27272a` |
| Border hover    | `--border-hover`    | `#3f3f46` |
| Error           | `--state-error`     | `#ef4444` |
| Success         | `--state-success`   | `#22c55e` |

Visibility score uses a gradient from danger → warning → success mapping to 0 → 50 → 100.

## Typography

| Role      | Font        | Variable         |
| --------- | ----------- | ---------------- |
| UI text   | Geist Sans  | `--font-sans`    |
| Code/mono | Geist Mono  | `--font-mono`    |

Fonts are loaded via `next/font/google` in the root layout. Use Tailwind's font stack classes.

## Border Radius

| Context           | Class           |
| ----------------- | --------------- |
| Inline / small UI | `rounded-md`    |
| Cards / panels    | `rounded-lg`    |
| Modals / overlays | `rounded-xl`    |
| Buttons           | `rounded-lg`    |
| Inputs            | `rounded-md`    |

## Component Library

shadcn/ui on top of Tailwind CSS v4. Components live in `components/ui/`. Use the shadcn CLI to add new components rather than writing from scratch. Available shadcn components for MVP: Button, Card, Input, Label, Dialog, DropdownMenu, Avatar, Badge, Skeleton, Tabs, Tooltip, Separator, Progress.

## Layout Patterns

- **Landing page:** Full-viewport hero with centered content, value proposition, single CTA
- **Dashboard shell:** Fixed left sidebar (240px) with nav links, top header bar with user avatar, main content area scrolls independently
- **Sidebar:** Dark surface background (`--bg-surface`), border-right separator, navigation links with accent highlight for active route
- **Cards:** Elevated surface (`--bg-elevated`), subtle border, hover state with brighter border
- **Charts:** Dark backgrounds with accent-colored data series, minimal gridlines
- **Modals:** Centered overlay with backdrop blur, elevated surface, border
- **Empty states:** Centered content with muted illustration area, descriptive text, single CTA
- **Loading:** Skeleton components matching the shape of loaded content

## Icons

Lucide React. Stroke-based icons only. Sizing: `h-4 w-4` for inline text and small UI, `h-5 w-5` for buttons and nav items, `h-6 w-6` for standalone icon displays. Use `strokeWidth={2}` default.

## Responsive Behavior

- Landing page: Stack vertically on mobile, side-by-side on desktop
- Dashboard: Collapsible sidebar (hamburger menu) on screens below 768px; fixed sidebar above
- Cards: Single column on mobile, 2-column grid on tablet, 3-column on desktop
- Tables: Horizontal scroll on small screens
